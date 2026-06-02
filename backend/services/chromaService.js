const { getCollection } = require('../config/chroma');
const { generateEmbedding } = require('./gemini');

class ChromaService {
  async addMessage(message) {
    const collection = getCollection();
    if (!collection) {
      console.warn('⚠️ ChromaDB collection not available, skipping message indexing');
      return;
    }
    try {
      let embedding = message.embedding;
      if (!embedding || embedding.length === 0) {
        embedding = await generateEmbedding(message.content);
        // Save back to MongoDB
        await message.constructor.updateOne({ _id: message._id }, { embedding });
      }

      const payload = {
        ids: [message._id.toString()],
        embeddings: [embedding],
        metadatas: [{
          roomId: message.roomId.toString(),
          userId: message.userId.toString(),
          username: message.username,
          timestamp: message.timestamp.toISOString()
        }],
        documents: [message.content]
      };

      if (typeof collection.upsert === 'function') {
        await collection.upsert(payload);
      } else {
        await collection.add(payload);
      }
      console.log(`✅ Message ${message._id} indexed in ChromaDB`);
    } catch (err) {
      console.error('❌ ChromaDB addMessage error:', err.message);
    }
  }

  async semanticSearch(query, options = {}) {
    const collection = getCollection();
    if (!collection) throw new Error('ChromaDB not connected');

    const queryEmbedding = await generateEmbedding(query);
    const resultLimit = options.allowedRoomIds?.length && !options.roomId
      ? Math.min((options.limit || 10) * 3, 50)
      : options.limit || 10;
    const searchParams = {
      queryEmbeddings: [queryEmbedding],
      nResults: resultLimit
    };

    if (options.roomId) {
      searchParams.where = { roomId: options.roomId.toString() };
    }

    const results = await collection.query(searchParams);

    const items = [];
    if (results.ids && results.ids[0]) {
      for (let i = 0; i < results.ids[0].length; i++) {
        const item = {
          id: results.ids[0][i],
          content: results.documents[0][i],
          username: results.metadatas[0][i].username,
          roomId: results.metadatas[0][i].roomId,
          timestamp: results.metadatas[0][i].timestamp,
          relevanceScore: results.distances ? Math.max(0, 1 - results.distances[0][i]) : 1
        };

        if (!options.allowedRoomIds || options.allowedRoomIds.includes(item.roomId)) {
          items.push(item);
        }
      }
    }
    return items.slice(0, options.limit || 10);
  }
}

module.exports = new ChromaService();
