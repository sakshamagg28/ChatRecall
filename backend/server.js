require('dotenv').config();
const { initializeChroma } = require('./config/chroma');
const connectDB = require('./config/database');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Message = require('./models/Message');
const Chatroom = require('./models/Chatroom');
const socketAuth = require('./middleware/socketAuth');
const { rateLimiter, requestLogger, securityHeaders } = require('./middleware/security');

const app = express();
const PORT = process.env.PORT || 5050;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Route imports
const messageRoutes = require('./routes/message');
const aiRoutes = require('./routes/ai');
const authRoutes = require('./routes/auth');
const chatroomsRoutes = require('./routes/chatrooms');

// Middlewares
app.use(securityHeaders);
app.use(requestLogger);
app.use(rateLimiter);
app.use(express.json({ limit: '1mb' }));
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));

// API routes
app.use('/api/messages', messageRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/chatrooms', chatroomsRoutes);

// Socket.io real-time setup
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');

const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const onlineUsers = new Map();

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const emitOnlineUsers = () => {
  io.emit('online-users', Array.from(onlineUsers.values()).map((entry) => entry.user));
};

const loadSocketRoom = async (roomId, userId) => {
  if (!isValidObjectId(roomId)) {
    return { error: 'Invalid room ID' };
  }

  const chatroom = await Chatroom.findById(roomId);
  if (!chatroom) {
    return { error: 'Chatroom not found' };
  }

  const isMember = chatroom.members.some((memberId) => memberId.equals(userId));
  if (!chatroom.isPublic && !isMember) {
    return { error: 'Access denied to this chatroom' };
  }

  return { chatroom, isMember };
};

io.use(socketAuth);

io.on('connection', (socket) => {
  const user = socket.authUser;
  const existing = onlineUsers.get(user.id);
  onlineUsers.set(user.id, {
    user,
    sockets: existing ? existing.sockets + 1 : 1,
  });
  emitOnlineUsers();
  console.log(`User ${user.username} connected via socket ${socket.id}`);

  socket.on('join-room', async ({ roomId }, callback) => {
    try {
      const { chatroom, isMember, error } = await loadSocketRoom(roomId, socket.user._id);
      if (error) {
        socket.emit('room-error', { roomId, message: error });
        return callback?.({ success: false, message: error });
      }

      if (!isMember) {
        chatroom.members.push(socket.user._id);
        if (!chatroom.owner) {
          chatroom.owner = socket.user._id;
        }
        await chatroom.save();
      }

      socket.join(roomId);
      socket.to(roomId).emit('user-joined', { username: user.username, userId: user.id });
      callback?.({ success: true });
    } catch (error) {
      console.error('join-room error:', error.message);
      callback?.({ success: false, message: 'Failed to join room' });
    }
  });

  socket.on('leave-room', ({ roomId }, callback) => {
    socket.leave(roomId);
    socket.to(roomId).emit('user-left', { username: user.username, userId: user.id });
    callback?.({ success: true });
  });

  socket.on('send-message', async ({ roomId, message }, callback) => {
    try {
      const content = message?.trim();
      if (!content) {
        return callback?.({ success: false, message: 'Message content is required' });
      }

      const { chatroom, isMember, error } = await loadSocketRoom(roomId, socket.user._id);
      if (error) {
        socket.emit('message-error', { roomId, message: error });
        return callback?.({ success: false, message: error });
      }

      if (!isMember) {
        chatroom.members.push(socket.user._id);
      }
      if (!chatroom.owner) {
        chatroom.owner = socket.user._id;
      }
      chatroom.lastActivity = new Date();
      await chatroom.save();

      const savedMessage = await Message.create({
        roomId: chatroom._id,
        userId: socket.user._id,
        username: user.username,
        content,
        timestamp: new Date(),
      });
      io.to(roomId).emit('new-message', savedMessage);
      callback?.({ success: true, message: savedMessage });
    } catch (error) {
      console.error('Failed to save message:', error.message);
      callback?.({ success: false, message: 'Failed to save message' });
    }
  });

  socket.on('disconnect', () => {
    const current = onlineUsers.get(user.id);
    if (current && current.sockets > 1) {
      onlineUsers.set(user.id, { ...current, sockets: current.sockets - 1 });
    } else {
      onlineUsers.delete(user.id);
    }
    emitOnlineUsers();
    console.log(`User ${user.username} disconnected from socket ${socket.id}`);
  });
});

app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, _req, res, _next) => {
  console.error('Unhandled server error:', err);
  res.status(err.statusCode || 500).json({
    message: err.message || 'Internal server error',
  });
});

// App startup
(async () => {
  await connectDB();
  await initializeChroma();

  // Index existing messages from MongoDB into ChromaDB
  try {
    const chromaService = require('./services/chromaService');
    const messages = await Message.find({});
    if (messages.length > 0) {
      console.log(`ℹ️ Checking and indexing ${messages.length} existing messages to ChromaDB...`);
      for (const msg of messages) {
        await chromaService.addMessage(msg);
      }
      console.log('✅ Existing messages indexing check finished');
    }
  } catch (err) {
    console.error('Error indexing existing messages:', err.message);
  }

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})();
