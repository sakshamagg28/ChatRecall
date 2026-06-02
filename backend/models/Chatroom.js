const mongoose = require('mongoose');

const chatroomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },
    topic: {
      type: String,
      default: 'General',
      trim: true,
      maxlength: 80,
    },
    isPublic: { type: Boolean, default: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    lastActivity: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

chatroomSchema.index({ name: 'text', topic: 'text', description: 'text' });
chatroomSchema.index({ members: 1 });
chatroomSchema.index({ lastActivity: -1 });

module.exports = mongoose.model('Chatroom', chatroomSchema);
