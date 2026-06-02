require('dotenv').config();
const { initializeChroma, getCollection } = require('./config/chroma');
const connectDB = require('./config/database');
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Message = require('./models/Message');

const app = express();
const PORT = process.env.PORT || 5000;

// Route imports
const messageRoutes = require('./routes/message');
const aiRoutes = require('./routes/ai');
const authRoutes = require('./routes/auth');
const chatroomsRoutes = require('./routes/chatrooms');

// Middlewares
app.use(express.json());
app.use(cors());

// API routes
app.use('/api/messages', messageRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/chatrooms', chatroomsRoutes);

// AI status endpoint
app.get('/api/ai/status', async (req, res) => {
  const geminiConfigured = !!process.env.GEMINI_API_KEY;
  
  let chromadbStatus = 'unavailable';
  let messageCount = 0;
  
  try {
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
      messageCount: messageCount,
    },
  };

  res.json({
    ...statusObj,
    status: statusObj, // For compatibility with different frontend components
  });
});

// Gemini client for embeddings
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Embedding function to generate vector representations
async function generateEmbedding(text) {
  try {
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent(text);
    const embedding = result.embedding?.values;

    if (!embedding) {
      throw new Error('Failed to generate embedding');
    }

    return embedding;
  } catch (err) {
    console.error(
      'GenAI Embedding API Error:',
      err.response?.data || err.message || err
    );
    throw err;
  }
}

// Socket.io real-time setup
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('join-room', ({ roomId, userId, username }) => {
    socket.join(roomId);
    console.log(`User ${username} joined room ${roomId}`);
    socket.to(roomId).emit('user-joined', { username });
  });

  socket.on('leave-room', ({ roomId, username }) => {
    socket.leave(roomId);
    console.log(`User ${username} left room ${roomId}`);
    socket.to(roomId).emit('user-left', { username });
  });

  socket.on('send-message', async ({ roomId, userId, username, message }) => {
    try {
      let embedding = null;
      try {
        embedding = await generateEmbedding(message);
      } catch (embedErr) {
        console.error(
          'Embedding error, saving WITHOUT embedding:',
          embedErr.message
        );
      }
      const savedMessage = await Message.create({
        roomId,
        userId,
        username,
        content: message,
        embedding,
        timestamp: new Date(),
      });
      io.to(roomId).emit('new-message', savedMessage);
      console.log(`Message from ${username} in room ${roomId}: ${message}`);
    } catch (error) {
      console.error('Failed to save message:', error.message);
    }
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
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
