const express = require('express');
const Room = require('../models/Room');
const auth = require('../utils/auth');

const router = express.Router();

// Create room
router.post('/', auth, async (req, res) => {
  const { name } = req.body;
  try {
    if (!name) return res.status(400).json({ error: 'Missing room name' });
    const exists = await Room.findOne({ name });
    if (exists) return res.status(400).json({ error: 'Room exists' });
    const room = await Room.create({ name, members: [req.user._id] });
    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// List rooms
router.get('/', auth, async (req, res) => {
  try {
    const rooms = await Room.find();
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
