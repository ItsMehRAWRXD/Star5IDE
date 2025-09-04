import { execSync, exec } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { promisify } from "util";

const execAsync = promisify(exec);

export type CarmillaMeta = {
  method: "openssl";
  chain?: string[];
  passphrase_hint?: string;
  timestamp: string;
  fake_calls?: number;
  [key: string]: any;
};

export type CarmillaPackage = {
  meta: CarmillaMeta;
  data: string; // base64 ciphertext
};

function tmpFile(prefix: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "carmilla-"));
  return path.join(dir, prefix + "-" + Date.now() + "-" + Math.random().toString(36).slice(2));
}

function readFileBase64(filePath: string): string {
  const buf = fs.readFileSync(filePath);
  return buf.toString("base64");
}

function writeText(filePath: string, data: string) {
  fs.writeFileSync(filePath, data, { encoding: "utf8" });
}

function safeUnlink(filePath?: string) {
  if (!filePath) return;
  try { fs.unlinkSync(filePath); } catch {}
  try { fs.rmdirSync(path.dirname(filePath)); } catch {}
}

function runFakeCalls(times: number) {
  // Decoy operations to hinder reverse engineering; no effect on outputs
  for (let i = 0; i < times; i++) {
    try {
      // Execute a harmless OpenSSL command that does not touch inputs
      execSync("openssl version", { stdio: "ignore" });
    } catch {}
  }
}

// Encrypt plaintext string; returns base64 ciphertext
export function encrypt(plainText: string, passphrase: string, opts?: { fakeCalls?: number }): string {
  const inputFile = tmpFile("in");
  const outFile = tmpFile("out");
  try {
    writeText(inputFile, plainText);
    if (opts?.fakeCalls) runFakeCalls(opts.fakeCalls);
    // AES-256-CBC with PBKDF, salt, base64 output
    execSync(
      `openssl enc -aes-256-cbc -salt -pbkdf2 -pass pass:${shellEscape(passphrase)} -in ${shellEscape(inputFile)} -out ${shellEscape(outFile)}`
    );
    return readFileBase64(outFile);
  } finally {
    safeUnlink(inputFile);
    safeUnlink(outFile);
  }
}

export async function encryptAsync(plainText: string, passphrase: string, opts?: { fakeCalls?: number }): Promise<string> {
  const inputFile = tmpFile("in");
  const outFile = tmpFile("out");
  try {
    await fs.promises.writeFile(inputFile, plainText, { encoding: "utf8" });
    if (opts?.fakeCalls) runFakeCalls(opts.fakeCalls);
    await execAsync(`openssl enc -aes-256-cbc -salt -pbkdf2 -pass pass:${shellEscape(passphrase)} -in ${shellEscape(inputFile)} -out ${shellEscape(outFile)}`);
    const b64 = (await fs.promises.readFile(outFile)).toString("base64");
    return b64;
  } finally {
    safeUnlink(inputFile);
    safeUnlink(outFile);
  }
}

// Decrypt base64 ciphertext; returns plaintext string
export function decrypt(encryptedBase64: string, passphrase: string, opts?: { fakeCalls?: number }): string {
  const inFile = tmpFile("enc");
  const outFile = tmpFile("dec");
  try {
    fs.writeFileSync(inFile, Buffer.from(encryptedBase64, "base64"));
    if (opts?.fakeCalls) runFakeCalls(opts.fakeCalls);
    execSync(
      `openssl enc -d -aes-256-cbc -pbkdf2 -pass pass:${shellEscape(passphrase)} -in ${shellEscape(inFile)} -out ${shellEscape(outFile)}`
    );
    return fs.readFileSync(outFile, "utf8");
  } finally {
    safeUnlink(inFile);
    safeUnlink(outFile);
  }
}

export async function decryptAsync(encryptedBase64: string, passphrase: string, opts?: { fakeCalls?: number }): Promise<string> {
  const inFile = tmpFile("enc");
  const outFile = tmpFile("dec");
  try {
    await fs.promises.writeFile(inFile, Buffer.from(encryptedBase64, "base64"));
    if (opts?.fakeCalls) runFakeCalls(opts.fakeCalls);
    await execAsync(`openssl enc -d -aes-256-cbc -pbkdf2 -pass pass:${shellEscape(passphrase)} -in ${shellEscape(inFile)} -out ${shellEscape(outFile)}`);
    return await fs.promises.readFile(outFile, "utf8");
  } finally {
    safeUnlink(inFile);
    safeUnlink(outFile);
  }
}

export function repack(encryptedBase64: string, metaExtras: Record<string, any> = {}, opts?: { fakeCalls?: number }): string {
  if (opts?.fakeCalls) runFakeCalls(opts.fakeCalls);
  const meta: CarmillaMeta = {
    method: "openssl",
    chain: ["openssl"],
    timestamp: new Date().toISOString(),
    fake_calls: opts?.fakeCalls ?? 0,
    ...metaExtras,
  };
  const pack: CarmillaPackage = { meta, data: encryptedBase64 };
  return Buffer.from(JSON.stringify(pack)).toString("base64");
}

export function unpack(packagedBase64: string): CarmillaPackage {
  const json = Buffer.from(packagedBase64, "base64").toString("utf8");
  const pack = JSON.parse(json);
  return pack as CarmillaPackage;
}

// Minimal shell escaping for simple passphrase and file paths
function shellEscape(str: string): string {
  // Wrap in single quotes and escape existing single quotes
  return `'` + str.replace(/'/g, `'\''`) + `'`;
}

// Helper: selective processing report structure
export type AreaTarget =
  | { type: "file"; path: string; intent: "encrypt" | "decrypt" | "skip"; data?: string }
  | { type: "obj"; key: string; intent: "encrypt" | "decrypt" | "skip"; data?: string };

export type AreaResult = {
  type: string;
  path?: string;
  key?: string;
  intent: string;
  status: "encrypted" | "decrypted" | "skipped" | "encryption failed" | "decryption failed";
  packaged?: string;
  plaintext?: string;
  error?: string;
  meta?: Record<string, any>;
};

export async function processAreas(
  targets: AreaTarget[],
  passphrase: string,
  options?: { meta?: Record<string, any>; fakeCalls?: number }
): Promise<AreaResult[]> {
  const results: AreaResult[] = [];
  for (const t of targets) {
    const baseMeta = { ...(options?.meta ?? {}), timestamp: new Date().toISOString(), area: t.type === "file" ? t.path : t.key };
    if (t.intent === "skip") {
      results.push({ ...t, status: "skipped", meta: baseMeta });
      continue;
    }
    try {
      if (t.intent === "encrypt") {
        const src = t.data ?? (t.type === "file" ? await fs.promises.readFile(t.path!, "utf8") : (t.data ?? ""));
        const enc = await encryptAsync(src, passphrase, { fakeCalls: options?.fakeCalls });
        const packaged = repack(enc, baseMeta, { fakeCalls: options?.fakeCalls });
        results.push({ ...t, status: "encrypted", packaged, meta: baseMeta });
      } else if (t.intent === "decrypt") {
        const packaged = t.data ?? (t.type === "file" ? await fs.promises.readFile(t.path!, "utf8") : (t.data ?? ""));
        let plaintext: string;
        try {
          // Try direct decrypt if provided is raw ciphertext b64
          plaintext = await decryptAsync(packaged, passphrase, { fakeCalls: options?.fakeCalls });
        } catch {
          // If not raw, treat as package
          const pack = unpack(packaged);
          plaintext = await decryptAsync(pack.data, passphrase, { fakeCalls: options?.fakeCalls });
        }
        results.push({ ...t, status: "decrypted", plaintext, meta: baseMeta });
      }
    } catch (e: any) {
      const failure = t.intent === "encrypt" ? "encryption failed" : "decryption failed";
      results.push({ ...t, status: failure, error: e?.message ?? String(e), meta: baseMeta });
    }
  }
  return results;
}

