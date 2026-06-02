const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chatroom', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true, maxlength: 1000 },
    timestamp: { type: Date, default: Date.now },

    embedding: {
      type: [Number],
      required: false,
    },
  },
  { timestamps: true }
);

messageSchema.index({ roomId: 1, timestamp: 1 });
messageSchema.index({ userId: 1, timestamp: -1 });

messageSchema.post('save', async function (doc) {
  try {
    const chromaService = require('../services/chromaService');
    await chromaService.addMessage(doc);
  } catch (err) {
    console.error('Error in Message post-save hook indexing to Chroma:', err.message);
  }
});

module.exports = mongoose.model('Message', messageSchema);
