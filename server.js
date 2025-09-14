const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const RawrZStandalone = require('./rawrz-standalone');

const app = express();
const port = parseInt(process.env.PORT, 10) || 8080;
const authToken = process.env.AUTH_TOKEN || '';

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use('/static', express.static(path.join(__dirname, 'public')));

function requireAuth(req, res, next) {
  if (!authToken) {
    return next();
  }
  const header = req.headers['authorization'] || '';
  const queryToken = req.query.token;
  if (header.startsWith('Bearer ')) {
    const provided = header.slice('Bearer '.length).trim();
    if (provided === authToken) return next();
  }
  if (queryToken && queryToken === authToken) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

const rawrz = new RawrZStandalone();

app.get('/health', (req, res) => {
  res.json({ ok: true, status: 'healthy' });
});

app.get('/help', requireAuth, (req, res) => {
  res.json({
    name: 'RawrZ Security Platform API',
    endpoints: {
      health: 'GET /health',
      help: 'GET /help',
      sysinfo: 'GET /sysinfo',
      time: 'GET /time',
      uuid: 'GET /uuid',
      hash: 'POST /hash { input, algorithm?, save?, extension? }',
      encrypt: 'POST /encrypt { algorithm, input, extension? }',
      files: 'GET /files'
    },
  });
});

app.get('/sysinfo', requireAuth, async (req, res) => {
  try {
    const result = await rawrz.systemInfo();
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/time', requireAuth, async (req, res) => {
  try {
    const result = await rawrz.getTime();
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/uuid', requireAuth, async (req, res) => {
  try {
    const result = await rawrz.generateUUID();
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/hash', requireAuth, async (req, res) => {
  try {
    const { input, algorithm = 'sha256', save = false, extension } = req.body || {};
    if (!input) return res.status(400).json({ error: 'input is required' });
    const result = await rawrz.hash(input, algorithm, Boolean(save), extension);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/encrypt', requireAuth, async (req, res) => {
  try {
    const { algorithm, input, extension } = req.body || {};
    if (!algorithm) return res.status(400).json({ error: 'algorithm is required' });
    if (!input) return res.status(400).json({ error: 'input is required' });
    const result = await rawrz.encrypt(algorithm, input, extension);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/files', requireAuth, async (req, res) => {
  try {
    const result = await rawrz.listFiles();
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/panel', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'panel.html'));
});

app.get('/', (req, res) => {
  res.redirect('/panel');
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[OK] RawrZ API listening on port ${port}`);
});

