const mongoose = require('mongoose');

const MAX_RETRIES = parseInt(process.env.MONGO_MAX_RETRIES || '5', 10);
const RETRY_DELAY_MS = parseInt(process.env.MONGO_RETRY_DELAY || '5000', 10);

const connectDB = () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri || typeof mongoUri !== 'string' || mongoUri.trim() === '') {
    console.error('\n\x1b[31mERROR:\x1b[0m MONGO_URI is not set or is invalid.');
    console.error('Please create a `.env` file in the `backend/` folder or set the MONGO_URI environment variable.');
    console.error('You can copy `backend/.env.example` to `backend/.env` and edit it with a valid MongoDB URI.\n');
    process.exit(1);
  }

  let currentRetries = 0;
  let isClosing = false;

  const connectWithRetry = async () => {
    try {
      const conn = await mongoose.connect(mongoUri, {
        autoIndex: true,
        serverSelectionTimeoutMS: parseInt(process.env.MONGO_SELECTION_TIMEOUT || '5000', 10),
      });
      currentRetries = 0;
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
      currentRetries += 1;
      console.error(`MongoDB connection error (${currentRetries}/${MAX_RETRIES}): ${error.message}`);

      if (currentRetries >= MAX_RETRIES) {
        console.error('Max MongoDB reconnection attempts reached. Exiting.');
        process.exit(1);
      }

      console.log(`Retrying MongoDB connection in ${Math.ceil(RETRY_DELAY_MS / 1000)}s...`);
      setTimeout(connectWithRetry, RETRY_DELAY_MS);
    }
  };

  mongoose.connection.on('disconnected', () => {
    if (isClosing) return;
    console.warn('MongoDB disconnected. Attempting to reconnect...');
    connectWithRetry();
  });

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err.message);
  });

  process.on('SIGINT', async () => {
    try {
      isClosing = true;
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to app termination.');
      process.exit(0);
    } catch (error) {
      console.error('Error closing MongoDB connection:', error);
      process.exit(1);
    }
  });

  connectWithRetry();
};

module.exports = connectDB;