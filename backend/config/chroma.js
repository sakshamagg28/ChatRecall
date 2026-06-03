const chromadb = require('chromadb');
const { ChromaClient } = chromadb;

let chromaClient = null;
let collection = null;

const externalEmbeddingFunction = {
  generate: async () => {
    throw new Error(
      'ChatRecall uses Gemini-generated embeddings. Pass embeddings/queryEmbeddings explicitly to ChromaDB.'
    );
  },
};

const getChromaConnection = () => {
  if (process.env.CHROMADB_HOST) {
    return {
      host: process.env.CHROMADB_HOST,
      port: Number(process.env.CHROMADB_PORT || 8000),
      ssl: process.env.CHROMADB_SSL === 'true',
    };
  }

  if (!process.env.CHROMADB_URL) {
    throw new Error('CHROMADB_URL or CHROMADB_HOST is required');
  }

  const url = new URL(process.env.CHROMADB_URL);
  const defaultPort = url.protocol === 'https:' ? 443 : 80;

  return {
    host: url.hostname,
    port: Number(url.port || defaultPort),
    ssl: url.protocol === 'https:',
  };
};

const initializeChroma = async () => {
  try {
    chromaClient = new ChromaClient(getChromaConnection());

    await chromaClient.heartbeat();
    console.log('✅ ChromaDB Connected to server');

    collection = await chromaClient.getOrCreateCollection({
      name: process.env.VECTOR_COLLECTION || 'chat_vectors',
      metadata: { 'hnsw:space': 'cosine' },
      embeddingFunction: externalEmbeddingFunction,
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
