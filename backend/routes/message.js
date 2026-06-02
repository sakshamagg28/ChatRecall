const express = require('express');
const mongoose = require('mongoose');
const Chatroom = require('../models/Chatroom');
const Message = require('../models/Message');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.post('/', async (req, res) => {
  try {
    const { roomId } = req.body;
    const content = req.body.content?.trim();

    if (!content || !roomId) {
      return res.status(400).json({ success: false, message: 'roomId and content are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ success: false, message: 'Invalid roomId' });
    }

    const chatroom = await Chatroom.findById(roomId);
    if (!chatroom) {
      return res.status(404).json({ success: false, message: 'Chatroom not found' });
    }

    const isMember = chatroom.members.some((memberId) => memberId.equals(req.user._id));
    if (!chatroom.isPublic && !isMember) {
      return res.status(403).json({ success: false, message: 'Access denied to this chatroom' });
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
      content,
      username: req.user.username,
      userId: req.user._id,
      roomId,
      timestamp: new Date(),
    });

    res.status(201).json({ success: true, message });
  } catch (error) {
    console.error('Error creating message:', error.message);
    res.status(500).json({ success: false, message: 'Failed to create message' });
  }
});

module.exports = router;
