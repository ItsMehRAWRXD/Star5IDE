const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const config = require('../config');
const { logger, requestLogger } = require('./utils/logger');
const { healthCheckMiddleware, errorTrackingMiddleware, healthChecker } = require('./middleware/healthCheck');
const { processMonitor, connectionTrackingMiddleware } = require('./middleware/processMonitor');
const { startupManager } = require('./startup');
const { dataIntegrityValidator, preEncryptionCheck, postEncryptionCheck } = require('./utils/dataIntegrity');
const { reverseTracer } = require('./utils/reverseTracer');
const { reverseTracePipeline } = require('./utils/reverseTracePipeline');
const { chatterbox } = require('./utils/chatterbox');
const { ircBot } = require('./utils/ircBot');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const subscriptionRoutes = require('./routes/subscriptions');
const cryptoRoutes = require('./routes/crypto');
const securityRoutes = require('./routes/security');
const imageRoutes = require('./routes/images');
const ideRoutes = require('./routes/ide');
const processRoutes = require('./routes/process');

// RawrZ Engine Integration
let rawrzEngine;
try {
  rawrzEngine = require('./engines/rawrz-engine');
  console.log('✅ RawrZ Engine module loaded successfully');
} catch (error) {
  console.error('❌ Failed to load RawrZ Engine module:', error.message);
  console.error('❌ Stack trace:', error.stack);
  // Create a mock engine to prevent crashes
  rawrzEngine = {
    initializeModules: async () => { throw new Error('RawrZ Engine not available'); },
    getStatus: () => ({ error: 'Engine not loaded' }),
    encryptAdvanced: async () => { throw new Error('Engine not available'); }
  };
}

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression()); // Enable gzip compression
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check and monitoring middleware
app.use(healthCheckMiddleware);
app.use(connectionTrackingMiddleware);

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
  console.log('🔄 Starting MongoDB connection...');
  console.log('📦 Config object:', typeof config);
  console.log('📦 MONGODB_URI exists:', !!config.MONGODB_URI);
  
  if (!config.MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in config');
    console.log('⚠️ Server will continue without database connection');
    return;
  }
  
  const mongoURI = config.MONGODB_URI.endsWith('/') 
    ? config.MONGODB_URI + 'saas-app'
    : config.MONGODB_URI + '/saas-app';
  
  console.log('🔗 Connecting to MongoDB URI:', mongoURI.replace(/\/\/.*@/, '//***:***@')); // Hide credentials
  
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
    console.error('❌ MongoDB connection error:', err.message);
    console.error('❌ Error type:', err.constructor.name);
    console.error('❌ Full error:', err);
    if (err.stack) {
      console.error('❌ Stack trace:', err.stack);
    }
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
app.use('/api/ide', ideRoutes);
app.use('/api/process', processRoutes);

// RawrZ Engine API routes
app.get('/api/engine/status', async (req, res) => {
  console.log('🔍 Engine status endpoint called');
  try {
    if (!rawrzEngine || !rawrzEngine.getStatus) {
      throw new Error('RawrZ Engine not available or not properly initialized');
    }
    const status = rawrzEngine.getStatus();
    console.log('✅ Engine status retrieved:', status);
    res.json({ status: 'healthy', data: status });
  } catch (error) {
    console.error('❌ Engine status error:', error.message);
    console.error('❌ Engine status stack:', error.stack);
    res.status(500).json({ status: 'error', error: error.message });
  }
});

app.post('/api/engine/compress', async (req, res) => {
  const operationId = `compress_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const { data, algorithm } = req.body;
    
    // Pre-compression integrity check
    const preCheck = await preEncryptionCheck(data, operationId);
    reverseTracer.trackOperation('COMPRESSION', `Compress operation ${operationId}`, data);
    
    const result = await rawrzEngine.compress(data, algorithm);
    
    // Post-compression integrity check
    const postCheck = await postEncryptionCheck(result, operationId);
    
    res.json({ 
      status: 'success', 
      data: result,
      integrity: {
        operationId,
        preCheck,
        postCheck
      }
    });
  } catch (error) {
    reverseTracer.recordCorruption('compressionFailure', `Compression failed: ${error.message}`, error.stack, 'COMPRESSION_FAILURE');
    res.status(500).json({ status: 'error', error: error.message });
  }
});

app.post('/api/engine/stealth', async (req, res) => {
  const operationId = `stealth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const { mode } = req.body;
    
    // Track stealth operation
    reverseTracer.trackOperation('STEALTH', `Stealth operation ${operationId}`, mode);
    
    const result = await rawrzEngine.enableStealth(mode);
    
    // Check result for malformities
    const malformities = dataIntegrityValidator.detectMalformities(JSON.stringify(result));
    if (malformities.length > 0) {
      malformities.forEach(m => {
        reverseTracer.recordCorruption('stealthResult', m.description, null, m.type);
      });
    }
    
    res.json({ 
      status: 'success', 
      data: result,
      integrity: {
        operationId,
        malformities: malformities.length
      }
    });
  } catch (error) {
    reverseTracer.recordCorruption('stealthFailure', `Stealth failed: ${error.message}`, error.stack, 'STEALTH_FAILURE');
    res.status(500).json({ status: 'error', error: error.message });
  }
});

app.post('/api/engine/stub', async (req, res) => {
  const operationId = `stub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const { target, options } = req.body;
    
    // Pre-stub generation integrity check
    const preCheck = await preEncryptionCheck(JSON.stringify({ target, options }), operationId);
    reverseTracer.trackOperation('STUB_GENERATION', `Stub generation ${operationId}`, target);
    
    const result = await rawrzEngine.generateStub(target, options);
    
    // Post-stub generation integrity check
    const postCheck = await postEncryptionCheck(JSON.stringify(result), operationId);
    
    res.json({ 
      status: 'success', 
      data: result,
      integrity: {
        operationId,
        preCheck,
        postCheck
      }
    });
  } catch (error) {
    reverseTracer.recordCorruption('stubGenerationFailure', `Stub generation failed: ${error.message}`, error.stack, 'STUB_GENERATION_FAILURE');
    res.status(500).json({ status: 'error', error: error.message });
  }
});

app.post('/api/engine/dual-generators', async (req, res) => {
  try {
    const { config } = req.body;
    const result = await rawrzEngine.runDualGenerators(config);
    res.json({ status: 'success', data: result });
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

app.post('/api/engine/patch', async (req, res) => {
  try {
    const { target, patch } = req.body;
    const result = await rawrzEngine.applyHotPatch(target, patch);
    res.json({ status: 'success', data: result });
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

app.post('/api/engine/assemble', async (req, res) => {
  try {
    const { code, architecture } = req.body;
    const result = await rawrzEngine.assembleCode(code, architecture);
    res.json({ status: 'success', data: result });
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

app.post('/api/engine/polymorphize', async (req, res) => {
  try {
    const { code, options } = req.body;
    const result = await rawrzEngine.polymorphizeCode(code, options);
    res.json({ status: 'success', data: result });
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

app.post('/api/engine/anti-analysis', async (req, res) => {
  try {
    const { target } = req.body;
    const result = await rawrzEngine.runAntiAnalysis(target);
    res.json({ status: 'success', data: result });
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

app.post('/api/engine/memory-optimize', async (req, res) => {
  try {
    const result = await rawrzEngine.optimizeMemory();
    res.json({ status: 'success', data: result });
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

app.post('/api/engine/backup', async (req, res) => {
  try {
    const { target, options } = req.body;
    const result = await rawrzEngine.createBackup(target, options);
    res.json({ status: 'success', data: result });
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

app.post('/api/engine/mobile-analyze', async (req, res) => {
  try {
    const { target } = req.body;
    const result = await rawrzEngine.analyzeMobile(target);
    res.json({ status: 'success', data: result });
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

app.post('/api/engine/network-analyze', async (req, res) => {
  try {
    const { target } = req.body;
    const result = await rawrzEngine.analyzeNetwork(target);
    res.json({ status: 'success', data: result });
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

app.post('/api/engine/encrypt', async (req, res) => {
  console.log('🔐 Engine encrypt endpoint called');
  const operationId = `encrypt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
    
    if (!rawrzEngine || !rawrzEngine.encryptAdvanced) {
      throw new Error('RawrZ Engine not available or encryptAdvanced method not found');
    }
    
    const { data, options } = req.body;
    console.log('📊 Data:', data, 'Options:', options);
    
    if (!data) {
      throw new Error('No data provided for encryption');
    }
    
    // Pre-encryption integrity check
    console.log('🔍 Performing pre-encryption integrity check...');
    const preCheck = await preEncryptionCheck(data, operationId);
    console.log('📊 Pre-encryption check result:', preCheck);
    
    // Track operation in reverse trace pipeline
    reverseTracer.trackOperation('ENCRYPTION', `Encrypt operation ${operationId}`, data);
    reverseTracePipeline.trackOperation('ENCRYPTION_PIPELINE', 'pre_encryption', operationId, data, { 
      algorithm: options?.algorithm || 'default',
      source: 'api_request'
    });
    
    console.log('🚀 Calling rawrzEngine.encryptAdvanced()...');
    const result = await rawrzEngine.encryptAdvanced(data, options);
    console.log('✅ Encryption result:', result);
    
    // Post-encryption integrity check
    console.log('🔍 Performing post-encryption integrity check...');
    const postCheck = await postEncryptionCheck(result, operationId);
    console.log('📊 Post-encryption check result:', postCheck);
    
    // Track post-encryption in reverse trace pipeline
    reverseTracePipeline.trackOperation('ENCRYPTION_PIPELINE', 'post_encryption', operationId, result, {
      algorithm: options?.algorithm || 'default',
      source: 'rawrz_engine',
      preCheckResult: preCheck,
      postCheckResult: postCheck
    });
    
    res.json({ 
      status: 'success', 
      data: result,
      integrity: {
        operationId,
        preCheck,
        postCheck
      }
    });
  } catch (error) {
    console.error('❌ Engine encrypt error:', error.message);
    console.error('❌ Error type:', error.constructor.name);
    console.error('❌ Full error:', error);
    if (error.stack) {
      console.error('❌ Stack trace:', error.stack);
    }
    
    // Record encryption failure
    reverseTracer.recordCorruption(
      'encryptionFailure', 
      `Encryption failed: ${error.message}`, 
      error.stack, 
      'ENCRYPTION_FAILURE'
    );
    
    res.status(500).json({ status: 'error', error: error.message });
  }
});

app.post('/api/engine/reverse-engineer', async (req, res) => {
  try {
    const { target } = req.body;
    const result = await rawrzEngine.reverseEngineer(target);
    res.json({ status: 'success', data: result });
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

app.post('/api/engine/forensics', async (req, res) => {
  try {
    const { target } = req.body;
    const result = await rawrzEngine.performForensics(target);
    res.json({ status: 'success', data: result });
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

app.post('/api/engine/malware-analyze', async (req, res) => {
  try {
    const { target } = req.body;
    const result = await rawrzEngine.analyzeMalware(target);
    res.json({ status: 'success', data: result });
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

app.get('/api/engine/status/all', async (req, res) => {
  try {
    const result = await rawrzEngine.getAPIStatus();
    res.json({ status: 'success', data: result });
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

// Data integrity and malformity monitoring endpoints
app.get('/api/integrity/report', (req, res) => {
  try {
    const integrityReport = dataIntegrityValidator.generateIntegrityReport();
    res.json(integrityReport);
  } catch (error) {
    logger.error('Failed to generate integrity report:', error);
    res.status(500).json({ error: 'Failed to generate integrity report' });
  }
});

app.get('/api/integrity/corruption-log', (req, res) => {
  try {
    const corruptionReport = reverseTracer.getCorruptionReport();
    res.json(corruptionReport);
  } catch (error) {
    logger.error('Failed to get corruption report:', error);
    res.status(500).json({ error: 'Failed to get corruption report' });
  }
});

app.post('/api/integrity/export-corruption-log', async (req, res) => {
  try {
    const filepath = await reverseTracer.exportCorruptionLog();
    res.json({ 
      success: true, 
      message: 'Corruption log exported successfully',
      filepath: filepath
    });
  } catch (error) {
    logger.error('Failed to export corruption log:', error);
    res.status(500).json({ error: 'Failed to export corruption log' });
  }
});

app.get('/api/integrity/malformity-summary', (req, res) => {
  try {
    const summary = dataIntegrityValidator.getMalformitySummary();
    res.json({
      timestamp: new Date().toISOString(),
      malformitySummary: summary,
      recommendations: dataIntegrityValidator.generateRecommendations()
    });
  } catch (error) {
    logger.error('Failed to get malformity summary:', error);
    res.status(500).json({ error: 'Failed to get malformity summary' });
  }
});

// Comprehensive reverse trace pipeline endpoints
app.get('/api/trace/pipeline-report', (req, res) => {
  try {
    const traceReport = reverseTracePipeline.getTraceReport();
    res.json(traceReport);
  } catch (error) {
    logger.error('Failed to get trace pipeline report:', error);
    res.status(500).json({ error: 'Failed to get trace pipeline report' });
  }
});

app.get('/api/trace/deployment-status', (req, res) => {
  try {
    // Track deployment status check
    reverseTracePipeline.trackOperation('DEPLOYMENT_PIPELINE', 'status_check', `deploy_check_${Date.now()}`, 
      JSON.stringify({ timestamp: Date.now(), source: 'api_request' }), 
      { endpoint: '/api/trace/deployment-status' }
    );
    
    const deploymentStatus = {
      timestamp: new Date().toISOString(),
      localServer: {
        status: 'running',
        port: 8088,
        endpoints: 17
      },
      digitalOcean: {
        whaleApp: 'https://whale-app-eraw5.ondigitalocean.app',
        expectedVersion: 'RawrZ Security Platform v2.0',
        lastDeployment: 'pending'
      },
      branchStatus: {
        current: 'security/cleanup',
        main: 'updated',
        deployment: 'in_progress'
      },
      malformityStatus: {
        detected: false,
        lastCheck: new Date().toISOString(),
        sources: []
      }
    };
    
    res.json(deploymentStatus);
  } catch (error) {
    logger.error('Failed to get deployment status:', error);
    res.status(500).json({ error: 'Failed to get deployment status' });
  }
});

app.get('/api/trace/where-not-locking', (req, res) => {
  try {
    // Track where deployment is not locking in
    reverseTracePipeline.trackOperation('DEPLOYMENT_PIPELINE', 'lock_analysis', `lock_analysis_${Date.now()}`, 
      JSON.stringify({ analysis: 'deployment_lock_points' }), 
      { endpoint: '/api/trace/where-not-locking' }
    );
    
    const lockAnalysis = {
      timestamp: new Date().toISOString(),
      deploymentLockPoints: {
        gitBranch: {
          status: 'locked_to_main',
          issue: 'Whale app configured for main branch, not security/cleanup',
          solution: 'Merge security/cleanup to main or reconfigure app'
        },
        dockerBuild: {
          status: 'cached',
          issue: 'DigitalOcean using cached build',
          solution: 'Force rebuild with new Dockerfile'
        },
        apiEndpoints: {
          status: 'mismatched',
          issue: 'Old Netlify Functions API paths still active',
          solution: 'Clear cache and redeploy'
        },
        uiRendering: {
          status: 'old_version',
          issue: 'advanced-ui.html not being served',
          solution: 'Verify file paths and routing'
        }
      },
      recommendations: [
        'Force DigitalOcean app rebuild',
        'Clear all caches',
        'Verify branch configuration',
        'Check file serving paths',
        'Monitor deployment logs'
      ],
      nextSteps: [
        'Check DigitalOcean app configuration',
        'Force redeploy with new commit',
        'Verify all files are in correct locations',
        'Test API endpoints after deployment'
      ]
    };
    
    res.json(lockAnalysis);
  } catch (error) {
    logger.error('Failed to analyze deployment locks:', error);
    res.status(500).json({ error: 'Failed to analyze deployment locks' });
  }
});

// Chatterbox and IRC Bot monitoring endpoints
app.get('/api/chatterbox/status', (req, res) => {
  try {
    const status = chatterbox.getStatusReport();
    res.json(status);
  } catch (error) {
    logger.error('Failed to get chatterbox status:', error);
    res.status(500).json({ error: 'Failed to get chatterbox status' });
  }
});

app.get('/api/chatterbox/scripts', (req, res) => {
  try {
    const scripts = chatterbox.getAllScriptStatuses();
    res.json({ scripts, count: scripts.length });
  } catch (error) {
    logger.error('Failed to get script statuses:', error);
    res.status(500).json({ error: 'Failed to get script statuses' });
  }
});

app.get('/api/chatterbox/errors', (req, res) => {
  try {
    const errors = chatterbox.getErrorLog(50);
    res.json({ errors, count: errors.length });
  } catch (error) {
    logger.error('Failed to get error log:', error);
    res.status(500).json({ error: 'Failed to get error log' });
  }
});

app.get('/api/chatterbox/requestid-errors', (req, res) => {
  try {
    const requestIdErrors = chatterbox.getRequestIdErrors();
    res.json({ requestIdErrors, count: requestIdErrors.length });
  } catch (error) {
    logger.error('Failed to get requestID errors:', error);
    res.status(500).json({ error: 'Failed to get requestID errors' });
  }
});

app.get('/api/chatterbox/stuck', (req, res) => {
  try {
    const stuck = chatterbox.getStuckScripts();
    res.json({ stuck, count: stuck.length });
  } catch (error) {
    logger.error('Failed to get stuck scripts:', error);
    res.status(500).json({ error: 'Failed to get stuck scripts' });
  }
});

// IRC Bot control endpoints
app.get('/api/irc/status', (req, res) => {
  try {
    res.json({
      connected: ircBot.connected,
      server: ircBot.config.server,
      channels: Array.from(ircBot.channels),
      nick: ircBot.config.nick
    });
  } catch (error) {
    logger.error('Failed to get IRC status:', error);
    res.status(500).json({ error: 'Failed to get IRC status' });
  }
});

app.post('/api/irc/send', (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    ircBot.sendToIRC(message);
    res.json({ success: true, message: 'Message sent to IRC' });
  } catch (error) {
    logger.error('Failed to send IRC message:', error);
    res.status(500).json({ error: 'Failed to send IRC message' });
  }
});

app.post('/api/irc/reconnect', (req, res) => {
  try {
    ircBot.reconnect();
    res.json({ success: true, message: 'IRC reconnection initiated' });
  } catch (error) {
    logger.error('Failed to reconnect IRC:', error);
    res.status(500).json({ error: 'Failed to reconnect IRC' });
  }
});

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

// Custom IDE - Your Own Development Platform
app.get('/custom-ide', (req, res) => {
  res.sendFile('custom-ide.html', { root: 'public' });
});

app.get('/ide', (req, res) => {
  res.sendFile('custom-ide.html', { root: 'public' });
});

// System Monitor - Real-time monitoring dashboard
app.get('/monitor', (req, res) => {
  res.sendFile('monitor.html', { root: 'public' });
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
      ide: '/api/ide',
      process: '/api/process',
      advanced_ui: '/advanced-ui',
      rawrz_ui: '/rawrz',
      saas_platform: '/saas',
      custom_ide: '/custom-ide',
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
app.use(errorTrackingMiddleware);
app.use((err, req, res, next) => {
  console.error('Global error handler caught error:', err.message);
  console.error('Stack:', err.stack);
  console.error('Request URL:', req.url);
  console.error('Request method:', req.method);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = config.PORT;

// Initialize RawrZ Engine
async function initializeRawrZEngine() {
  console.log('🔄 Starting RawrZ Engine initialization...');
  
  // Register main app with Chatterbox
  const appScriptId = chatterbox.registerScript('rawrz-main-app', {
    name: 'RawrZ Security Platform Main App',
    type: 'web_server',
    channel: 'api',
    metadata: {
      port: PORT,
      endpoints: 17,
      version: '2.0'
    }
  });
  
  try {
    console.log('📦 RawrZ Engine object:', typeof rawrzEngine);
    console.log('📦 RawrZ Engine methods:', Object.keys(rawrzEngine));
    
    if (!rawrzEngine.initializeModules) {
      throw new Error('initializeModules method not found on RawrZ Engine');
    }
    
    console.log('🚀 Calling rawrzEngine.initializeModules()...');
    await rawrzEngine.initializeModules();
    
    logger.info('RawrZ Engine initialized successfully');
    console.log('🛡️ RawrZ Security Engine initialized successfully');
    console.log('✅ All engine endpoints should now be available');
    
    // Update script status
    chatterbox.updateScriptStatus(appScriptId, 'operational', {
      engineInitialized: true,
      endpointsAvailable: 17
    });
    
  } catch (error) {
    logger.error('Failed to initialize RawrZ Engine:', error);
    console.error('❌ RawrZ Engine initialization failed:', error.message);
    console.error('❌ Error type:', error.constructor.name);
    console.error('❌ Full error object:', error);
    if (error.stack) {
      console.error('❌ Stack trace:', error.stack);
    }
    console.error('⚠️ Engine endpoints will not be available');
    
    // Record error in Chatterbox
    chatterbox.recordScriptError(appScriptId, error, {
      context: 'engine_initialization',
      requestId: null
    });
    
    chatterbox.updateScriptStatus(appScriptId, 'degraded', {
      engineInitialized: false,
      error: error.message
    });
  }
}

// Start server
app.listen(PORT, async () => {
  logger.info(`SaaS Backend Server started on port ${PORT}`);
  console.log(`🚀 SaaS Backend Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api`);
  console.log(`🌐 Open in browser: http://localhost:${PORT}`);
  console.log(`📝 Logs available in: ./logs/`);
  
  // Initialize RawrZ Engine after server starts
  await initializeRawrZEngine();
});

module.exports = app;
