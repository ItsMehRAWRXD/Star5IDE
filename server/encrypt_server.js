#!/usr/bin/env node
"use strict";

const http = require("http");
const url = require("url");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const { createHotPatcher } = require("./hotpatcher");

const DEFAULT_CORS_ORIGIN = "*";
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);

const PORT = process.env.PORT ? Number(process.env.PORT) : 8088;
const CLI = path.join(__dirname, "..", "tools", "camellia-cli.js");

function setCors(res, origin = DEFAULT_CORS_ORIGIN) {
  res.setHeader("access-control-allow-origin", origin);
  res.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
  res.setHeader("access-control-allow-headers", "content-type");
}

function isOriginAllowed(origin) {
  if (!ALLOWED_ORIGINS.length) return true;
  if (!origin) return false;
  return ALLOWED_ORIGINS.includes(origin);
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

// ---- hot patcher targets (originals preserved) ----
const HP = createHotPatcher();

HP.registerTarget('encrypt', async function encryptHandler(body, query) {
  const pass = query.pass;
  const mode = (query.mode || 'password').toString();
  if (mode === 'password' && !pass) throw new Error("pass required as ?pass=");
  const cipher = query.cipher || "camellia-256-cbc";
  let cliPass = pass;

  if (mode === 'autokey') {
    const keyBytes = globalThis.crypto?.getRandomValues
      ? globalThis.crypto.getRandomValues(new Uint8Array(32))
      : require('crypto').randomBytes(32);
    const keyB64 = Buffer.from(keyBytes).toString('base64');
    cliPass = keyB64;
    const out = await runCli(["encrypt", "--pass", String(cliPass), "--cipher", String(cipher)], body);
    try {
      const pkgJsonStr = Buffer.from(String(out), 'base64').toString('utf8');
      const pkg = JSON.parse(pkgJsonStr);
      pkg.meta = Object.assign({}, pkg.meta || {}, { autokey: true, key_b64: keyB64 });
      const newB64 = Buffer.from(JSON.stringify(pkg), 'utf8').toString('base64');
      return Buffer.from(newB64, 'utf8');
    } catch {
      return out;
    }
  } else {
    return await runCli(["encrypt", "--pass", String(cliPass), "--cipher", String(cipher)], body);
  }
});

HP.registerTarget('decrypt', async function decryptHandler(body, query) {
  const cipher = query.cipher;
  let cliPass = query.pass;
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
  if (!cliPass) throw new Error("pass required or package must contain autokey");
  const cliArgs = ["decrypt", "--pass", String(cliPass)];
  if (cipher) { cliArgs.push("--cipher", String(cipher)); }
  return await runCli(cliArgs, body);
});

const server = http.createServer(async (req, res) => {
  const { method } = req;
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname || "/";
  const origin = req.headers["origin"] || DEFAULT_CORS_ORIGIN;

  if (method === "OPTIONS") {
    setCors(res, origin);
    res.writeHead(204);
    return res.end();
  }

  if (method === "GET" && pathname === "/health") {
    setCors(res, origin);
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

// ── serve the web panel ─────────────────────────
if (method === 'GET' && pathname === '/panel') {
  try {
    const file = path.join(__dirname, 'public', 'panel.html');
    const html = fs.readFileSync(file);
    setCors(res, origin);
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    return res.end(html);
  } catch {
    return bad(res, 500, 'panel not found');
  }
}

    const basenameExt = (name='file') => {
      const m = name.match(/^(.*?)(\.[^.]+)?$/);
      return { base: (m && m[1]) || 'file', ext: (m && m[2]) || '' };
    };

    $("btnHealth").onclick = async () => {
      const r = await fetch(`${apiBase}/health`);
      $("statusOut").textContent = await asJson(r);
    };
    $("btnCaps").onclick = async () => {
      const r = await fetch(`${apiBase}/capabilities`);
      $("statusOut").textContent = await asJson(r);
    };

    $("btnEncrypt").onclick = async () => {
      const f = $("encFile").files[0];
      const mode = $("encMode").value;
      const cipher = $("encCipher").value;
      const pass = $("encPass").value.trim();
      const outExt = $("encExt").value.trim();
      if (!f) { $("encOut").textContent = "Choose a file."; return; }
      if (mode === "password" && !pass) { $("encOut").textContent = "Enter a passphrase."; return; }
      const { base, ext } = basenameExt(f.name);
      const extFinal = outExt || ext;
      const qs = new URLSearchParams({ mode, cipher, download: "1", name: base, ext: extFinal });
      if (pass) qs.set("pass", pass);
      const r = await fetch(`${apiBase}/encrypt?${qs.toString()}`, { method: "POST", body: f });
      if (!r.ok) { $("encOut").textContent = await asJson(r); return; }
      const blob = await r.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${base}${extFinal}`;
      document.body.appendChild(a); a.click(); a.remove();
      $("encOut").textContent = "Encrypted and downloaded.";
    };

    $("btnDecrypt").onclick = async () => {
      const f = $("decFile").files[0];
      const pass = $("decPass").value.trim();
      const outExt = $("decExt").value.trim();
      if (!f) { $("decOut").textContent = "Choose a file."; return; }
      const { base } = basenameExt(f.name);
      const qs = new URLSearchParams({ download: "1", name: base, ext: outExt || ".bin" });
      if (pass) qs.set("pass", pass);
      const r = await fetch(`${apiBase}/decrypt?${qs.toString()}`, { method: "POST", body: f });
      if (!r.ok) { $("decOut").textContent = await asJson(r); return; }
      const blob = await r.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${base}${outExt || ".bin"}`;
      document.body.appendChild(a); a.click(); a.remove();
      $("decOut").textContent = "Decrypted and downloaded.";
    };

    $("btnStub").onclick = async () => {
      const f = $("pkgFile").files[0];
      if (!f) { $("stubOut").textContent = "Choose a package file."; return; }
      const lang = $("stubLang").value;
      const outExt = $("stubOutExt").value.trim() || ".bin";
      const pass = $("stubPass").value.trim();
      const { base } = basenameExt(f.name || "file.pkg");
      const qs = new URLSearchParams({ stub: lang, name: base, ext: outExt });
      if (pass) qs.set("pass", pass);
      const r = await fetch(`${apiBase}/bundle?${qs.toString()}`, { method: "POST", body: await f.text() });
      if (!r.ok) { $("stubOut").textContent = await asJson(r); return; }
      const blob = await r.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${base}_decrypt.${lang === "node" ? "js" : "ps1"}`;
      document.body.appendChild(a); a.click(); a.remove();
      $("stubOut").textContent = "Stub generated.";
    };

    async function hpStatus() {
      const r = await fetch(`${apiBase}/hot/status`);
      $("hpOut").textContent = await asJson(r);
    }
    $("btnHpStatus").onclick = hpStatus;

    $("btnHpRun").onclick = async () => {
      const target = $("hpTarget").value;
      const action = $("hpAction").value;
      const code = $("hpCode").value;
      const id = $("hpId").value.trim();

      try {
        let resp;
        if (action === "install") {
          resp = await fetch(`${apiBase}/hot/install`, { method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify({ name: target, code }) });
        } else if (action === "uninstall") {
          if (!id) { $("hpOut").textContent = "Provide patch id."; return; }
          resp = await fetch(`${apiBase}/hot/uninstall`, { method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify({ id }) });
        } else if (action === "spoof") {
          resp = await fetch(`${apiBase}/hot/spoof`, { method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify({ name: target, code }) });
        } else if (action === "clearBase") {
          resp = await fetch(`${apiBase}/hot/spoof/clear`, { method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify({ name: target }) });
        } else {
          return hpStatus();
        }
        $("hpOut").textContent = await asJson(resp);
      } catch (e) {
        $("hpOut").textContent = String(e?.message || e);
      }
    };

    // Initial
    (async () => {
      try {
        const [h,c] = await Promise.all([fetch(`${apiBase}/health`), fetch(`${apiBase}/capabilities`)]);
        $("statusOut").textContent = (await h.ok ? "Health OK\n" : "Health ERR\n") + (await asJson(c));
      } catch { $("statusOut").textContent = "Unable to reach server."; }
    })();
  </script>
</body>
</html>`);
  return;
  }

    if (method === "GET" && (pathname === "/" || pathname === "/index.html")) {
    const file = path.join(__dirname, "public", "index.html");
    try {
    const html = fs.readFileSync(file);
    setCors(res, origin);
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(html);
    } catch {
    setCors(res, origin);
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(`<!doctype html>...PASTE FULL PANEL HTML HERE...`);
   }
    return;
  }
  
  // Static capabilities
  if (method === "GET" && pathname === "/capabilities") {
    setCors(res, origin);
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(getStaticCapabilities()));
    return;
  }

  // Dynamic capabilities (additive)
  if (method === "GET" && pathname === "/capabilities/dynamic") {
    setCors(res, origin);
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(getDynamicCapabilitiesSafe()));
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

  // Bundle a stub with embedded package
  if (method === "POST" && pathname === "/bundle") {
    if (!isOriginAllowed(origin)) return bad(res, 403, "origin not allowed");
    setCors(res, origin);
    const lang = (parsed.query.stub || 'powershell').toString().toLowerCase();
    const baseName = ((parsed.query.name || 'file').toString().replace(/[^a-zA-Z0-9._-]/g, '') || 'file').replace(/\.[^.]+$/, '');
    let outExt = (parsed.query.ext || '').toString();
    if (outExt && !outExt.startsWith('.')) outExt = `.${outExt}`;
    const injectPass = (parsed.query.pass || '').toString();
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
      } catch {
        bad(res, 400, 'invalid package');
      }
    });
    return;
  }

  // Collect body
  const chunks = [];
  req.on("data", (c) => chunks.push(c));
  req.on("end", async () => {
    const body = Buffer.concat(chunks);

    try {
      // Hot patch API
      if (method === "POST" && pathname === "/hot/install") {
        if (!isOriginAllowed(origin)) return bad(res, 403, "origin not allowed");
        setCors(res, origin);
        let payload = {};
        try { payload = JSON.parse(body.toString('utf8')); } catch {}
        const name = String(payload.name || '');
        const code = String(payload.code || '');
        if (!name || !code) return bad(res, 400, 'name and code required');
        try {
          const info = HP.installPatch(name, code);
          res.writeHead(200, { "content-type": "application/json" });
          res.end(JSON.stringify({ ok: true, patch: info }));
        } catch (e) {
          return bad(res, 400, String(e && e.message ? e.message : e));
        }
        return;
      }

      if (method === "POST" && pathname === "/hot/uninstall") {
        if (!isOriginAllowed(origin)) return bad(res, 403, "origin not allowed");
        setCors(res, origin);
        let payload = {};
        try { payload = JSON.parse(body.toString('utf8')); } catch {}
        const id = String(payload.id || '');
        if (!id) return bad(res, 400, 'id required');
        const info = HP.uninstallPatch(id);
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: true, result: info }));
        return;
      }

      if (method === "GET" && pathname === "/hot/status") {
        setCors(res, origin);
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: true, targets: HP.status() }));
        return;
      }

      // Spoof base API
      if (method === "POST" && pathname === "/hot/spoof") {
        if (!isOriginAllowed(origin)) return bad(res, 403, "origin not allowed");
        setCors(res, origin);
        let payload = {};
        try { payload = JSON.parse(body.toString('utf8')); } catch {}
        const name = String(payload.name || '');
        const code = String(payload.code || '');
        if (!name || !code) return bad(res, 400, 'name and code required');
        try {
          const info = HP.setBase(name, code);
          res.writeHead(200, { "content-type": "application/json" });
          res.end(JSON.stringify({ ok: true, spoof: info }));
        } catch (e) {
          return bad(res, 400, String(e && e.message ? e.message : e));
        }
        return;
      }

      if (method === "POST" && pathname === "/hot/spoof/clear") {
        if (!isOriginAllowed(origin)) return bad(res, 403, "origin not allowed");
        setCors(res, origin);
        let payload = {};
        try { payload = JSON.parse(body.toString('utf8')); } catch {}
        const name = String(payload.name || '');
        if (!name) return bad(res, 400, 'name required');
        const info = HP.clearBase(name);
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: true, spoof: info }));
        return;
      }

      // Encrypt/Decrypt via hot patcher proxies
      if (method === "POST" && pathname === "/encrypt") {
        if (!isOriginAllowed(origin)) return bad(res, 403, "origin not allowed");
        const download = parsed.query.download === "1";
        let reqExt = (parsed.query.ext || "").toString();
        if (reqExt && !reqExt.startsWith('.')) reqExt = `.${reqExt}`;
        const safeExt = (reqExt || '').replace(/[^.a-zA-Z0-9_-]/g, '');
        const baseName = ((parsed.query.name || 'file').toString().replace(/[^a-zA-Z0-9._-]/g, '') || 'file').replace(/\.[^.]+$/, '');
        const outFile = `${baseName}${safeExt}`;
        const packaged = await HP.get('encrypt')(body, parsed.query);
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
        const download = parsed.query.download === "1";
        let reqExt = (parsed.query.ext || "").toString();
        if (reqExt && !reqExt.startsWith('.')) reqExt = `.${reqExt}`;
        const safeExt = (reqExt || '').replace(/[^.a-zA-Z0-9_-]/g, '');
        const baseName = ((parsed.query.name || 'file').toString().replace(/[^a-zA-Z0-9._-]/g, '') || 'file').replace(/\.[^.]+$/, '');
        const outFile = `${baseName}${safeExt}`;
        const out = await HP.get('decrypt')(body, parsed.query);
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

server.listen(PORT, () => {
  console.log(`Encrypt server listening on port ${PORT}`);
});

// ---- static capabilities ----
function getStaticCapabilities() {
  const ciphers = ['camellia-256-cbc', 'aes-256-cbc'];
  return {
    name: 'screenpilot-encrypt',
    cors: true,
    modes: ['password', 'autokey'],
    ciphers,
    defaultCipher: 'camellia-256-cbc',
    endpoints: [
      '/encrypt', '/decrypt', '/health',
      '/capabilities', '/capabilities/dynamic',
      '/stub', '/bundle',
      '/hot/install', '/hot/uninstall', '/hot/status',
      '/hot/spoof', '/hot/spoof/clear'
    ],
    stubs: ['powershell', 'node']
  };
}

// ---- dynamic capabilities (additive) ----
function getDynamicCapabilitiesSafe() {
  const result = getStaticCapabilities();
  try {
    const { execFileSync } = require('child_process');
    const out = execFileSync('openssl', ['enc', '-ciphers']).toString();
    const line = out.split(/\r?\n/).find(l => l.includes(':')) || '';
    const ciphers = line.split(':').pop().split().flatMap(s => s.split(/\s+/)).filter(Boolean);
    const prefer = ['camellia-256-cbc', 'aes-256-cbc'];
    const available = prefer.filter(c => ciphers.includes(c));
    if (available.length) {
      result.ciphers = Array.from(new Set([...available]));
      result.defaultCipher = available[0];
    }
  } catch {}
  return result;
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
  return `# Embedded decrypt stub (Camellia/AES via OpenSSL)\n# Output: ${baseName}${outExt}\n$Out = Join-Path (Get-Location) '${baseName.replace(/'/g, "''")}${outExt.replace(/'/g, "''")}'\n$b64 = @'\n${pkgB64}\n'@\n$json = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($b64))\n$pkg = $json | ConvertFrom-Json\n$key = $null\nif ($pkg.meta -and $pkg.meta.key_b64) { $key = $pkg.meta.key_b64 } elseif ('${pass.replace(/'/g, "''")}') { $key = '${pass.replace(/'/g, "''")}' } else { Write-Error 'No key available (autokey missing and no pass provided)'; exit 1 }\n$cipher = if ($pkg.meta -and $pkg.meta.openssl_cipher) { $pkg.meta.openssl_cipher } else { 'camellia-256-cbc' }\n$tmp = [IO.Path]::GetTempFileName()\n[IO.File]::WriteAllBytes($tmp, [Convert]::FromBase64String($pkg.data))\n& openssl enc -d -$cipher -salt -pbkdf2 -pass pass:$key -in $tmp -out $Out\nRemove-Item $tmp -Force\nWrite-Host \"Decrypted -> $Out\"\n`;
}

function generateNodeStubEmbedded(pkgB64, baseName, outExt, pass) {
  return `// Embedded decrypt stub (Camellia/AES via OpenSSL)\nconst { execFileSync } = require('child_process');\nconst fs = require('fs');\nconst path = require('path');\nconst out = path.resolve(process.cwd(), ${JSON.stringify(baseName + outExt)});\nconst pkg = JSON.parse(Buffer.from(${JSON.stringify(pkgB64)}, 'base64').toString('utf8'));\nlet key = (pkg.meta && pkg.meta.key_b64) ? pkg.meta.key_b64 : ${JSON.stringify(pass || '')};\nif (!key) { console.error('No key available (autokey missing and no pass provided)'); process.exit(1); }\nconst cipher = (pkg.meta && pkg.meta.openssl_cipher) ? pkg.meta.openssl_cipher : 'camellia-256-cbc';\nconst tmp = fs.mkdtempSync(require('os').tmpdir() + path.sep + 'dec-') + '.bin';\nfs.writeFileSync(tmp, Buffer.from(pkg.data, 'base64'));\nexecFileSync('openssl', ['enc', '-d', '-' + cipher, '-salt', '-pbkdf2', '-pass', 'pass:' + key, '-in', tmp, '-out', out], { stdio: 'inherit' });\nfs.unlinkSync(tmp);\nconsole.log('Decrypted ->', out);\n`;
}

fix: serve /panel from public/panel.html,
choose “Commit directly to the main branch”, and press Commit changes.

──────────────────────────────────────── What happens after you press Commit? ──────────────────────────────────────── • DigitalOcean App Platform sees the new commit on main, kicks off a build, builds a fresh image, and re-starts your component.
• In the dashboard you’ll see the build running; after ~1-2 minutes the component state will flip to Healthy.

──────────────────────────────────────── Verify ────────────────────────────────────────
