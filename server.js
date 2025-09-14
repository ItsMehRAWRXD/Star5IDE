const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const RawrZStandalone = require('./rawrz-standalone');
const rawrzEngine = require('./src/engines/rawrz-engine');

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

// Initialize core engine (lazy modules)
(async () => {
  try {
    await rawrzEngine.initializeModules();
    // eslint-disable-next-line no-console
    console.log('[OK] RawrZ core engine initialized');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[WARN] Failed to initialize core engine:', e.message);
  }
})();

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

// ===== RawrZ Core Engine endpoints =====
app.get('/engine/status', requireAuth, (req, res) => {
  try { res.json({ success: true, status: rawrzEngine.getStatus() }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/engine/compress', requireAuth, async (req, res) => {
  try {
    const { data, algorithm } = req.body || {};
    if (data === undefined) return res.status(400).json({ error: 'data is required' });
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(String(data));
    const result = await rawrzEngine.compress(buf, algorithm || null);
    // Return base64 for binary data
    res.json({ success: true, algorithm: result.algorithm, originalSize: result.originalSize, compressedSize: result.compressedSize, compressionRatio: result.compressionRatio, data: result.data.toString('base64') });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/engine/decompress', requireAuth, async (req, res) => {
  try {
    const { data, algorithm } = req.body || {};
    if (!data) return res.status(400).json({ error: 'data (base64) is required' });
    const moduleObj = await rawrzEngine.loadModule('compression');
    if (!moduleObj) return res.status(500).json({ error: 'compression module unavailable' });
    const buf = Buffer.from(String(data), 'base64');
    const result = await moduleObj.decompress(buf, algorithm || 'gzip');
    res.json({ success: true, algorithm: result.algorithm, originalSize: result.originalSize, data: result.data.toString('base64') });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/engine/advanced/encrypt', requireAuth, async (req, res) => {
  try {
    const { data, options } = req.body || {};
    if (data === undefined) return res.status(400).json({ error: 'data is required' });
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(String(data));
    const result = await rawrzEngine.encryptAdvanced(buf, options || {});
    res.json({ success: true, ...result, data: Buffer.isBuffer(result.data) ? result.data.toString('base64') : result.data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/engine/advanced/decrypt', requireAuth, async (req, res) => {
  try {
    const { data, options } = req.body || {};
    if (!data) return res.status(400).json({ error: 'data (base64) is required' });
    const buf = Buffer.from(String(data), 'base64');
    const result = await rawrzEngine.decryptAdvanced(buf, options || {});
    res.json({ success: true, data: Buffer.isBuffer(result) ? result.toString('base64') : result });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/engine/assemble', requireAuth, async (req, res) => {
  try {
    const { code, architecture = 'x64' } = req.body || {};
    if (!code) return res.status(400).json({ error: 'code is required' });
    const result = await rawrzEngine.assembleCode(String(code), String(architecture));
    res.json({ success: true, result });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/engine/polymorphize', requireAuth, async (req, res) => {
  try {
    const { code, options } = req.body || {};
    if (!code) return res.status(400).json({ error: 'code is required' });
    const result = await rawrzEngine.polymorphizeCode(String(code), options || {});
    res.json({ success: true, result });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/engine/anti-analysis', requireAuth, async (req, res) => {
  try {
    const { target } = req.body || {};
    if (!target) return res.status(400).json({ error: 'target is required' });
    const result = await rawrzEngine.runAntiAnalysis(String(target));
    res.json({ success: true, result });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/engine/memory/optimize', requireAuth, async (_req, res) => {
  try { const result = await rawrzEngine.optimizeMemory(); res.json({ success: true, result }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/engine/backup', requireAuth, async (req, res) => {
  try {
    const { target, options } = req.body || {};
    if (!target) return res.status(400).json({ error: 'target is required' });
    const result = await rawrzEngine.createBackup(String(target), options || {});
    res.json({ success: true, result });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/engine/mobile/analyze', requireAuth, async (req, res) => {
  try { const { target } = req.body || {}; if (!target) return res.status(400).json({ error: 'target is required' }); const result = await rawrzEngine.analyzeMobile(String(target)); res.json({ success: true, result }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/engine/network/analyze', requireAuth, async (req, res) => {
  try { const { target } = req.body || {}; if (!target) return res.status(400).json({ error: 'target is required' }); const result = await rawrzEngine.analyzeNetwork(String(target)); res.json({ success: true, result }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/engine/reverse', requireAuth, async (req, res) => {
  try { const { target } = req.body || {}; if (!target) return res.status(400).json({ error: 'target is required' }); const result = await rawrzEngine.reverseEngineer(String(target)); res.json({ success: true, result }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/engine/forensics', requireAuth, async (req, res) => {
  try { const { target } = req.body || {}; if (!target) return res.status(400).json({ error: 'target is required' }); const result = await rawrzEngine.performForensics(String(target)); res.json({ success: true, result }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/engine/malware/analyze', requireAuth, async (req, res) => {
  try { const { target } = req.body || {}; if (!target) return res.status(400).json({ error: 'target is required' }); const result = await rawrzEngine.analyzeMalware(String(target)); res.json({ success: true, result }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/engine/api-status', requireAuth, async (_req, res) => {
  try { const result = await rawrzEngine.getAPIStatus(); res.json({ success: true, result }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// Expanded API surface to mirror CLI commands
app.post('/decrypt', requireAuth, async (req, res) => {
  try {
    const { algorithm, input, key, iv, extension } = req.body || {};
    if (!algorithm || !input) return res.status(400).json({ error: 'algorithm and input are required' });
    const result = await rawrz.decrypt(algorithm, input, key, iv, extension);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/keygen', requireAuth, async (req, res) => {
  try {
    const { algorithm = 'aes256', length = 256, save = false, extension } = req.body || {};
    const result = await rawrz.generateKey(algorithm, parseInt(length) || 256, Boolean(save), extension);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/dns', requireAuth, async (req, res) => {
  try {
    const { hostname } = req.query;
    if (!hostname) return res.status(400).json({ error: 'hostname is required' });
    const result = await rawrz.dnsLookup(hostname);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/ping', requireAuth, async (req, res) => {
  try {
    const { host, save = 'false', extension } = req.query;
    if (!host) return res.status(400).json({ error: 'host is required' });
    const result = await rawrz.ping(String(host), save === 'true', extension);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/portscan', requireAuth, async (req, res) => {
  try {
    const { host, start = '1', end = '1000' } = req.query;
    if (!host) return res.status(400).json({ error: 'host is required' });
    const result = await rawrz.portScan(String(host), parseInt(start) || 1, parseInt(end) || 1000);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/traceroute', requireAuth, async (req, res) => {
  try {
    const { host } = req.query;
    if (!host) return res.status(400).json({ error: 'host is required' });
    const result = await rawrz.traceroute(String(host));
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/whois', requireAuth, async (req, res) => {
  try {
    const { domain } = req.query;
    if (!domain) return res.status(400).json({ error: 'domain is required' });
    const result = await rawrz.whois(String(domain));
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/analyze', requireAuth, async (req, res) => {
  try {
    const { input } = req.body || {};
    if (!input) return res.status(400).json({ error: 'input is required' });
    const result = await rawrz.analyzeFile(input);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/textops', requireAuth, async (req, res) => {
  try {
    const { operation, input } = req.body || {};
    if (!operation || !input) return res.status(400).json({ error: 'operation and input are required' });
    const result = await rawrz.textOperations(operation, input);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/validate', requireAuth, async (req, res) => {
  try {
    const { input, type } = req.body || {};
    if (!input || !type) return res.status(400).json({ error: 'input and type are required' });
    const result = await rawrz.validate(input, type);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/encode', requireAuth, async (req, res) => {
  try {
    const { type, input } = req.body || {};
    if (!type || !input) return res.status(400).json({ error: 'type and input are required' });
    let result;
    if (type === 'base64') result = await rawrz.base64Encode(input);
    else if (type === 'hex') result = await rawrz.hexEncode(input);
    else if (type === 'url') result = await rawrz.urlEncode(input);
    else return res.status(400).json({ error: 'unknown encode type' });
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/decode', requireAuth, async (req, res) => {
  try {
    const { type, input } = req.body || {};
    if (!type || !input) return res.status(400).json({ error: 'type and input are required' });
    let result;
    if (type === 'base64') result = await rawrz.base64Decode(input);
    else if (type === 'hex') result = await rawrz.hexDecode(input);
    else if (type === 'url') result = await rawrz.urlDecode(input);
    else return res.status(400).json({ error: 'unknown decode type' });
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/random', requireAuth, async (req, res) => {
  try {
    const { length = '32' } = req.query;
    const result = await rawrz.generateRandom(parseInt(length) || 32);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/password', requireAuth, async (req, res) => {
  try {
    const { length = '16', special = 'true' } = req.query;
    const result = await rawrz.generatePassword(parseInt(length) || 16, special !== 'false');
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/sign', requireAuth, async (req, res) => {
  try {
    const { input, privateKey } = req.body || {};
    if (!input) return res.status(400).json({ error: 'input is required' });
    const result = await rawrz.signData(input, privateKey || null);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/verify', requireAuth, async (req, res) => {
  try {
    const { input, signature, publicKey } = req.body || {};
    if (!input || !signature || !publicKey) return res.status(400).json({ error: 'input, signature, publicKey are required' });
    const result = await rawrz.verifySignature(input, signature, publicKey);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/fileops', requireAuth, async (req, res) => {
  try {
    const { operation, input, output } = req.body || {};
    if (!operation || !input) return res.status(400).json({ error: 'operation and input are required' });
    const result = await rawrz.fileOperations(operation, input, output);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/upload', requireAuth, async (req, res) => {
  try {
    const { filename, base64 } = req.body || {};
    if (!filename || !base64) return res.status(400).json({ error: 'filename and base64 are required' });
    const result = await rawrz.uploadFile(filename, base64);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/download', requireAuth, async (req, res) => {
  try {
    const filename = String(req.query.filename || '');
    if (!filename) return res.status(400).json({ error: 'filename is required' });
    const full = require('path').join(__dirname, 'uploads', filename);
    return res.download(full, filename);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

