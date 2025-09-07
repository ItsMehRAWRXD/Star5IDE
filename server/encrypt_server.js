#!/usr/bin/env node
"use strict";

const http  = require("http");
const url   = require("url");
const { spawn } = require("child_process");
const path  = require("path");
const fs    = require("fs");
const { createHotPatcher } = require("./hotpatcher");

const DEFAULT_CORS_ORIGIN = "*";
const ALLOWED_ORIGINS =
  (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

const PORT = process.env.PORT ? Number(process.env.PORT) : 8088;
const CLI  = path.join(__dirname, "..", "tools", "camellia-cli.js");

/* ───────────────────────── helpers ───────────────────────── */

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

/* ────────────────── hot-patch targets (originals) ────────────────── */

const HP = createHotPatcher();

/* encrypt target (unchanged) */
HP.registerTarget("encrypt", async function encryptHandler(body, query) {
  const pass  = query.pass;
  const mode  = (query.mode || "password").toString();
  if (mode === "password" && !pass) throw new Error("pass required as ?pass=");
  const cipher  = query.cipher || "camellia-256-cbc";
  let   cliPass = pass;

  if (mode === "autokey") {
    const keyBytes = globalThis.crypto?.getRandomValues
      ? globalThis.crypto.getRandomValues(new Uint8Array(32))
      : require("crypto").randomBytes(32);
    const keyB64  = Buffer.from(keyBytes).toString("base64");
    cliPass       = keyB64;

    const out = await runCli(
      ["encrypt", "--pass", cliPass, "--cipher", cipher],
      body
    );

    try {
      const pkg = JSON.parse(Buffer.from(out.toString(), "base64").toString());
      pkg.meta  = { ...(pkg.meta || {}), autokey: true, key_b64: keyB64 };
      return Buffer.from(
        Buffer.from(JSON.stringify(pkg)).toString("base64"),
        "utf8"
      );
    } catch {
      return out;
    }
  }

  return runCli(["encrypt", "--pass", cliPass, "--cipher", cipher], body);
});

/* decrypt target (unchanged) */
HP.registerTarget("decrypt", async function decryptHandler(body, query) {
  const cipher = query.cipher;
  let   cliPass = query.pass;

  if (!cliPass) {
    try {
      const pkg = JSON.parse(
        Buffer.from(body.toString("utf8").trim(), "base64").toString("utf8")
      );
      cliPass = pkg?.meta?.key_b64;
    } catch {}
  }
  if (!cliPass) throw new Error("pass required or package must contain autokey");

  const cliArgs = ["decrypt", "--pass", cliPass];
  if (cipher) cliArgs.push("--cipher", cipher);
  return runCli(cliArgs, body);
});

/* ─────────────────────── HTTP server ─────────────────────── */

const server = http.createServer(async (req, res) => {
  const { method } = req;
  const parsed     = url.parse(req.url, true);
  const pathname   = parsed.pathname || "/";
  const origin     = req.headers.origin || DEFAULT_CORS_ORIGIN;

  /* CORS pre-flight */
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

  /* panel — now served from static file */
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

  /* fallback index (optional) */
  if (method === "GET" && (pathname === "/" || pathname === "/index.html")) {
    const file = path.join(__dirname, "public", "index.html");
    try {
      const html = fs.readFileSync(file);
      setCors(res, origin);
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      return res.end(html);
    } catch {
      setCors(res, origin);
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
      return res.end("Camellia Encrypt Server\n");
    }
  }

  /* ---- remaining routes (encrypt / decrypt / stubs / hot-patch) ----
     ALL ORIGINAL LOGIC BELOW IS UNCHANGED. If you trimmed it earlier,
     just leave it as-is; nothing about those handlers needs to change. */
  // ... existing code ...
});

/* start */
server.listen(PORT, () =>
  console.log(`Encrypt server listening on port ${PORT}`)
);

/* ───────────────────── capability helpers (unchanged) ───────────────────── */
// getStaticCapabilities, getDynamicCapabilitiesSafe, stub generators …
