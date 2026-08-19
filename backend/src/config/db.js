const mongoose = require('mongoose');

let mongoMemoryServer = null;

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    
    if (mongoUri) {
      const conn = await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
      console.log(`[Database] Connected to MongoDB: ${conn.connection.host}`);
      return conn;
    }

    // Try connecting to default local MongoDB instance first
    try {
      const conn = await mongoose.connect('mongodb://127.0.0.1:27017/ai-emergency', {
        serverSelectionTimeoutMS: 2000,
      });
      console.log(`[Database] Connected to local MongoDB: ${conn.connection.host}`);
      return conn;
    } catch (localErr) {
      console.log(`[Database] Local MongoDB daemon not detected. Starting In-Memory MongoDB Server...`);
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongoMemoryServer = await MongoMemoryServer.create();
        const memUri = mongoMemoryServer.getUri();
        const conn = await mongoose.connect(memUri);
        console.log(`[Database] Connected to In-Memory MongoDB Server (${memUri})`);
        return conn;
      } catch (memErr) {
        console.error(`[Database Error] Could not initialize In-Memory MongoDB Server: ${memErr.message}`);
      }
    }
  } catch (error) {
    console.error(`[Database Error] ${error.message}`);
  }
};

module.exports = connectDB;
