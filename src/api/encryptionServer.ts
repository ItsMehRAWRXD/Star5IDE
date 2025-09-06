import http from "http";
import { encryptAsync, decryptAsync, repack, unpack, processAreas } from "../../lib";

type Json = Record<string, any>;

function send(res: http.ServerResponse, code: number, obj: Json) {
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(obj));
}

async function readJson(req: http.IncomingMessage): Promise<Json> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(Buffer.from(c)));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      try { resolve(raw ? JSON.parse(raw) : {}); } catch (e) { reject(e); }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method !== "POST") {
      return send(res, 405, { error: "Only POST supported" });
    }
    const url = req.url || "/";
    const body = await readJson(req);

    if (url === "/encrypt") {
      const { data, passphrase, fakeCalls, meta } = body;
      const b64 = await encryptAsync(String(data ?? ""), String(passphrase ?? ""), { fakeCalls });
      const packaged = meta ? repack(b64, meta, { fakeCalls }) : undefined;
      return send(res, 200, { ciphertext: b64, packaged });
    }

    if (url === "/decrypt") {
      const { data, passphrase, fakeCalls } = body;
      let plaintext: string;
      try {
        plaintext = await decryptAsync(String(data ?? ""), String(passphrase ?? ""), { fakeCalls });
      } catch {
        const pack = unpack(String(data ?? ""));
        plaintext = await decryptAsync(pack.data, String(passphrase ?? ""), { fakeCalls });
      }
      return send(res, 200, { plaintext });
    }

    if (url === "/repack") {
      const { ciphertext, meta, fakeCalls } = body;
      const packaged = repack(String(ciphertext ?? ""), meta || {}, { fakeCalls });
      return send(res, 200, { packaged });
    }

    if (url === "/unpack") {
      const { packaged } = body;
      const obj = unpack(String(packaged ?? ""));
      return send(res, 200, obj);
    }

    if (url === "/process-areas") {
      const { targets, passphrase, meta, fakeCalls } = body;
      const results = await processAreas(Array.isArray(targets) ? targets : [], String(passphrase ?? ""), { meta, fakeCalls });
      return send(res, 200, { results });
    }

    return send(res, 404, { error: "Not found" });
  } catch (e: any) {
    return send(res, 400, { error: e?.message ?? String(e) });
  }
});

export function startEncryptionServer(port = Number(process.env.PORT || 8787)) {
  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Carmilla OpenSSL API listening on :${port}`);
  });
  return server;
}

if (require.main === module) {
  startEncryptionServer();
}

