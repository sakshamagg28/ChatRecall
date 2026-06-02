const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/app_core';
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
    console.log('✅ MongoDB Connected');
  } catch (error) {
    if (uri.includes('localhost') || uri.includes('127.0.0.1')) {
      console.log('⚠️ Local MongoDB connection failed. Starting in-memory MongoDB...');
      try {
        mongod = await MongoMemoryServer.create();
        const memoryUri = mongod.getUri();
        await mongoose.connect(memoryUri);
        console.log(`✅ In-Memory MongoDB Connected at: ${memoryUri}`);
      } catch (memError) {
        console.error('❌ Failed to start in-memory MongoDB:', memError.message);
        process.exit(1);
      }
    } else {
      console.error('❌ MongoDB Error:', error.message);
      process.exit(1); // Stop if DB fails
    }
  }
};

module.exports = connectDB;
