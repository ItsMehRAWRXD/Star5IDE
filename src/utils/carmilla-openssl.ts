// Carmilla (native OpenSSL) encryptor — plug-and-play, no npm deps, no auto-run
// Sync and async APIs, repack/unpack, optional fake calls, per-run metadata.

// Avoid relying on @types/node: use require with loose typing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const require: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Buffer: any;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cp: any = require('child_process');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs: any = require('fs');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const os: any = require('os');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path: any = require('path');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const util: any = require('util');

const execAsync = util.promisify(cp.exec);

export type CarmillaMeta = {
  method: 'openssl';
  chain?: string[];
  passphrase_hint?: string;
  timestamp: string;
  fake_calls?: number;
  [key: string]: any;
};

export type CarmillaPackage = {
  meta: CarmillaMeta;
  data: string; // base64 encrypted payload
};

function makeTempDir(prefix = 'carmilla-'): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function safeUnlink(filePath?: string): void {
  if (!filePath) return;
  try { fs.unlinkSync(filePath); } catch { /* ignore */ }
}

function safeRmdir(dirPath?: string): void {
  if (!dirPath) return;
  try { fs.rmdirSync(dirPath); } catch { /* ignore */ }
}

function runFakeCallsSync(times: number): void {
  for (let i = 0; i < times; i += 1) {
    try {
      // Cheap decoy: generate random data or run a no-op enc that discards output
      cp.execSync('openssl rand -base64 32', { stdio: 'ignore' });
    } catch {
      // ignore any failures; these are decoys
    }
  }
}

async function runFakeCallsAsync(times: number): Promise<void> {
  for (let i = 0; i < times; i += 1) {
    try {
      await execAsync('openssl rand -base64 32');
    } catch {
      // ignore
    }
  }
}

// Core OpenSSL helpers (stdin/stdout, base64)
function opensslEncryptBase64Sync(plainText: string, passphrase: string): string {
  const cmd = 'openssl enc -aes-256-cbc -pbkdf2 -salt -base64 -pass pass:"' + passphrase.replace(/"/g, '\\"') + '"';
  const out = cp.execSync(cmd, { input: Buffer.from(plainText, 'utf-8') });
  return out.toString('utf-8').trim();
}

function opensslDecryptBase64Sync(encryptedBase64: string, passphrase: string): string {
  const cmd = 'openssl enc -aes-256-cbc -pbkdf2 -d -base64 -pass pass:"' + passphrase.replace(/"/g, '\\"') + '"';
  const out = cp.execSync(cmd, { input: Buffer.from(encryptedBase64, 'utf-8') });
  return out.toString('utf-8');
}

async function opensslEncryptBase64Async(plainText: string, passphrase: string): Promise<string> {
  const cmd = 'openssl enc -aes-256-cbc -pbkdf2 -salt -base64 -pass pass:"' + passphrase.replace(/"/g, '\\"') + '"';
  const { stdout } = await execAsync(cmd, { input: Buffer.from(plainText, 'utf-8') });
  return stdout.toString('utf-8').trim();
}

async function opensslDecryptBase64Async(encryptedBase64: string, passphrase: string): Promise<string> {
  const cmd = 'openssl enc -aes-256-cbc -pbkdf2 -d -base64 -pass pass:"' + passphrase.replace(/"/g, '\\"') + '"';
  const { stdout } = await execAsync(cmd, { input: Buffer.from(encryptedBase64, 'utf-8') });
  return stdout.toString('utf-8');
}

// Public API — Sync
export function encrypt(plainText: string, passphrase: string, options?: { decoyCalls?: number; meta?: Record<string, any> }): string {
  const decoys = options?.decoyCalls ?? 0;
  if (decoys > 0) runFakeCallsSync(decoys);
  return opensslEncryptBase64Sync(plainText, passphrase);
}

export function decrypt(encryptedBase64: string, passphrase: string, options?: { decoyCalls?: number }): string {
  const decoys = options?.decoyCalls ?? 0;
  if (decoys > 0) runFakeCallsSync(decoys);
  return opensslDecryptBase64Sync(encryptedBase64, passphrase);
}

export function repack(encryptedBase64: string, meta: Record<string, any> = {}): string {
  const packageMeta: CarmillaMeta = {
    method: 'openssl',
    chain: Array.isArray(meta.chain) ? meta.chain : ['openssl'],
    passphrase_hint: typeof meta.passphrase_hint === 'string' ? meta.passphrase_hint : undefined,
    timestamp: new Date().toISOString(),
    fake_calls: typeof meta.fake_calls === 'number' ? meta.fake_calls : undefined,
    ...meta,
  };
  const pkg: CarmillaPackage = { meta: packageMeta, data: encryptedBase64 };
  return Buffer.from(JSON.stringify(pkg), 'utf-8').toString('base64');
}

export function unpack(packagedBase64: string): CarmillaPackage {
  const json = Buffer.from(packagedBase64, 'base64').toString('utf-8');
  const obj = JSON.parse(json);
  return obj as CarmillaPackage;
}

// Public API — Async (non-blocking)
export async function encryptAsync(plainText: string, passphrase: string, options?: { decoyCalls?: number; meta?: Record<string, any> }): Promise<string> {
  const decoys = options?.decoyCalls ?? 0;
  if (decoys > 0) await runFakeCallsAsync(decoys);
  return opensslEncryptBase64Async(plainText, passphrase);
}

export async function decryptAsync(encryptedBase64: string, passphrase: string, options?: { decoyCalls?: number }): Promise<string> {
  const decoys = options?.decoyCalls ?? 0;
  if (decoys > 0) await runFakeCallsAsync(decoys);
  return opensslDecryptBase64Async(encryptedBase64, passphrase);
}

// Utilities for files (optional, still explicit)
export function encryptFileToPackageSync(filePath: string, passphrase: string, meta: Record<string, any> = {}): string {
  const plain = fs.readFileSync(filePath, 'utf-8');
  const enc = encrypt(plain, passphrase);
  return repack(enc, { ...meta, sourcePath: filePath });
}

export async function encryptFileToPackageAsync(filePath: string, passphrase: string, meta: Record<string, any> = {}): Promise<string> {
  const plain = await fs.promises.readFile(filePath, 'utf-8');
  const enc = await encryptAsync(plain, passphrase);
  return repack(enc, { ...meta, sourcePath: filePath });
}

export function decryptPackageToStringSync(packagedBase64: string, passphrase: string): string {
  const { data } = unpack(packagedBase64);
  return decrypt(data, passphrase);
}

export async function decryptPackageToStringAsync(packagedBase64: string, passphrase: string): Promise<string> {
  const { data } = unpack(packagedBase64);
  return decryptAsync(data, passphrase);
}

