const chromadb = require('chromadb');
const { ChromaClient } = chromadb;

let chromaClient = null;
let collection = null;

const initializeChroma = async () => {
  try {
    // Connect to ChromaDB server using path
    chromaClient = new ChromaClient({
      path: process.env.CHROMADB_URL || 'http://localhost:8000',
    });

    await chromaClient.heartbeat();
    console.log('✅ ChromaDB Connected to server');

    collection = await chromaClient.getOrCreateCollection({
      name: process.env.VECTOR_COLLECTION || 'chat_vectors',
      metadata: { 'hnsw:space': 'cosine' },
      embeddingFunction: {
        generate: async (texts) => Array(texts.length).fill(Array(1536).fill(0))
      }
    });

    console.log('✅ Chroma Collection "chat_vectors" ready');
  } catch (error) {
    console.error('❌ ChromaDB error:', error.message);
    console.log('⚠️ AI features may not work');
  }
};

const getChromaClient = () => chromaClient;
const getCollection = () => collection;

module.exports = {
  initializeChroma,
  getChromaClient,
  getCollection,
};
