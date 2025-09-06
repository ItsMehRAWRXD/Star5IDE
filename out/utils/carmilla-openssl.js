"use strict";
// Carmilla (native OpenSSL) encryptor — plug-and-play, no npm deps, no auto-run
// Sync and async APIs, repack/unpack, optional fake calls, per-run metadata.
Object.defineProperty(exports, "__esModule", { value: true });
exports.encrypt = encrypt;
exports.decrypt = decrypt;
exports.repack = repack;
exports.unpack = unpack;
exports.encryptAsync = encryptAsync;
exports.decryptAsync = decryptAsync;
exports.writeEncryptedToFile = writeEncryptedToFile;
exports.encryptFileToPackageSync = encryptFileToPackageSync;
exports.encryptFileToPackageAsync = encryptFileToPackageAsync;
exports.decryptPackageToStringSync = decryptPackageToStringSync;
exports.decryptPackageToStringAsync = decryptPackageToStringAsync;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cp = require('child_process');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const os = require('os');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const util = require('util');
const execAsync = util.promisify(cp.exec);
function makeTempDir(prefix = 'carmilla-') {
    return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}
function safeUnlink(filePath) {
    if (!filePath)
        return;
    try {
        fs.unlinkSync(filePath);
    }
    catch { /* ignore */ }
}
function safeRmdir(dirPath) {
    if (!dirPath)
        return;
    try {
        fs.rmdirSync(dirPath);
    }
    catch { /* ignore */ }
}
function runFakeCallsSync(times) {
    for (let i = 0; i < times; i += 1) {
        try {
            // Cheap decoy: generate random data or run a no-op enc that discards output
            cp.execSync('openssl rand -base64 32', { stdio: 'ignore' });
        }
        catch {
            // ignore any failures; these are decoys
        }
    }
}
async function runFakeCallsAsync(times) {
    for (let i = 0; i < times; i += 1) {
        try {
            await execAsync('openssl rand -base64 32');
        }
        catch {
            // ignore
        }
    }
}
// Core OpenSSL helpers (stdin/stdout, base64)
function opensslEncryptBase64Sync(plainText, passphrase) {
    const cmd = 'openssl enc -aes-256-cbc -pbkdf2 -salt -base64 -pass pass:"' + passphrase.replace(/"/g, '\\"') + '"';
    const out = cp.execSync(cmd, { input: Buffer.from(plainText, 'utf-8') });
    return out.toString('utf-8').trim();
}
function opensslDecryptBase64Sync(encryptedBase64, passphrase) {
    const cmd = 'openssl enc -aes-256-cbc -pbkdf2 -d -base64 -pass pass:"' + passphrase.replace(/"/g, '\\"') + '"';
    const out = cp.execSync(cmd, { input: Buffer.from(encryptedBase64, 'utf-8') });
    return out.toString('utf-8');
}
async function opensslEncryptBase64Async(plainText, passphrase) {
    const cmd = 'openssl enc -aes-256-cbc -pbkdf2 -salt -base64 -pass pass:"' + passphrase.replace(/"/g, '\\"') + '"';
    const { stdout } = await execAsync(cmd, { input: Buffer.from(plainText, 'utf-8') });
    return stdout.toString('utf-8').trim();
}
async function opensslDecryptBase64Async(encryptedBase64, passphrase) {
    const cmd = 'openssl enc -aes-256-cbc -pbkdf2 -d -base64 -pass pass:"' + passphrase.replace(/"/g, '\\"') + '"';
    const { stdout } = await execAsync(cmd, { input: Buffer.from(encryptedBase64, 'utf-8') });
    return stdout.toString('utf-8');
}
// Raw binary variants (no base64)
function opensslEncryptRawSync(plainText, passphrase) {
    const cmd = 'openssl enc -aes-256-cbc -pbkdf2 -salt -pass pass:"' + passphrase.replace(/"/g, '\\"') + '"';
    // capture binary stdout
    const out = cp.execSync(cmd, { input: Buffer.from(plainText, 'utf-8'), encoding: 'buffer' });
    return out; // Buffer
}
function opensslDecryptRawSync(encryptedBytes, passphrase) {
    const cmd = 'openssl enc -aes-256-cbc -pbkdf2 -d -pass pass:"' + passphrase.replace(/"/g, '\\"') + '"';
    const out = cp.execSync(cmd, { input: encryptedBytes, encoding: 'buffer' });
    return out.toString('utf-8');
}
async function opensslEncryptRawAsync(plainText, passphrase) {
    const cmd = 'openssl enc -aes-256-cbc -pbkdf2 -salt -pass pass:"' + passphrase.replace(/"/g, '\\"') + '"';
    const res = await execAsync(cmd, { input: Buffer.from(plainText, 'utf-8'), encoding: 'buffer' });
    return res.stdout; // Buffer
}
async function opensslDecryptRawAsync(encryptedBytes, passphrase) {
    const cmd = 'openssl enc -aes-256-cbc -pbkdf2 -d -pass pass:"' + passphrase.replace(/"/g, '\\"') + '"';
    const res = await execAsync(cmd, { input: encryptedBytes, encoding: 'buffer' });
    return res.stdout.toString('utf-8');
}
// Public API — Sync
function encrypt(plainText, passphrase, options) {
    const decoys = options?.decoyCalls ?? 0;
    if (decoys > 0)
        runFakeCallsSync(decoys);
    return opensslEncryptBase64Sync(plainText, passphrase);
}
function decrypt(encryptedBase64, passphrase, options) {
    const decoys = options?.decoyCalls ?? 0;
    if (decoys > 0)
        runFakeCallsSync(decoys);
    return opensslDecryptBase64Sync(encryptedBase64, passphrase);
}
function repack(encryptedBase64, meta = {}) {
    const packageMeta = {
        method: 'openssl',
        chain: Array.isArray(meta.chain) ? meta.chain : ['openssl'],
        passphrase_hint: typeof meta.passphrase_hint === 'string' ? meta.passphrase_hint : undefined,
        timestamp: new Date().toISOString(),
        fake_calls: typeof meta.fake_calls === 'number' ? meta.fake_calls : undefined,
        ...meta,
    };
    const pkg = { meta: packageMeta, data: encryptedBase64 };
    return Buffer.from(JSON.stringify(pkg), 'utf-8').toString('base64');
}
function unpack(packagedBase64) {
    const json = Buffer.from(packagedBase64, 'base64').toString('utf-8');
    const obj = JSON.parse(json);
    return obj;
}
// Public API — Async (non-blocking)
async function encryptAsync(plainText, passphrase, options) {
    const decoys = options?.decoyCalls ?? 0;
    if (decoys > 0)
        await runFakeCallsAsync(decoys);
    return opensslEncryptBase64Async(plainText, passphrase);
}
async function decryptAsync(encryptedBase64, passphrase, options) {
    const decoys = options?.decoyCalls ?? 0;
    if (decoys > 0)
        await runFakeCallsAsync(decoys);
    return opensslDecryptBase64Async(encryptedBase64, passphrase);
}
function isBinaryPath(p) {
    const ext = (path.extname(p) || '').toLowerCase();
    return ['.exe', '.dll', '.so', '.bin', '.dat', '.img', '.iso', '.o', '.a'].includes(ext);
}
async function writeEncryptedToFile(targetFilePath, plainText, passphrase, options) {
    const mode = options?.outputMode ?? 'match';
    const effective = mode === 'match' ? (isBinaryPath(targetFilePath) ? 'binary' : 'text') : mode;
    if ((options?.decoyCalls ?? 0) > 0)
        await runFakeCallsAsync(options.decoyCalls);
    if (effective === 'binary') {
        const buf = await opensslEncryptRawAsync(plainText, passphrase);
        await fs.promises.writeFile(targetFilePath, buf);
    }
    else {
        const b64 = await opensslEncryptBase64Async(plainText, passphrase);
        await fs.promises.writeFile(targetFilePath, b64, 'utf-8');
    }
}
// Utilities for files (optional, still explicit)
function encryptFileToPackageSync(filePath, passphrase, meta = {}) {
    const plain = fs.readFileSync(filePath, 'utf-8');
    const enc = encrypt(plain, passphrase);
    return repack(enc, { ...meta, sourcePath: filePath });
}
async function encryptFileToPackageAsync(filePath, passphrase, meta = {}) {
    const plain = await fs.promises.readFile(filePath, 'utf-8');
    const enc = await encryptAsync(plain, passphrase);
    return repack(enc, { ...meta, sourcePath: filePath });
}
function decryptPackageToStringSync(packagedBase64, passphrase) {
    const { data } = unpack(packagedBase64);
    return decrypt(data, passphrase);
}
async function decryptPackageToStringAsync(packagedBase64, passphrase) {
    const { data } = unpack(packagedBase64);
    return decryptAsync(data, passphrase);
}
//# sourceMappingURL=carmilla-openssl.js.map