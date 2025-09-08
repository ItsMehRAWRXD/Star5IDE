const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const config = require('../config');
const { logger, requestLogger } = require('./utils/logger');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const subscriptionRoutes = require('./routes/subscriptions');
const cryptoRoutes = require('./routes/crypto');
const securityRoutes = require('./routes/security');
const imageRoutes = require('./routes/images');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression()); // Enable gzip compression
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    requestLogger.info({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  });
  
  next();
});

// Serve static files (but not index.html from rawraw-site)
app.use(express.static('public'));
app.use('/static', express.static('rawraw-site'));

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
    logger.info('MongoDB connected successfully');
    logger.info('Database features enabled');
    console.log('✅ MongoDB connected successfully');
    console.log('📊 Database features enabled');
  })
  .catch((err) => {
    logger.error('MongoDB connection error', { error: err.message });
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
app.use('/api/crypto', cryptoRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/images', imageRoutes);

// Advanced UI routes (keeping existing Camellia server)
app.get('/advanced-ui', (req, res) => {
  res.sendFile('advanced-ui.html', { root: 'rawraw-site' });
});

app.get('/advanced', (req, res) => {
  res.sendFile('advanced-ui.html', { root: 'rawraw-site' });
});

app.get('/rawrz', (req, res) => {
  res.sendFile('advanced-ui.html', { root: 'rawraw-site' });
});

// TypeScript SaaS Platform routes - Fixed routing
app.get('/saas', (req, res) => {
  res.sendFile('index.html', { root: 'rawraw-site/SaaS Crypting Platform/SaaSEncryptionSecurity/1/public' });
});

app.get('/saas/*', (req, res) => {
  res.sendFile('index.html', { root: 'rawraw-site/SaaS Crypting Platform/SaaSEncryptionSecurity/1/public' });
});

// Code Playground - Interactive coding environment
app.get('/playground', (req, res) => {
  res.sendFile('playground.html', { root: 'rawraw-site' });
});

// Project Mixer - Combine different technologies
app.get('/mixer', (req, res) => {
  res.sendFile('mixer.html', { root: 'rawraw-site' });
});

// Development Tools
app.get('/tools', (req, res) => {
  res.sendFile('dev-tools.html', { root: 'rawraw-site' });
});

// Admin Panel
app.get('/admin', (req, res) => {
  res.sendFile('admin-panel.html', { root: 'public' });
});

app.get('/panel', (req, res) => {
  res.sendFile('admin-panel.html', { root: 'public' });
});

// Main Dashboard - Central Hub
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: 'public' });
});

// Legacy API endpoint for programmatic access
app.get('/api', (req, res) => {
  res.json({
    message: '🚀 Star5IDE - Mix & Code Playground API',
    version: '1.0.0',
    interfaces: {
      main: '/ (IDE Dashboard)',
      security: '/advanced-ui (RawrZ Security Platform)',
      saas: '/saas (TypeScript SaaS Platform)',
      api: '/api (Backend API)',
      playground: '/playground (Code Playground)',
      mixer: '/mixer (Project Mixer)'
    },
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    endpoints: {
      root: '/',
      health: '/health',
      auth: '/api/auth',
      subscriptions: '/api/subscriptions',
      crypto: '/api/crypto',
      security: '/api/security',
      images: '/api/images',
      advanced_ui: '/advanced-ui',
      rawrz_ui: '/rawrz',
      saas_platform: '/saas',
      ide_dashboard: '/'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    message: 'SaaS Backend is running!'
  });
});

// This route is now handled above as the main IDE dashboard

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = config.PORT;

// Start server
app.listen(PORT, () => {
  logger.info(`SaaS Backend Server started on port ${PORT}`);
  console.log(`🚀 SaaS Backend Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api`);
  console.log(`🌐 Open in browser: http://localhost:${PORT}`);
  console.log(`📝 Logs available in: ./logs/`);
});

module.exports = app;
