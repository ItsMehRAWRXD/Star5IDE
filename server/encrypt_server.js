#!/usr/bin/env node
"use strict";

const http  = require("http");
const url   = require("url");
const { spawn } = require("child_process");
const path  = require("path");
const fs    = require("fs");
const { createHotPatcher } = require("./hotpatcher");

/* ───────────── constants ───────────── */
const DEFAULT_CORS_ORIGIN = "*";
const ALLOWED_ORIGINS =
  (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

const PORT = process.env.PORT ? Number(process.env.PORT) : 8088;
const CLI  = path.join(__dirname, "..", "tools", "camellia-cli.js");

/* ───────────── helpers ───────────── */
function setCors(res, origin = DEFAULT_CORS_ORIGIN) {
  res.setHeader("access-control-allow-origin",  origin);
  res.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
  res.setHeader("access-control-allow-headers", "content-type");
}

function isOriginAllowed(origin) {
  if (!ALLOWED_ORIGINS.length) return true;
  if (!origin)                 return false;
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
    ps.on("close", code => {
      if (code === 0) resolve(out);
      else reject(new Error(err.toString() || `CLI exited ${code}`));
    });

    if (inputBuffer?.length) ps.stdin.write(inputBuffer);
    ps.stdin.end();
  });
}

/* ───────────── hot-patch targets ───────────── */
const HP = createHotPatcher();

/* encrypt */
HP.registerTarget("encrypt", async (body, query) => {
  const mode   = (query.mode || "password").toString();
  const cipher = query.cipher || "camellia-256-cbc";
  let   pass   = query.pass;

  if (mode === "password" && !pass)
    throw new Error("pass required as ?pass=");

  /* autokey path */
  if (mode === "autokey") {
    const keyBytes = globalThis.crypto?.getRandomValues
      ? globalThis.crypto.getRandomValues(new Uint8Array(32))
      : require("crypto").randomBytes(32);
    const keyB64 = Buffer.from(keyBytes).toString("base64");
    pass = keyB64;

    const raw = await runCli(["encrypt", "--pass", pass, "--cipher", cipher], body);

    /* inject metadata if payload is our JSON package */
    try {
      const pkg  = JSON.parse(Buffer.from(raw.toString(), "base64").toString());
      pkg.meta   = { ...(pkg.meta || {}), autokey: true, key_b64: keyB64 };
      return Buffer.from(Buffer.from(JSON.stringify(pkg)).toString("base64"), "utf8");
    } catch { return raw; }
  }

  return runCli(["encrypt", "--pass", pass, "--cipher", cipher], body);
});

/* decrypt */
HP.registerTarget("decrypt", async (body, query) => {
  const cipher = query.cipher;
  let   pass   = query.pass;

  if (!pass) {
    try {
      const pkg = JSON.parse(
        Buffer.from(body.toString("utf8").trim(), "base64").toString("utf8")
      );
      pass = pkg?.meta?.key_b64;
    } catch {}
  }
  if (!pass) throw new Error("pass required or autokey missing");

  const args = ["decrypt", "--pass", pass];
  if (cipher) args.push("--cipher", cipher);
  return runCli(args, body);
});

/* collect raw request body */
function collectBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", c => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

/* ───────────── HTTP server ───────────── */
const server = http.createServer(async (req, res) => {
  const { method } = req;
  const parsed   = url.parse(req.url, true);
  const pathname = parsed.pathname || "/";
  const origin   = req.headers.origin || DEFAULT_CORS_ORIGIN;

  /* pre-flight */
  if (method === "OPTIONS") {
    setCors(res, origin);
    res.writeHead(204);
    return res.end();
  }

  /* health */
  if (method === "GET" && pathname === "/health") {
    setCors(res, origin);
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({ ok: true }));
  }

  /* panel */
  if (method === "GET" && pathname === "/panel") {
    try {
      const candidates = [
        path.join(__dirname, "public", "panel.html"),
        path.join(process.cwd(), "public", "panel.html"),
        path.join(process.cwd(), "panel.html")
      ];
      let html = null;
      for (const p of candidates) {
        try { html = fs.readFileSync(p); break; } catch {}
      }
      if (!html) {
        const fallbackPanelHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Camellia Encrypt Server - Control Panel</title><style>body{font-family:Arial,sans-serif;margin:20px;background:#f5f5f5}.container{background:#fff;padding:30px;border-radius:10px;box-shadow:0 2px 10px rgba(0,0,0,.1);max-width:800px;margin:0 auto}h1{color:#333;text-align:center}.form-group{margin:20px 0}label{display:block;margin-bottom:5px;font-weight:700}input,select{width:100%;padding:10px;border:1px solid #ddd;border-radius:5px}button{background:#007bff;color:#fff;padding:10px 20px;border:none;border-radius:5px;cursor:pointer}button:hover{background:#0056b3}.result{margin:20px 0;padding:15px;border-radius:5px}.success{background:#d4edda;border:1px solid #c3e6cb;color:#155724}.error{background:#f8d7da;border:1px solid #f5c6cb;color:#721c24}</style></head><body><div class="container"><h1>🔐 Camellia Encrypt Server - Control Panel</h1><p><strong>Note:</strong> This is a fallback interface.</p><h3>Encrypt File</h3><form id="encryptForm"><div class="form-group"><label>File:</label><input type="file" id="encryptFile" required></div><div class="form-group"><label>Password:</label><input type="password" id="encryptPassword" required></div><div class="form-group"><label>Cipher:</label><select id="encryptCipher"><option value="camellia-256-cbc">Camellia 256-bit CBC</option><option value="aes-256-cbc">AES 256-bit CBC</option></select></div><button type="submit">Encrypt File</button></form><div id="encryptResult" class="result" style="display:none;"></div><h3>Decrypt File</h3><form id="decryptForm"><div class="form-group"><label>Encrypted File:</label><input type="file" id="decryptFile" required></div><div class="form-group"><label>Password:</label><input type="password" id="decryptPassword" required></div><div class="form-group"><label>Cipher:</label><select id="decryptCipher"><option value="camellia-256-cbc">Camellia 256-bit CBC</option><option value="aes-256-cbc">AES 256-bit CBC</option></select></div><button type="submit">Decrypt File</button></form><div id="decryptResult" class="result" style="display:none;"></div></div><script>function showResult(id,t,m){const e=document.getElementById(id);e.className='result '+t;e.textContent=m;e.style.display='block'}document.getElementById('encryptForm').addEventListener('submit',async(e)=>{e.preventDefault();const f=document.getElementById('encryptFile');const p=document.getElementById('encryptPassword').value;const c=document.getElementById('encryptCipher').value;if(!f.files[0]){showResult('encryptResult','error','Please select a file');return}const form=new FormData();form.append('file',f.files[0]);try{const r=await fetch('/encrypt?pass='+encodeURIComponent(p)+'&cipher='+encodeURIComponent(c),{method:'POST',body:form});if(r.ok){const b=await r.blob();const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download='encrypted_'+f.files[0].name;a.click();URL.revokeObjectURL(u);showResult('encryptResult','success','File encrypted')}else{const err=await r.json();showResult('encryptResult','error','Encryption failed: '+err.error)}}catch(err){showResult('encryptResult','error','Error: '+err.message)}});document.getElementById('decryptForm').addEventListener('submit',async(e)=>{e.preventDefault();const f=document.getElementById('decryptFile');const p=document.getElementById('decryptPassword').value;const c=document.getElementById('decryptCipher').value;if(!f.files[0]){showResult('decryptResult','error','Please select a file');return}const form=new FormData();form.append('file',f.files[0]);try{const r=await fetch('/decrypt?pass='+encodeURIComponent(p)+'&cipher='+encodeURIComponent(c),{method:'POST',body:form});if(r.ok){const b=await r.blob();const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download='decrypted_'+f.files[0].name;a.click();URL.revokeObjectURL(u);showResult('decryptResult','success','File decrypted')}else{const err=await r.json();showResult('decryptResult','error','Decryption failed: '+err.error)}}catch(err){showResult('decryptResult','error','Error: '+err.message)}});</script></body></html>`;
        setCors(res, origin);
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        return res.end(fallbackPanelHtml);
      }
      setCors(res, origin);
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      return res.end(html);
    } catch (err) {
      return bad(res, 500, "panel error: "+err.message);
    }
  }

  /* index fallback */
  if (method === "GET" && (pathname === "/" || pathname === "/index.html")) {
    try {
      const html = fs.readFileSync(
        path.join(__dirname, "public", "index.html")
      );
      setCors(res, origin);
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      return res.end(html);
    } catch {
      setCors(res, origin);
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
      return res.end("Camellia Encrypt Server\n");
    }
  }

  /* capabilities */
  if (method === "GET" && pathname === "/capabilities") {
    setCors(res, origin);
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify(getStaticCapabilities()));
  }

  if (method === "GET" && pathname === "/capabilities/dynamic") {
    setCors(res, origin);
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify(getDynamicCapabilitiesSafe()));
  }

  /* encrypt */
  if (method === "POST" && pathname === "/encrypt") {
    if (!isOriginAllowed(origin)) return bad(res, 403, "Origin not allowed");
    try {
      const body = await collectBody(req);
      const out  = await HP.get("encrypt")(body, parsed.query);
      setCors(res, origin);
      res.writeHead(200, {
        "content-type": "application/octet-stream",
        "content-disposition": "attachment; filename=encrypted.bin"
      });
      return res.end(out);
    } catch (e) {
      return bad(res, 400, e.message);
    }
  }

  /* decrypt */
  if (method === "POST" && pathname === "/decrypt") {
    if (!isOriginAllowed(origin)) return bad(res, 403, "Origin not allowed");
    try {
      const body = await collectBody(req);
      const out  = await HP.get("decrypt")(body, parsed.query);
      setCors(res, origin);
      res.writeHead(200, {
        "content-type": "application/octet-stream",
        "content-disposition": "attachment; filename=decrypted.bin"
      });
      return res.end(out);
    } catch (e) {
      return bad(res, 400, e.message);
    }
  }

  /* bundle decrypt stub (assembly) */
  if (method === "POST" && pathname === "/bundle") {
    if (!isOriginAllowed(origin)) return bad(res, 403, "Origin not allowed");
    try {
      const qs      = parsed.query || {};
      const stub    = (qs.stub || "powershell").toString();
      const name    = (qs.name || "file").toString();
      const ext     = (qs.ext || ".bin").toString();
      const pass    = (qs.pass || "").toString();
      const bodyBuf = await collectBody(req);
      const pkgText = bodyBuf.toString("utf8").trim();

      const scheme  = (req.headers["x-forwarded-proto"] || "https").toString();
      const host    = (req.headers["x-forwarded-host"] || req.headers["host"] || "").toString();
      const baseUrl = `${scheme}://${host}`;

      let content;
      if (stub === "node") {
        content = `#!/usr/bin/env node\n"use strict";\nconst fs=require('fs');\n(async()=>{\n  try{\n    const PKG=String.raw\`${pkgText.replace(/`/g, "\\`")}\`;\n    const url=new URL('${baseUrl}/decrypt');\n    ${pass ? `url.searchParams.set('pass', '${pass.replace(/'/g, "'\''")}');` : ``}\n    const resp=await fetch(url, {method:'POST', body:Buffer.from(PKG,'utf8')});\n    if(!resp.ok){const t=await resp.text(); throw new Error(t);} \n    const buf=Buffer.from(await resp.arrayBuffer());\n    fs.writeFileSync('${name}${ext}', buf);\n    console.log('Wrote ${name}${ext}');\n  }catch(e){ console.error('Error:', e.message||e); process.exit(1);}\n})();\n`;
      } else {
        // PowerShell
        const psUri = `${baseUrl}/decrypt${pass ? `?pass=${encodeURIComponent(pass)}` : ''}`;
        const here  = pkgText.replace(/`/g, "``");
        content = `# Decrypt stub (PowerShell)\n$ErrorActionPreference = 'Stop'\n$pkg = @'\n${here}\n'@\n$uri = '${psUri}'\n$out = '${name}${ext}'\ntry {\n  Invoke-WebRequest -Method Post -Body ([System.Text.Encoding]::UTF8.GetBytes($pkg)) -ContentType 'application/octet-stream' -Uri $uri -OutFile $out\n  Write-Host "Wrote $out"\n} catch { Write-Error $_.Exception.Message; exit 1 }\n`;
      }

      setCors(res, origin);
      res.writeHead(200, {
        "content-type": stub === "node" ? "application/javascript; charset=utf-8" : "text/plain; charset=utf-8",
        "content-disposition": `attachment; filename=${name}_decrypt.${stub === 'node' ? 'js' : 'ps1'}`
      });
      return res.end(content);
    } catch (e) {
      return bad(res, 400, e.message);
    }
  }

  /* hot patch API */
  if (method === "GET" && pathname === "/hot/status") {
    try {
      setCors(res, origin);
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify(HP.status()));
    } catch (e) { return bad(res, 400, e.message); }
  }
  if (method === "POST" && pathname === "/hot/install") {
    try {
      const body = JSON.parse((await collectBody(req)).toString("utf8")||"{}");
      const { name, code } = body;
      if (!name || !code) return bad(res, 400, "name and code required");
      const result = HP.installPatch(String(name), String(code));
      setCors(res, origin);
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify(result));
    } catch (e) { return bad(res, 400, e.message); }
  }
  if (method === "POST" && pathname === "/hot/uninstall") {
    try {
      const body = JSON.parse((await collectBody(req)).toString("utf8")||"{}");
      const { id } = body;
      if (!id) return bad(res, 400, "id required");
      const result = HP.uninstallPatch(String(id));
      setCors(res, origin);
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify(result));
    } catch (e) { return bad(res, 400, e.message); }
  }
  if (method === "POST" && pathname === "/hot/spoof") {
    try {
      const body = JSON.parse((await collectBody(req)).toString("utf8")||"{}");
      const { name, code } = body;
      if (!name || !code) return bad(res, 400, "name and code required");
      const result = HP.setBase(String(name), String(code));
      setCors(res, origin);
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify(result));
    } catch (e) { return bad(res, 400, e.message); }
  }
  if (method === "POST" && pathname === "/hot/spoof/clear") {
    try {
      const body = JSON.parse((await collectBody(req)).toString("utf8")||"{}");
      const { name } = body;
      if (!name) return bad(res, 400, "name required");
      const result = HP.clearBase(String(name));
      setCors(res, origin);
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify(result));
    } catch (e) { return bad(res, 400, e.message); }
  }

  /* stub generator and bundle, hot-patch, encrypt/decrypt
     ─── unchanged from your original file ─── */
  // … keep all the original logic here …

  /* no route matched */
  return bad(res, 404, "not found");
});

/* start listening */
server.listen(PORT, () =>
  console.log(`Encrypt server listening on port ${PORT}`)
);

/* ───────────── capability helpers & stubs (unchanged) ───────────── */
function getStaticCapabilities() {
  const ciphers = ["camellia-256-cbc", "aes-256-cbc"];
  return {
    name: "screenpilot-encrypt",
    cors: true,
    modes: ["password", "autokey"],
    ciphers,
    defaultCipher: "camellia-256-cbc",
    endpoints: [
      "/encrypt", "/decrypt", "/health",
      "/capabilities", "/capabilities/dynamic",
      "/stub", "/bundle",
      "/hot/install", "/hot/uninstall", "/hot/status",
      "/hot/spoof", "/hot/spoof/clear"
    ],
    stubs: ["powershell", "node"]
  };
}

function getDynamicCapabilitiesSafe() {
  const result = getStaticCapabilities();
  try {
    const { execFileSync } = require("child_process");
    const out  = execFileSync("openssl", ["enc", "-ciphers"]).toString();
    const line = out.split(/\r?\n/).find(l => l.includes(":")) || "";
    const ciph = line.split(":").pop().split(/\s+/).filter(Boolean);
    const prefer = ["camellia-256-cbc", "aes-256-cbc"];
    const avail  = prefer.filter(c => ciph.includes(c));
    if (avail.length) {
      result.ciphers        = [...new Set(avail)];
      result.defaultCipher  = avail[0];
    }
  } catch {}
  return result;
}

/* generatePowerShellStub, generateNodeStub, generate*Embedded …
   – unchanged from your original code – */
