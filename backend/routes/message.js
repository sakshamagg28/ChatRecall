const express = require('express');
const router = express.Router();
const axios = require('axios');
const Message = require('../models/Message');
const GEMINI_SUMMARIZE_URL = `https://generativelanguage.googleapis.com/v1beta/models/text-bison-001:generateText`;


async function generateEmbedding(text) {
  const response = await axios.post(
    `${GEMINI_EMBEDDING_URL}?key=${process.env.GEMINI_API_KEY}`,
    { content: [{ text }] },
    { timeout: 60000 }
  );
  if (!response.data || !response.data.embedding) {
    throw new Error('Failed to generate embedding');
  }
  return response.data.embedding;
}

router.post('/', async (req, res) => {
  try {
    const { content, username, userId, roomId } = req.body;
    if (!content || !username || !userId || !roomId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const embedding = await generateEmbedding(content);

    const message = new Message({
      content,
      username,
      userId,
      roomId,
      timestamp: new Date(),
      embedding,
    });

    await message.save();
    res.status(201).json(message);
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
