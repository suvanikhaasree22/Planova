const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable Cross-Origin Resource Sharing and JSON Body Parsing
app.use(cors());
app.use(express.json());

// Serve Frontend Static Assets
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Fallback for SPA routing to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

/**
 * Connect to MongoDB with intelligent fallback:
 * 1. Connect to process.env.MONGODB_URI if specified
 * 2. Try default local MongoDB ('mongodb://127.0.0.1:27017/planova')
 * 3. If local server unavailable, gracefully launch MongoMemoryServer for instant plug-and-play
 */
const connectDatabase = async () => {
  const customUri = process.env.MONGODB_URI;

  if (customUri) {
    try {
      console.log('Connecting to specified MongoDB URI...');
      await mongoose.connect(customUri);
      console.log('MongoDB connected successfully via MONGODB_URI.');
      return;
    } catch (err) {
      console.error('Failed to connect to MONGODB_URI:', err.message);
    }
  }

  // Attempt local MongoDB with short timeout
  try {
    console.log('Attempting connection to local MongoDB (mongodb://127.0.0.1:27017/planova)...');
    await mongoose.connect('mongodb://127.0.0.1:27017/planova', {
      serverSelectionTimeoutMS: 2000
    });
    console.log('Local MongoDB connected successfully.');
    return;
  } catch (err) {
    console.warn('Local MongoDB daemon not detected at port 27017.');
  }

  // Fallback to in-memory MongoDB
  try {
    console.log('Starting embedded MongoDB Memory Server for zero-config execution...');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log('Connected to embedded MongoDB Memory Server:', uri);
  } catch (memErr) {
    console.error('Error starting MongoDB Memory Server:', memErr.message);
  }
};

// Start Server
const startServer = async () => {
  await connectDatabase();
  app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`  PLANOVA Server is running!`);
    console.log(`  URL: http://localhost:${PORT}`);
    console.log(`  Mode: ${process.env.NODE_ENV || 'development'}`);
    console.log(`========================================`);
  });
};

startServer();

module.exports = app;
