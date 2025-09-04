const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs-extra');
require('dotenv').config();

// Import our modules
const LanguageManager = require('./services/LanguageManager');
const CompilerService = require('./services/CompilerService');
const OllamaService = require('./services/OllamaService');
const FileSystemService = require('./services/FileSystemService');
const ProjectManager = require('./services/ProjectManager');
const TerminalService = require('./services/TerminalService');
const DebuggerService = require('./services/DebuggerService');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://yourdomain.com', 'https://www.yourdomain.com']
      : ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      connectSrc: ["'self'", "ws:", "wss:"],
      imgSrc: ["'self'", "data:", "https:"],
      workerSrc: ["'self'", "blob:"]
    }
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Middleware
app.use(compression());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, '../client/build')));

// Initialize services
const languageManager = new LanguageManager();
const compilerService = new CompilerService();
const ollamaService = new OllamaService();
const fileSystemService = new FileSystemService();
const projectManager = new ProjectManager();
const terminalService = new TerminalService();
const debuggerService = new DebuggerService();

// API Routes
app.use('/api/languages', require('./routes/languages')(languageManager));
app.use('/api/compile', require('./routes/compile')(compilerService));
app.use('/api/ollama', require('./routes/ollama')(ollamaService));
app.use('/api/files', require('./routes/files')(fileSystemService));
app.use('/api/projects', require('./routes/projects')(projectManager));
app.use('/api/terminal', require('./routes/terminal')(terminalService));
app.use('/api/debug', require('./routes/debug')(debuggerService));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    services: {
      languageManager: languageManager.isReady(),
      compilerService: compilerService.isReady(),
      ollamaService: ollamaService.isReady(),
      fileSystemService: fileSystemService.isReady(),
      projectManager: projectManager.isReady(),
      terminalService: terminalService.isReady(),
      debuggerService: debuggerService.isReady()
    }
  });
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // File system events
  socket.on('file:open', async (data) => {
    try {
      const content = await fileSystemService.readFile(data.path);
      socket.emit('file:opened', { path: data.path, content });
    } catch (error) {
      socket.emit('file:error', { error: error.message });
    }
  });

  socket.on('file:save', async (data) => {
    try {
      await fileSystemService.writeFile(data.path, data.content);
      socket.emit('file:saved', { path: data.path });
      socket.broadcast.emit('file:changed', { path: data.path, content: data.content });
    } catch (error) {
      socket.emit('file:error', { error: error.message });
    }
  });

  // Compilation events
  socket.on('compile:start', async (data) => {
    try {
      const result = await compilerService.compile(data.language, data.code, data.options);
      socket.emit('compile:result', result);
    } catch (error) {
      socket.emit('compile:error', { error: error.message });
    }
  });

  // Ollama AI assistance
  socket.on('ollama:request', async (data) => {
    try {
      const response = await ollamaService.generateResponse(data.prompt, data.context);
      socket.emit('ollama:response', { response });
    } catch (error) {
      socket.emit('ollama:error', { error: error.message });
    }
  });

  // Terminal events
  socket.on('terminal:input', (data) => {
    terminalService.writeToTerminal(socket.id, data.input);
  });

  socket.on('terminal:resize', (data) => {
    terminalService.resizeTerminal(socket.id, data.cols, data.rows);
  });

  // Project events
  socket.on('project:create', async (data) => {
    try {
      const project = await projectManager.createProject(data.name, data.template);
      socket.emit('project:created', project);
    } catch (error) {
      socket.emit('project:error', { error: error.message });
    }
  });

  socket.on('project:load', async (data) => {
    try {
      const project = await projectManager.loadProject(data.path);
      socket.emit('project:loaded', project);
    } catch (error) {
      socket.emit('project:error', { error: error.message });
    }
  });

  // Debugging events
  socket.on('debug:start', async (data) => {
    try {
      const debugSession = await debuggerService.startDebugging(data.language, data.filePath);
      socket.emit('debug:started', debugSession);
    } catch (error) {
      socket.emit('debug:error', { error: error.message });
    }
  });

  socket.on('debug:step', async (data) => {
    try {
      const result = await debuggerService.step(data.sessionId);
      socket.emit('debug:step-result', result);
    } catch (error) {
      socket.emit('debug:error', { error: error.message });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    terminalService.closeTerminal(socket.id);
    debuggerService.stopDebugging(socket.id);
  });
});

// Terminal output forwarding
terminalService.on('output', (socketId, data) => {
  io.to(socketId).emit('terminal:output', data);
});

// Debugger output forwarding
debuggerService.on('debug-output', (socketId, data) => {
  io.to(socketId).emit('debug:output', data);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal Server Error' 
      : err.message,
    timestamp: new Date().toISOString()
  });
});

// Catch-all handler for React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

// Start server
server.listen(PORT, HOST, () => {
  console.log(`🚀 Web IDE Server running on http://${HOST}:${PORT}`);
  console.log(`📊 Health check: http://${HOST}:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📦 Node version: ${process.version}`);
  console.log(`🆔 Process ID: ${process.pid}`);
  
  // Initialize services
  console.log('🔧 Initializing services...');
  languageManager.initialize();
  compilerService.initialize();
  ollamaService.initialize();
  fileSystemService.initialize();
  projectManager.initialize();
  terminalService.initialize();
  debuggerService.initialize();
});

module.exports = app;