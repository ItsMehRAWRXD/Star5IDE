// Lightweight HTTP wrapper for RawrZ Standalone CLI
// Exposes a minimal, safe API for deployment on DigitalOcean App Platform

const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const RawrZStandalone = require('./rawrz-standalone');

const app = express();
const port = parseInt(process.env.PORT, 10) || 8080;

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(morgan('combined'));

// Initialize core CLI (ensures uploads/data/logs directories are present)
const rawrz = new RawrZStandalone();

// Static files for generated artifacts
const uploadsDir = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsDir, { fallthrough: true, maxAge: '1h' }));

app.get('/healthz', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.get('/', (req, res) => {
  res.type('html').send(
    '<!doctype html><html><head><meta charset="utf-8"><title>RawrZ API</title></head><body>' +
      '<h1>RawrZ Security Platform API</h1>' +
      '<p>Service is running. See <code>/healthz</code> and <code>/api/*</code> endpoints.</p>' +
    '</body></html>'
  );
});

// Minimal API surface (safe operations only)
app.get('/api/files', async (req, res) => {
  try {
    const result = await rawrz.listFiles();
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/hash', async (req, res) => {
  try {
    const { input, algorithm = 'sha256', save = false, extension = '.hash' } = req.body || {};
    if (typeof input !== 'string' || input.length === 0) {
      return res.status(400).json({ success: false, error: 'input is required' });
    }
    const result = await rawrz.hash(input, algorithm, Boolean(save), extension);
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/encrypt', async (req, res) => {
  try {
    const { algorithm = 'aes256', input, extension = '.enc' } = req.body || {};
    if (typeof input !== 'string' || input.length === 0) {
      return res.status(400).json({ success: false, error: 'input is required' });
    }
    const result = await rawrz.encrypt(algorithm, input, extension);
    if (result && result.success && result.filename) {
      result.fileUrl = `/uploads/${result.filename}`;
    }
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Avoid exposing potentially dangerous endpoints (e.g., traceroute, portscan, math eval)

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Not Found' });
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`RawrZ API listening on port ${port}`);
});

