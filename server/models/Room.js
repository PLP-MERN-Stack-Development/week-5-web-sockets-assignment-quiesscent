const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  members: [String], // userIds
});

module.exports = mongoose.model('Room', roomSchema);
