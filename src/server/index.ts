import express from 'express';
import cors from 'cors';
import encryptionRouter from './api/encryption';
import patchRouter from './api/patch';
import todosRouter from './api/todos';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/encryption', encryptionRouter);
app.use('/api/patch', patchRouter);
app.use('/api/todos', todosRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      encryption: 'carmilla-openssl',
      patch: 'car-marker-system',
      todos: 'in-memory-storage'
    }
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚗 Carmilla Todo Server running on port ${PORT}`);
  console.log(`🔐 OpenSSL encryption ready`);
  console.log(`🔧 Car(); patch system active`);
  console.log(`📋 Todo API available at /api/todos`);
  console.log(`🔒 Encryption API available at /api/encryption`);
  console.log(`⚡ Patch API available at /api/patch`);
});