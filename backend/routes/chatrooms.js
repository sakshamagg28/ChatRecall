const express = require('express');
const Chatroom = require('../models/Chatroom');
const Message = require('../models/Message');
const router = express.Router();

// Create chatroom
router.post('/', async (req, res) => {
  try {
    const { name, topic, userId } = req.body;
    const chatroom = new Chatroom({ name, topic, members: [userId] });
    await chatroom.save();
    res.json({ success: true, chatroom });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Get all chatrooms
router.get('/', async (_req, res) => {
  try {
    const chatrooms = await Chatroom.find();
    res.json({ success: true, chatrooms });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Get single chatroom by ID (add this route)
router.get('/:roomId', async (req, res) => {
  try {
    const chatroom = await Chatroom.findById(req.params.roomId);
    if (!chatroom) {
      return res.status(404).json({ success: false, message: 'Chatroom not found' });
    }
    res.json({ success: true, chatroom });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Get messages for chatroom
router.get('/:roomId/messages', async (req, res) => {
  try {
    const messages = await Message.find({ roomId: req.params.roomId }).sort({ timestamp: 1 });
    res.json({ success: true, messages });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Add message to chatroom
router.post('/:roomId/message', async (req, res) => {
  try {
    const { userId, username, content } = req.body;
    const message = new Message({
      roomId: req.params.roomId,
      userId,
      username,
      content,
      timestamp: new Date(),
    });
    await message.save();
    res.json({ success: true, message });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Join a chatroom
router.post('/:roomId/join', async (req, res) => {
  try {
    const { userId } = req.body;
    const chatroom = await Chatroom.findById(req.params.roomId);
    if (!chatroom) return res.status(404).json({ success: false, message: 'Chatroom not found' });

    if (!chatroom.members.includes(userId)) {
      chatroom.members.push(userId);
      await chatroom.save();
    }
    res.json({ success: true, chatroom });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
