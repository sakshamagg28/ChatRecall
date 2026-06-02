const mongoose = require('mongoose');

const chatroomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  topic: { type: String },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

module.exports = mongoose.model('Chatroom', chatroomSchema);
