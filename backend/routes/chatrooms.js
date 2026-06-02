const express = require('express');
const mongoose = require('mongoose');
const Chatroom = require('../models/Chatroom');
const Message = require('../models/Message');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const serializeChatroom = async (chatroom) => {
  const room = chatroom.toObject ? chatroom.toObject() : chatroom;
  const messageCount = await Message.countDocuments({ roomId: room._id });
  const members = room.members || [];

  return {
    ...room,
    activeParticipantsCount: members.length,
    messageCount,
    participants: members
      .filter((member) => member && typeof member === 'object' && member.username)
      .map((member) => ({
        user: {
          _id: member._id,
          id: member._id?.toString(),
          username: member.username,
          email: member.email,
          isOnline: false,
        },
      })),
  };
};

const loadAccessibleRoom = async (roomId, userId) => {
  if (!isValidObjectId(roomId)) {
    return { error: { status: 400, message: 'Invalid chatroom ID' } };
  }

  const chatroom = await Chatroom.findById(roomId).populate('members', 'username email');
  if (!chatroom) {
    return { error: { status: 404, message: 'Chatroom not found' } };
  }

  const isMember = chatroom.members.some((member) => member._id.equals(userId));
  if (!chatroom.isPublic && !isMember) {
    return { error: { status: 403, message: 'Access denied to this chatroom' } };
  }

  return { chatroom, isMember };
};

// Create chatroom
router.post('/', async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const description = req.body.description?.trim() || '';
    const topic = req.body.topic?.trim() || 'General';
    const isPublic = req.body.isPublic !== false;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Room name is required' });
    }

    const chatroom = new Chatroom({
      name,
      description,
      topic,
      isPublic,
      owner: req.user._id,
      members: [req.user._id],
    });

    await chatroom.save();
    await chatroom.populate('members', 'username email');
    res.status(201).json({ success: true, chatroom: await serializeChatroom(chatroom) });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Get all chatrooms
router.get('/', async (_req, res) => {
  try {
    const chatrooms = await Chatroom.find()
      .populate('members', 'username email')
      .sort({ lastActivity: -1, createdAt: -1 });
    const serialized = await Promise.all(chatrooms.map(serializeChatroom));
    res.json({ success: true, chatrooms: serialized });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Get single chatroom by ID
router.get('/:roomId', async (req, res) => {
  try {
    const { chatroom, error } = await loadAccessibleRoom(req.params.roomId, req.user._id);
    if (error) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    res.json({ success: true, chatroom: await serializeChatroom(chatroom) });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Get messages for chatroom
router.get('/:roomId/messages', async (req, res) => {
  try {
    const { chatroom, error } = await loadAccessibleRoom(req.params.roomId, req.user._id);
    if (error) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const messages = await Message.find({ roomId: chatroom._id })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    res.json({ success: true, messages: messages.reverse() });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Add message to chatroom through HTTP fallback
router.post('/:roomId/message', async (req, res) => {
  try {
    const { chatroom, error, isMember } = await loadAccessibleRoom(req.params.roomId, req.user._id);
    if (error) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    const content = req.body.content?.trim();
    if (!content) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    if (!isMember) {
      chatroom.members.push(req.user._id);
    }
    if (!chatroom.owner) {
      chatroom.owner = req.user._id;
    }
    chatroom.lastActivity = new Date();
    await chatroom.save();

    const message = await Message.create({
      roomId: chatroom._id,
      userId: req.user._id,
      username: req.user.username,
      content,
      timestamp: new Date(),
    });

    res.status(201).json({ success: true, message });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Join a chatroom
router.post('/:roomId/join', async (req, res) => {
  try {
    const { chatroom, error, isMember } = await loadAccessibleRoom(req.params.roomId, req.user._id);
    if (error) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    if (!isMember) {
      chatroom.members.push(req.user._id);
      if (!chatroom.owner) {
        chatroom.owner = req.user._id;
      }
      await chatroom.save();
      await chatroom.populate('members', 'username email');
    }

    res.json({ success: true, chatroom: await serializeChatroom(chatroom) });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/:roomId/leave', async (req, res) => {
  try {
    if (!isValidObjectId(req.params.roomId)) {
      return res.status(400).json({ success: false, message: 'Invalid chatroom ID' });
    }

    const chatroom = await Chatroom.findById(req.params.roomId);
    if (!chatroom) {
      return res.status(404).json({ success: false, message: 'Chatroom not found' });
    }

    chatroom.members = chatroom.members.filter((memberId) => !memberId.equals(req.user._id));
    await chatroom.save();
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
