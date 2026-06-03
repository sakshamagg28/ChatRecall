const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const chromaService = require('../services/chromaService');
const geminiService = require('../services/gemini');
const Message = require('../models/Message');
const Chatroom = require('../models/Chatroom');
const { requireAuth } = require('../middleware/auth');
const mongoose = require('mongoose');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const parsePositiveInt = (value, fallback, max) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
};

router.get('/status', async (_req, res) => {
  const geminiConfigured = !!process.env.GEMINI_API_KEY;
  let chromadbStatus = 'unavailable';
  let messageCount = 0;

  try {
    const { getCollection } = require('../config/chroma');
    const collection = getCollection();
    if (collection) {
      chromadbStatus = 'available';
      messageCount = await collection.count();
    }
  } catch (error) {
    console.error('Error fetching Chroma status:', error.message);
  }

  const statusObj = {
    features: {
      semanticSearch: geminiConfigured && chromadbStatus === 'available',
      qaFromChats: geminiConfigured && chromadbStatus === 'available',
      summarization: geminiConfigured,
    },
    gemini: { status: geminiConfigured },
    chromadb: {
      status: chromadbStatus,
      messageCount,
    },
  };

  res.json({
    ...statusObj,
    status: statusObj,
  });
});

router.use(requireAuth);

const getAccessibleRoomIds = async (userId) => {
  const rooms = await Chatroom.find({
    $or: [{ isPublic: true }, { members: userId }],
  }).select('_id');

  return rooms.map((room) => room._id.toString());
};

const requireRoomAccess = async (roomId, userId) => {
  if (!isValidObjectId(roomId)) {
    return { error: { status: 400, message: 'Invalid chatroom ID' } };
  }

  const room = await Chatroom.findById(roomId).select('isPublic members');
  if (!room) {
    return { error: { status: 404, message: 'Chatroom not found' } };
  }

  const isMember = room.members.some((memberId) => memberId.equals(userId));
  if (!room.isPublic && !isMember) {
    return { error: { status: 403, message: 'Access denied to this chatroom' } };
  }

  return { room };
};

router.post('/summarize/:chatroomId', async (req, res) => {
  try {
    const { chatroomId } = req.params;
    const messageLimit = parsePositiveInt(req.body?.messageLimit, 50, 200);
    const { error } = await requireRoomAccess(chatroomId, req.user._id);
    if (error) {
      return res.status(error.status).json({ error: error.message });
    }

    // Get last messages from the chatroom
    const messages = await Message.find({ roomId: chatroomId })
      .sort({ timestamp: 1 })
      .limit(messageLimit)
      .lean();

    // Prepare the conversation text
    const textToSummarize = messages
      .map((m) => `${m.username}: ${m.content}`)
      .join('\n');

    if (!textToSummarize) {
      return res.json({
        messageCount: 0,
        summary: 'No messages are available to summarize yet.',
      });
    }

    // Get summary from AI service (now Gemini)
    const summary = await aiService.summarizeText(textToSummarize);

    res.json({ messageCount: messages.length, summary });
  } catch (error) {
    console.error('Summarization error:', error);
    res
      .status(error.statusCode || 500)
      .json({ error: error.message || 'Failed to summarize' });
  }
});

// Semantic Search Endpoint
router.post('/search', async (req, res) => {
  try {
    const query = req.body.query?.trim();
    const { roomId } = req.body;
    const limit = parsePositiveInt(req.body.limit, 10, 50);
    if (!query) {
      return res.status(400).json({ success: false, message: 'Query is required' });
    }

    const allowedRoomIds = roomId
      ? [roomId.toString()]
      : await getAccessibleRoomIds(req.user._id);

    if (roomId) {
      const { error } = await requireRoomAccess(roomId, req.user._id);
      if (error) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
    }

    const results = await chromaService.semanticSearch(query, {
      roomId,
      allowedRoomIds,
      limit,
    });

    res.json({ success: true, results });
  } catch (error) {
    console.error('Semantic search route error:', error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to search' });
  }
});

// Q&A Endpoint
router.post('/qa', async (req, res) => {
  try {
    const question = req.body.question?.trim();
    const { roomId, relevanceThreshold } = req.body;
    if (!question) {
      return res.status(400).json({ success: false, message: 'Question is required' });
    }

    const allowedRoomIds = roomId
      ? [roomId.toString()]
      : await getAccessibleRoomIds(req.user._id);

    if (roomId) {
      const { error } = await requireRoomAccess(roomId, req.user._id);
      if (error) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
    }

    // Retrieve relevant context from ChromaDB
    const searchLimit = parsePositiveInt(req.body.contextLimit, 5, 20);
    const relevantMessages = await chromaService.semanticSearch(question, {
      roomId,
      allowedRoomIds,
      limit: searchLimit
    });

    // Filter messages by relevance threshold if provided
    const parsedThreshold = Number.parseFloat(relevanceThreshold);
    const threshold = Number.isFinite(parsedThreshold) ? parsedThreshold : 0;
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
    const answer = await geminiService.answerQuestion(
      context,
      question
    );

    res.json({
      success: true,
      answer,
      sources: filteredMessages,
      contextUsed: filteredMessages.length
    });
  } catch (error) {
    console.error('QA route error:', error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to answer question' });
  }
});

module.exports = router;
