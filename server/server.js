const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./controllers/auth');
const messageRoutes = require('./controllers/messages');
const roomRoutes = require('./controllers/rooms');
const Message = require('./models/Message');
const User = require('./models/User');
const Room = require('./models/Room');
const auth = require('./utils/auth');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/chatapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests, please try again later.'
});
app.use('/api/', apiLimiter);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/rooms', roomRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Adjust as needed for production
    methods: ['GET', 'POST'],
  },
});

let onlineUsers = {}; // { socketId: { username, userId } }
let userIdToSocket = {}; // { userId: socketId }

// User login (simple, no password, just username and userId)
io.on('connection', (socket) => {
  // JWT authentication for socket
  socket.on('authenticate', async ({ token }) => {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      const user = await User.findById(decoded.id);
      if (!user) return socket.emit('authError', 'Invalid user');
      socket.userId = user._id.toString();
      socket.username = user.username;
      user.online = true;
      await user.save();
      onlineUsers[socket.id] = { username: user.username, userId: user._id };
      userIdToSocket[user._id] = socket.id;
      io.emit('userList', Object.values(onlineUsers));
      io.emit('chatMessage', { user: 'System', message: `${user.username} joined the chat.` });
    } catch (err) {
      socket.emit('authError', 'Invalid token');
    }
  });

  // Typing indicator
  socket.on('typing', ({ room }) => {
    socket.to(room || 'general').emit('typing', { user: socket.username });
  });
  socket.on('stopTyping', ({ room }) => {
    socket.to(room || 'general').emit('stopTyping', { user: socket.username });
  });

  // Join room
  socket.on('joinRoom', async ({ room }) => {
    socket.join(room);
    // Optionally add user to room in DB
    await Room.updateOne({ name: room }, { $addToSet: { members: socket.userId } });
    // Send last 50 messages
    const messages = await Message.find({ room, deleted: false }).sort({ createdAt: 1 }).limit(50);
    socket.emit('roomHistory', messages);
  });

  // Group chat message (with persistence, validation, and room support)
  socket.on('chatMessage', async ({ msg, room = 'general', file }) => {
    if (!socket.username) return;
    // File validation
    if (file && (file.size > 5 * 1024 * 1024 || !/^image|video|application\//.test(file.type))) {
      return socket.emit('fileError', 'Invalid file');
    }
    const message = await Message.create({
      room,
      from: { userId: socket.userId, username: socket.username },
      content: msg,
      file: file ? { name: file.name, type: file.type, url: file.url } : undefined,
    });
    io.to(room).emit('chatMessage', message);
  });

  // Direct message (with persistence)
  socket.on('directMessage', async ({ toUserId, message }) => {
    const toSocketId = userIdToSocket[toUserId];
    if (toSocketId) {
      const msgDoc = await Message.create({
        from: { userId: socket.userId, username: socket.username },
        to: { userId: toUserId },
        content: message,
      });
      io.to(toSocketId).emit('directMessage', msgDoc);
    }
  });

  // User reactions (persisted)
  socket.on('reaction', async ({ messageId, reaction }) => {
    const message = await Message.findByIdAndUpdate(
      messageId,
      { $push: { reactions: { userId: socket.userId, reaction } } },
      { new: true }
    );
    io.emit('reaction', {
      user: { username: socket.username, userId: socket.userId },
      messageId,
      reaction
    });
  });

  // Read receipts
  socket.on('readMessage', async ({ messageId }) => {
    await Message.findByIdAndUpdate(messageId, { $addToSet: { readBy: socket.userId } });
    io.emit('readReceipt', { messageId, userId: socket.userId });
  });

  // Edit message
  socket.on('editMessage', async ({ messageId, newContent }) => {
    const message = await Message.findById(messageId);
    if (message && message.from.userId === socket.userId) {
      message.content = newContent;
      message.edited = true;
      await message.save();
      io.emit('editMessage', message);
    }
  });

  // Delete message
  socket.on('deleteMessage', async ({ messageId }) => {
    const message = await Message.findById(messageId);
    if (message && message.from.userId === socket.userId) {
      message.deleted = true;
      await message.save();
      io.emit('deleteMessage', { messageId });
    }
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    if (socket.username) {
      io.emit('chatMessage', { user: 'System', message: `${socket.username} left the chat.` });
      if (socket.userId) {
        delete userIdToSocket[socket.userId];
        await User.findByIdAndUpdate(socket.userId, { online: false, lastSeen: new Date() });
      }
      delete onlineUsers[socket.id];
      io.emit('userList', Object.values(onlineUsers));
    }
  });
});

// Basic route
app.get('/', (req, res) => {
  res.send('Chat server is running. See /api/ for API endpoints.');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
