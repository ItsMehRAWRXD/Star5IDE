/**
 * Express API Server for Carmilla Encryption
 * Provides REST endpoints for encryption/decryption
 * Includes per-run isolation and detailed reporting
 */

import express from 'express';
import cors from 'cors';
import { processTargets, encryptFileAreas } from './encryptionService';
import { checkOpenSSL, generateRunId } from '../crypto/carmilla';
import carPatcher from '../utils/carPatcher';
import fs from 'fs/promises';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const runId = generateRunId();
  req['runId'] = runId;
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - Run ID: ${runId}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    runId: req['runId']
  });
});

// Check encryption availability
app.get('/api/encryption/status', (req, res) => {
  const available = checkOpenSSL();
  res.json({
    available,
    method: 'openssl',
    chain: ['openssl'],
    timestamp: new Date().toISOString(),
    runId: req['runId']
  });
});

// Encrypt endpoint
app.post('/api/encryption/encrypt', async (req, res) => {
  const { targets, passphrase, meta = {} } = req.body;
  
  if (!targets || !passphrase) {
    return res.status(400).json({
      error: 'Missing required fields: targets and passphrase',
      runId: req['runId']
    });
  }
  
  try {
    // Add run ID to metadata
    const enrichedMeta = {
      ...meta,
      apiRunId: req['runId'],
      timestamp: new Date().toISOString()
    };
    
    // Process encryption targets
    const result = await processTargets(targets, passphrase, enrichedMeta);
    
    // Log summary
    console.log(`[${req['runId']}] Encryption complete: ${result.succeeded}/${result.totalTargets} succeeded`);
    
    res.json(result);
  } catch (error) {
    console.error(`[${req['runId']}] Encryption error:`, error);
    res.status(500).json({
      error: error.message,
      runId: req['runId']
    });
  }
});

// Decrypt endpoint
app.post('/api/encryption/decrypt', async (req, res) => {
  const { targets, passphrase, meta = {} } = req.body;
  
  if (!targets || !passphrase) {
    return res.status(400).json({
      error: 'Missing required fields: targets and passphrase',
      runId: req['runId']
    });
  }
  
  try {
    // Ensure all targets have decrypt intent
    const decryptTargets = targets.map(t => ({ ...t, intent: 'decrypt' }));
    
    // Add run ID to metadata
    const enrichedMeta = {
      ...meta,
      apiRunId: req['runId'],
      timestamp: new Date().toISOString()
    };
    
    // Process decryption targets
    const result = await processTargets(decryptTargets, passphrase, enrichedMeta);
    
    // Log summary
    console.log(`[${req['runId']}] Decryption complete: ${result.succeeded}/${result.totalTargets} succeeded`);
    
    res.json(result);
  } catch (error) {
    console.error(`[${req['runId']}] Decryption error:`, error);
    res.status(500).json({
      error: error.message,
      runId: req['runId']
    });
  }
});

// Encrypt file areas endpoint
app.post('/api/encryption/file-areas', async (req, res) => {
  const { filePath, areas, passphrase } = req.body;
  
  if (!filePath || !areas || !passphrase) {
    return res.status(400).json({
      error: 'Missing required fields: filePath, areas, and passphrase',
      runId: req['runId']
    });
  }
  
  try {
    const result = await encryptFileAreas(filePath, areas, passphrase);
    
    console.log(`[${req['runId']}] File area encryption complete: ${result.succeeded}/${result.totalTargets} areas`);
    
    res.json(result);
  } catch (error) {
    console.error(`[${req['runId']}] File area encryption error:`, error);
    res.status(500).json({
      error: error.message,
      runId: req['runId']
    });
  }
});

// Patch execution endpoint
app.post('/api/patch/execute', async (req, res) => {
  const { code, patches, context = {} } = req.body;
  
  if (!code || !patches) {
    return res.status(400).json({
      error: 'Missing required fields: code and patches',
      runId: req['runId']
    });
  }
  
  try {
    // Execute patched code
    const result = carPatcher.runPatchedString(code, patches, context);
    
    console.log(`[${req['runId']}] Patch execution complete: ${result.patchPoints?.length || 0} patches applied`);
    
    res.json({
      ...result,
      runId: req['runId']
    });
  } catch (error) {
    console.error(`[${req['runId']}] Patch execution error:`, error);
    res.status(500).json({
      error: error.message,
      runId: req['runId']
    });
  }
});

// Patch preview endpoint
app.post('/api/patch/preview', (req, res) => {
  const { code, patches } = req.body;
  
  if (!code || !patches) {
    return res.status(400).json({
      error: 'Missing required fields: code and patches',
      runId: req['runId']
    });
  }
  
  try {
    const patchedCode = carPatcher.patchString(code, patches);
    const patchPoints = carPatcher.findCarMarkers(code);
    
    res.json({
      patchedCode,
      patchPoints,
      runId: req['runId']
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      runId: req['runId']
    });
  }
});

// Batch encryption endpoint with detailed reporting
app.post('/api/encryption/batch', async (req, res) => {
  const { items, passphrase, meta = {} } = req.body;
  
  if (!items || !passphrase) {
    return res.status(400).json({
      error: 'Missing required fields: items and passphrase',
      runId: req['runId']
    });
  }
  
  const runId = req['runId'];
  const reports = [];
  const startTime = Date.now();
  
  try {
    // Convert items to targets
    const targets = items.map(item => ({
      type: 'string' as const,
      data: item.data,
      key: item.id,
      intent: item.intent || 'encrypt' as const
    }));
    
    // Process all targets
    const result = await processTargets(targets, passphrase, {
      ...meta,
      batchRunId: runId,
      batchSize: items.length
    });
    
    // Create detailed report
    const report = {
      runId,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      summary: {
        total: result.totalTargets,
        succeeded: result.succeeded,
        failed: result.failed,
        skipped: result.skipped
      },
      items: result.reports.map(r => ({
        id: r.key,
        status: r.status,
        error: r.error,
        duration: r.duration
      }))
    };
    
    // Log batch summary
    console.log(`[${runId}] Batch operation complete:`, JSON.stringify(report.summary));
    
    res.json(report);
  } catch (error) {
    console.error(`[${runId}] Batch operation error:`, error);
    res.status(500).json({
      error: error.message,
      runId
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`[${req['runId']}] Unhandled error:`, err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    runId: req['runId']
  });
});

// Start server
app.listen(PORT, () => {
  const opensslAvailable = checkOpenSSL();
  console.log(`
╔════════════════════════════════════════════════╗
║     Carmilla Encryption Server Started        ║
╠════════════════════════════════════════════════╣
║  Port: ${PORT}                                ║
║  OpenSSL: ${opensslAvailable ? '✓ Available' : '✗ Not Available'}                     ║
║  API Base: http://localhost:${PORT}/api       ║
╚════════════════════════════════════════════════╝
  `);
  
  if (!opensslAvailable) {
    console.warn('⚠️  Warning: OpenSSL is not available. Encryption features will not work.');
    console.warn('   Please install OpenSSL to enable encryption.');
  }
});

export default app;