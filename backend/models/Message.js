const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chatroom', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  
  // Embedding vector field for semantic search
  embedding: {
    type: [Number],  // Array of numbers representing the vector
    required: false, // Allow optional to not break old messages
  },
});

messageSchema.post('save', async function (doc) {
  try {
    const chromaService = require('../services/chromaService');
    await chromaService.addMessage(doc);
  } catch (err) {
    console.error('Error in Message post-save hook indexing to Chroma:', err.message);
  }
});

module.exports = mongoose.model('Message', messageSchema);
