const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  room: { type: String, default: 'general' },
  from: {
    userId: String,
    username: String
  },
  to: {
    userId: String,
    username: String
  },
  content: String,
  file: {
    name: String,
    type: String,
    url: String
  },
  reactions: [{ userId: String, reaction: String }],
  readBy: [String],
  deleted: { type: Boolean, default: false },
  edited: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);
