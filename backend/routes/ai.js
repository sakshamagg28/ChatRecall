const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const chromaService = require('../services/chromaService');
const geminiService = require('../services/gemini');
const Message = require('../models/Message');

router.post('/summarize/:chatroomId', async (req, res) => {
  try {
    const { chatroomId } = req.params;
    const messageLimit = req.body.messageLimit || 50;

    // Get last messages from the chatroom
    const messages = await Message.find({ roomId: chatroomId })
      .sort({ timestamp: 1 })
      .limit(messageLimit)
      .lean();

    // Prepare the conversation text
    const textToSummarize = messages
      .map((m) => `${m.username}: ${m.content}`)
      .join('\n');

    // Get summary from AI service (now Gemini)
    const summary = await aiService.summarizeText(textToSummarize);

    res.json({ messageCount: messages.length, summary });
  } catch (error) {
    console.error('Summarization error:', error);
    res
      .status(500)
      .json({ error: error.message || 'Failed to summarize' });
  }
});

// Semantic Search Endpoint
router.post('/search', async (req, res) => {
  try {
    const { query, roomId, limit } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, message: 'Query is required' });
    }

    const results = await chromaService.semanticSearch(query, {
      roomId,
      limit: limit ? parseInt(limit) : 10
    });

    res.json({ success: true, results });
  } catch (error) {
    console.error('Semantic search route error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to search' });
  }
});

// Q&A Endpoint
router.post('/qa', async (req, res) => {
  try {
    const { question, roomId, contextLimit, relevanceThreshold } = req.body;
    if (!question) {
      return res.status(400).json({ success: false, message: 'Question is required' });
    }

    // Retrieve relevant context from ChromaDB
    const searchLimit = contextLimit ? parseInt(contextLimit) : 5;
    const relevantMessages = await chromaService.semanticSearch(question, {
      roomId,
      limit: searchLimit
    });

    // Filter messages by relevance threshold if provided
    const threshold = relevanceThreshold ? parseFloat(relevanceThreshold) : 0;
    const filteredMessages = relevantMessages.filter(msg => msg.relevanceScore >= threshold);

    if (filteredMessages.length === 0) {
      return res.json({
        success: false,
        message: 'I could not find any relevant discussions to answer your question.'
      });
    }

    // Construct context string
    const context = filteredMessages
      .map(msg => `${msg.username}: ${msg.content}`)
      .join('\n');

    // Call Gemini to get answer
    const answer = await geminiService.answerQuestion(context, question);

    res.json({
      success: true,
      answer,
      sources: filteredMessages,
      contextUsed: filteredMessages.length
    });
  } catch (error) {
    console.error('QA route error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to answer question' });
  }
});

module.exports = router;
