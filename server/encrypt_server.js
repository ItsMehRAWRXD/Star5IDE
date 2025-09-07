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
      const html = fs.readFileSync(
        path.join(__dirname, "public", "panel.html")
      );
      setCors(res, origin);
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      return res.end(html);
    } catch {
      return bad(res, 500, "panel not found");
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
