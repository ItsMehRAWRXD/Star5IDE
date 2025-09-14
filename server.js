const express = require('express');
const RawrZStandalone = require('./rawrz-standalone');

const app = express();
const port = process.env.PORT || 8080;
const authToken = process.env.AUTH_TOKEN || '';

app.use(express.json({ limit: '5mb' }));

function isAuthorized(req) {
  if (!authToken) return false;
  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';
  return token && token === authToken;
}

app.get('/healthz', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.get('/', (req, res) => {
  res.json({
    name: 'RawrZ Security Platform API',
    version: '2.0.0',
    endpoints: {
      health: 'GET /healthz',
      run: 'POST /run (Authorization: Bearer <token>)'
    }
  });
});

app.post('/run', async (req, res) => {
  try {
    if (!authToken) {
      return res.status(503).json({ error: 'Service not configured. Set AUTH_TOKEN.' });
    }
    if (!isAuthorized(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { command, args } = req.body || {};
    if (!command) {
      return res.status(400).json({ error: 'Missing command' });
    }

    const rawrz = new RawrZStandalone();
    const result = await rawrz.processCommand([command, ...(Array.isArray(args) ? args : [])]);
    res.json({ success: true, command, args: Array.isArray(args) ? args : [], result: result ?? null });
  } catch (error) {
    res.status(500).json({ success: false, error: error?.message || 'Unknown error' });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[OK] RawrZ Security Platform API listening on port ${port}`);
});

