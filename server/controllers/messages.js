const express = require('express');
const Message = require('../models/Message');
const auth = require('../utils/auth');

const router = express.Router();

// Get message history for a room
router.get('/:room', auth, async (req, res) => {
  try {
    const messages = await Message.find({ room: req.params.room, deleted: false }).sort({ createdAt: 1 }).limit(100);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
