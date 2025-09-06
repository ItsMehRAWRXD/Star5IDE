#!/usr/bin/env node
"use strict";

const http = require("http");
const url = require("url");
const { spawn, execFileSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const DEFAULT_ALLOWED_ORIGINS = ['https://lionfish-app-ey7kn.ondigitalocean.app'];
const DEFAULT_CORS_ORIGIN = 'null';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS && process.env.ALLOWED_ORIGINS.trim().length
  ? process.env.ALLOWED_ORIGINS.split(",").map(s => s.trim()).filter(Boolean)
  : DEFAULT_ALLOWED_ORIGINS);

const PORT = process.env.PORT ? Number(process.env.PORT) : 8088;
const HOST = process.env.HOST || '127.0.0.1';
const REQUIRED_BEARER = process.env.BEARER_TOKEN || '';
const CLI = path.join(__dirname, "..", "tools", "carmilla-openssl.js");

function setCors(res, origin = DEFAULT_CORS_ORIGIN) {
  const allow = isOriginAllowed(origin) ? origin : DEFAULT_CORS_ORIGIN;
  res.setHeader("access-control-allow-origin", allow);
  res.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
  res.setHeader("access-control-allow-headers", "content-type");
}

function isOriginAllowed(origin) {
  if (!origin) return false;
  return ALLOWED_ORIGINS.includes(origin);
}

function isAuthorized(req) {
  if (!REQUIRED_BEARER) return false; // locked until configured
  const auth = req.headers['authorization'] || '';
  const expected = 'Bearer ' + REQUIRED_BEARER;
  return auth === expected;
}

function authRequired(pathname) {
  // Allow health without auth; preflight handled separately
  if (pathname === '/health') return false;
  return true;
}

function bad(res, code, msg) {
  setCors(res);
  res.writeHead(code, { "content-type": "application/json" });
  res.end(JSON.stringify({ error: msg }));
}

function runCli(args, inputBuffer) {
  return new Promise((resolve, reject) => {
    const ps = spawn(process.execPath, [CLI, ...args]);
    let out = Buffer.alloc(0);
    let err = Buffer.alloc(0);
    ps.stdout.on("data", d => (out = Buffer.concat([out, d])));
    ps.stderr.on("data", d => (err = Buffer.concat([err, d])));
    ps.on("close", (code) => {
      if (code === 0) resolve(out);
      else reject(new Error(err.toString() || `CLI exited ${code}`));
    });
    if (inputBuffer && inputBuffer.length) ps.stdin.write(inputBuffer);
    ps.stdin.end();
  });
}

const server = http.createServer(async (req, res) => {
  const { method } = req;
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname || "/";
  const origin = req.headers["origin"] || DEFAULT_CORS_ORIGIN;

  // Endpoints disabled: deny all requests
  setCors(res, origin);
  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ error: "disabled" }));
  return;

  // CORS preflight — no auth required but still enforce allowed origin
  if (method === "OPTIONS") {
    setCors(res, origin);
    res.writeHead(204);
    return res.end();
  }

  // Auth check
  if (authRequired(pathname) && !isAuthorized(req)) {
    setCors(res, origin);
    res.writeHead(401, { "content-type": "application/json", "www-authenticate": "Bearer" });
    res.end(JSON.stringify({ error: "unauthorized" }));
    return;
  }

  // Health
  if (method === "GET" && pathname === "/health") {
    setCors(res, origin);
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  // Capabilities (what the server supports)
  if (method === "GET" && pathname === "/capabilities") {
    setCors(res, origin);
    res.writeHead(200, { "content-type": "application/json" });
    const caps = getDynamicCapabilities();
    res.end(JSON.stringify(caps));
    return;
  }

  // Stub generator
  if (method === "GET" && pathname === "/stub") {
    setCors(res, origin);
    const lang = (parsed.query.lang || 'powershell').toString().toLowerCase();
    const filename = lang === 'node' ? 'decrypt_camellia.js' : 'decrypt_camellia.ps1';
    const content = lang === 'node' ? generateNodeStub() : generatePowerShellStub();
    res.writeHead(200, {
      "content-type": "text/plain; charset=utf-8",
      "content-disposition": `attachment; filename=${filename}`,
    });
    res.end(content);
    return;
  }

  // Bundle a stub with an embedded package (POST body = packaged base64)
  if (method === "POST" && pathname === "/bundle") {
    if (!isOriginAllowed(origin)) return bad(res, 403, "origin not allowed");
    setCors(res, origin);
    const lang = (parsed.query.stub || 'powershell').toString().toLowerCase();
    const baseName = ((parsed.query.name || 'file').toString().replace(/[^a-zA-Z0-9._-]/g, '') || 'file').replace(/\.[^.]+$/, '');
    let outExt = (parsed.query.ext || '').toString();
    if (outExt && !outExt.startsWith('.')) outExt = `.${outExt}`;
    const injectPass = (parsed.query.pass || '').toString();
    // collect body as text (packaged base64)
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      try {
        const packagedB64 = Buffer.concat(chunks).toString('utf8').trim();
        const code = (lang === 'node')
          ? generateNodeStubEmbedded(packagedB64, baseName, outExt || '.bin', injectPass)
          : generatePowerShellStubEmbedded(packagedB64, baseName, outExt || '.bin', injectPass);
        const filename = `${baseName}_decrypt.${lang === 'node' ? 'js' : 'ps1'}`;
        res.writeHead(200, {
          "content-type": "text/plain; charset=utf-8",
          "content-disposition": `attachment; filename=${filename}`,
        });
        res.end(code);
      } catch (e) {
        bad(res, 400, 'invalid package');
      }
    });
    return;
  }

  // Static index
  if (method === "GET" && (pathname === "/" || pathname === "/index.html")) {
    const file = path.join(__dirname, "public", "index.html");
    try {
      const html = fs.readFileSync(file);
      setCors(res, origin);
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(html);
    } catch {
      bad(res, 404, "index not found");
    }
    return;
  }

  // Collect body
  const chunks = [];
  req.on("data", (c) => chunks.push(c));
  req.on("end", async () => {
    const body = Buffer.concat(chunks);

    try {
      if (method === "POST" && pathname === "/encrypt") {
        if (!isOriginAllowed(origin)) return bad(res, 403, "origin not allowed");
        const pass = parsed.query.pass;
        const mode = (parsed.query.mode || 'password').toString();
        if (mode === 'password' && !pass) return bad(res, 400, "pass required as ?pass=");
        const cipher = parsed.query.cipher || "camellia-256-cbc";
        const download = parsed.query.download === "1";
        // honor client-provided name/ext for filename
        let reqExt = (parsed.query.ext || "").toString();
        if (reqExt && !reqExt.startsWith('.')) reqExt = `.${reqExt}`;
        const safeExt = (reqExt || '').replace(/[^.a-zA-Z0-9_-]/g, '');
        const baseName = ((parsed.query.name || 'file').toString().replace(/[^a-zA-Z0-9._-]/g, '') || 'file').replace(/\.[^.]+$/, '');
        const outFile = `${baseName}${safeExt}`;
        let cliPass = pass;
        let packaged = null;
        if (mode === 'autokey') {
          // Generate random 32-byte key, base64 encode
          const keyBytes = crypto.getRandomValues(new Uint8Array(32));
          const keyB64 = Buffer.from(keyBytes).toString('base64');
          cliPass = keyB64;
          const out = await runCli(["encrypt", "--pass", String(cliPass), "--cipher", String(cipher)], body);
          // Inject autokey metadata with embedded key
          try {
            const pkgJsonStr = Buffer.from(String(out), 'base64').toString('utf8');
            const pkg = JSON.parse(pkgJsonStr);
            pkg.meta = Object.assign({}, pkg.meta || {}, { autokey: true, key_b64: keyB64 });
            const newB64 = Buffer.from(JSON.stringify(pkg), 'utf8').toString('base64');
            packaged = Buffer.from(newB64, 'utf8');
          } catch {
            packaged = out;
          }
        } else {
          packaged = await runCli(["encrypt", "--pass", String(cliPass), "--cipher", String(cipher)], body);
        }
        setCors(res, origin);
        const headers = { "content-type": "application/octet-stream" };
        if (download) {
          headers["content-disposition"] = `attachment; filename=${outFile || 'encrypted'}`;
        }
        res.writeHead(200, headers);
        res.end(packaged);
        return;
      }

      if (method === "POST" && pathname === "/decrypt") {
        if (!isOriginAllowed(origin)) return bad(res, 403, "origin not allowed");
        const pass = parsed.query.pass;
        let cliPass = pass;
        const cipher = parsed.query.cipher; // optional override
        const download = parsed.query.download === "1";
        // honor client-provided name/ext for filename
        let reqExt = (parsed.query.ext || "").toString();
        if (reqExt && !reqExt.startsWith('.')) reqExt = `.${reqExt}`;
        const safeExt = (reqExt || '').replace(/[^.a-zA-Z0-9_-]/g, '');
        const baseName = ((parsed.query.name || 'file').toString().replace(/[^a-zA-Z0-9._-]/g, '') || 'file').replace(/\.[^.]+$/, '');
        const outFile = `${baseName}${safeExt}`;
        // If no pass provided, try to extract embedded autokey from package
        if (!cliPass) {
          try {
            const packagedStr = body.toString('utf8').trim();
            const pkgJsonStr = Buffer.from(packagedStr, 'base64').toString('utf8');
            const pkg = JSON.parse(pkgJsonStr);
            if (pkg && pkg.meta && pkg.meta.key_b64) {
              cliPass = String(pkg.meta.key_b64);
            }
          } catch {}
        }
        if (!cliPass) return bad(res, 400, "pass required or package must contain autokey");
        const cliArgs = ["decrypt", "--pass", String(cliPass)];
        if (cipher) { cliArgs.push("--cipher", String(cipher)); }
        const out = await runCli(cliArgs, body);
        setCors(res, origin);
        const headers = { "content-type": "application/octet-stream" };
        if (download) {
          headers["content-disposition"] = `attachment; filename=${outFile || 'decrypted'}`;
        }
        res.writeHead(200, headers);
        res.end(out);
        return;
      }

      bad(res, 404, "not found");
    } catch (e) {
      bad(res, 500, String(e && e.message ? e.message : e));
    }
  });
});

server.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`Encrypt server disabled (no endpoints) on http://${HOST}:${PORT}`);
});

// ---- dynamic capabilities ----
function getDynamicCapabilities() {
  let ciphers = [];
  try {
    const out = execFileSync('openssl', ['enc', '-ciphers']).toString();
    const line = out.split(/\r?\n/).find(l => l.includes(':')) || '';
    ciphers = line.split(':').pop().split().flatMap(s => s.split(/\s+/)).filter(Boolean);
  } catch {}
  // Normalize common ones
  const has = (name) => ciphers.includes(name);
  const list = [];
  if (has('camellia-256-cbc')) list.push('camellia-256-cbc');
  if (has('aes-256-cbc')) list.push('aes-256-cbc');
  // Provide alias used by UI
  list.push('carmilla-256-cbc');
  const unique = Array.from(new Set(list));
  return {
    name: 'screenpilot-encrypt',
    cors: true,
    modes: ['password', 'autokey'],
    ciphers: unique,
    defaultCipher: unique.includes('camellia-256-cbc') ? 'camellia-256-cbc' : (unique[0] || 'aes-256-cbc'),
    endpoints: ['/encrypt', '/decrypt', '/health', '/capabilities', '/stub', '/bundle'],
    stubs: ['powershell', 'node']
  };
}

// ---- stubs ----
function generatePowerShellStub() {
  return `# Decrypt autokey package using OpenSSL (Camellia-256-CBC)
param(
  [Parameter(Mandatory=$true)][string]$In,
  [Parameter(Mandatory=$false)][string]$Out
)
if (-not $Out) { $Out = [IO.Path]::ChangeExtension($In, '.bin') }
$b64 = Get-Content -Raw -LiteralPath $In
$json = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($b64))
$pkg = $json | ConvertFrom-Json
if (-not $pkg.meta.key_b64) { Write-Error 'No autokey in package'; exit 1 }
$key = $pkg.meta.key_b64
$cipher = if ($pkg.meta.openssl_cipher) { $pkg.meta.openssl_cipher } else { 'camellia-256-cbc' }
$tmp = [IO.Path]::GetTempFileName()
[IO.File]::WriteAllBytes($tmp, [Convert]::FromBase64String($pkg.data))
& openssl enc -d -$cipher -salt -pbkdf2 -pass pass:$key -in $tmp -out $Out
Remove-Item $tmp -Force
Write-Host "Decrypted -> $Out"
`;
}

function generateNodeStub() {
  return `// Decrypt autokey package using OpenSSL (Camellia-256-CBC)
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const [,, input, outputArg] = process.argv;
if (!input) { console.error('Usage: node decrypt_camellia.js <input.pkg> [output.bin]'); process.exit(1); }
const out = outputArg || path.format({ dir: path.dirname(input), name: path.parse(input).name, ext: '.bin' });
const b64 = fs.readFileSync(input, 'utf8').trim();
const pkg = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
if (!pkg.meta || !pkg.meta.key_b64) { console.error('No autokey in package'); process.exit(1); }
const key = pkg.meta.key_b64;
const cipher = (pkg.meta && pkg.meta.openssl_cipher) ? pkg.meta.openssl_cipher : 'camellia-256-cbc';
const tmp = fs.mkdtempSync(require('os').tmpdir() + path.sep + 'dec-') + '.bin';
fs.writeFileSync(tmp, Buffer.from(pkg.data, 'base64'));
execFileSync('openssl', ['enc', '-d', '-' + cipher, '-salt', '-pbkdf2', '-pass', 'pass:' + key, '-in', tmp, '-out', out], { stdio: 'inherit' });
fs.unlinkSync(tmp);
console.log('Decrypted ->', out);
`;
}

function generatePowerShellStubEmbedded(pkgB64, baseName, outExt, pass) {
  // If autokey is present in package, the stub uses it; otherwise, if pass provided, uses that.
  return `# Embedded decrypt stub (Camellia/AES via OpenSSL)\n# Output: ${baseName}${outExt}\n$Out = Join-Path (Get-Location) '${baseName.replace(/'/g, "''")}${outExt.replace(/'/g, "''")}'\n$b64 = @'\n${pkgB64}\n'@\n$json = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($b64))\n$pkg = $json | ConvertFrom-Json\n$key = $null\nif ($pkg.meta -and $pkg.meta.key_b64) { $key = $pkg.meta.key_b64 } elseif ('${pass.replace(/'/g, "''")}') { $key = '${pass.replace(/'/g, "''")}' } else { Write-Error 'No key available (autokey missing and no pass provided)'; exit 1 }\n$cipher = if ($pkg.meta -and $pkg.meta.openssl_cipher) { $pkg.meta.openssl_cipher } else { 'camellia-256-cbc' }\n$tmp = [IO.Path]::GetTempFileName()\n[IO.File]::WriteAllBytes($tmp, [Convert]::FromBase64String($pkg.data))\n& openssl enc -d -$cipher -salt -pbkdf2 -pass pass:$key -in $tmp -out $Out\nRemove-Item $tmp -Force\nWrite-Host \"Decrypted -> $Out\"\n`;
}

function generateNodeStubEmbedded(pkgB64, baseName, outExt, pass) {
  return `// Embedded decrypt stub (Camellia/AES via OpenSSL)\nconst { execFileSync } = require('child_process');\nconst fs = require('fs');\nconst path = require('path');\nconst out = path.resolve(process.cwd(), ${JSON.stringify(baseName + outExt)});\nconst pkg = JSON.parse(Buffer.from(${JSON.stringify(pkgB64)}, 'base64').toString('utf8'));\nlet key = (pkg.meta && pkg.meta.key_b64) ? pkg.meta.key_b64 : ${JSON.stringify(pass || '')};\nif (!key) { console.error('No key available (autokey missing and no pass provided)'); process.exit(1); }\nconst cipher = (pkg.meta && pkg.meta.openssl_cipher) ? pkg.meta.openssl_cipher : 'camellia-256-cbc';\nconst tmp = fs.mkdtempSync(require('os').tmpdir() + path.sep + 'dec-') + '.bin';\nfs.writeFileSync(tmp, Buffer.from(pkg.data, 'base64'));\nexecFileSync('openssl', ['enc', '-d', '-' + cipher, '-salt', '-pbkdf2', '-pass', 'pass:' + key, '-in', tmp, '-out', out], { stdio: 'inherit' });\nfs.unlinkSync(tmp);\nconsole.log('Decrypted ->', out);\n`;
}

