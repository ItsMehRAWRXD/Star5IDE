const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('../config');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const subscriptionRoutes = require('./routes/subscriptions');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Database connection with graceful fallback
const connectDB = () => {
  const mongoURI = config.MONGODB_URI.endsWith('/') 
    ? config.MONGODB_URI + 'saas-app'
    : config.MONGODB_URI + '/saas-app';
  
  mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    console.log('📊 Database features enabled');
  })
  .catch((err) => {
    console.log('⚠️ MongoDB connection error:', err.message);
    console.log('⚠️ Server will continue without database connection');
    console.log('📊 Database features disabled - running in demo mode');
  });
};

// Connect to database (non-blocking)
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    message: 'SaaS Backend is running!'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 SaaS Backend API is running!',
    version: '1.0.0',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    endpoints: {
      root: '/',
      health: '/health',
      auth: '/api/auth',
      subscriptions: '/api/subscriptions'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = config.PORT;

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SaaS Backend Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api`);
  console.log(`🌐 Open in browser: http://localhost:${PORT}`);
});

module.exports = app;
