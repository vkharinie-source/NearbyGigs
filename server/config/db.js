const mongoose = require('mongoose');

const connectDB = async () => {
  const targetUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nearbygigs';
  try {
    const conn = await mongoose.connect(targetUri, { serverSelectionTimeoutMS: 4000 });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`Primary DB connection failed (${error.message}). Attempting fallback to local MongoDB...`);
    try {
      const fallbackConn = await mongoose.connect('mongodb://127.0.0.1:27017/nearbygigs', { serverSelectionTimeoutMS: 4000 });
      console.log(`Fallback Local MongoDB Connected: ${fallbackConn.connection.host}`);
      return fallbackConn;
    } catch (fallbackErr) {
      console.error(`MongoDB connection failure: ${fallbackErr.message}`);
      throw fallbackErr;
    }
  }
};

module.exports = connectDB;
