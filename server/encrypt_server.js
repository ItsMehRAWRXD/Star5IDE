#!/usr/bin/env node
"use strict";

const http = require("http");
const url = require("url");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const PORT = process.env.PORT ? Number(process.env.PORT) : 8088;
const CLI = path.join(__dirname, "..", "tools", "carmilla-openssl.js");

function bad(res, code, msg) {
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

  // Health
  if (method === "GET" && pathname === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  // Static index
  if (method === "GET" && (pathname === "/" || pathname === "/index.html")) {
    const file = path.join(__dirname, "public", "index.html");
    try {
      const html = fs.readFileSync(file);
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
        const pass = parsed.query.pass;
        if (!pass) return bad(res, 400, "pass required as ?pass=");
        const cipher = parsed.query.cipher || "camellia-256-cbc";
        const download = parsed.query.download === "1";
        const out = await runCli(["encrypt", "--pass", String(pass), "--cipher", String(cipher)], body);
        res.writeHead(200, {
          "content-type": "application/octet-stream",
          ...(download ? { "content-disposition": "attachment; filename=encrypted.pkg" } : {}),
        });
        res.end(out);
        return;
      }

      if (method === "POST" && pathname === "/decrypt") {
        const pass = parsed.query.pass;
        if (!pass) return bad(res, 400, "pass required as ?pass=");
        const cipher = parsed.query.cipher; // optional override
        const download = parsed.query.download === "1";
        const cliArgs = ["decrypt", "--pass", String(pass)];
        if (cipher) { cliArgs.push("--cipher", String(cipher)); }
        const out = await runCli(cliArgs, body);
        res.writeHead(200, {
          "content-type": "application/octet-stream",
          ...(download ? { "content-disposition": "attachment; filename=decrypted.bin" } : {}),
        });
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
  // eslint-disable-next-line no-console
  console.log(`Encrypt server listening on http://localhost:${PORT}`);
});

