"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encrypt = encrypt;
exports.encryptAsync = encryptAsync;
exports.decrypt = decrypt;
exports.decryptAsync = decryptAsync;
exports.repack = repack;
exports.unpack = unpack;
exports.processAreas = processAreas;
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
function tmpFile(prefix) {
    const dir = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), "carmilla-"));
    return path_1.default.join(dir, prefix + "-" + Date.now() + "-" + Math.random().toString(36).slice(2));
}
function readFileBase64(filePath) {
    const buf = fs_1.default.readFileSync(filePath);
    return buf.toString("base64");
}
function writeText(filePath, data) {
    fs_1.default.writeFileSync(filePath, data, { encoding: "utf8" });
}
function safeUnlink(filePath) {
    if (!filePath)
        return;
    try {
        fs_1.default.unlinkSync(filePath);
    }
    catch { }
    try {
        fs_1.default.rmdirSync(path_1.default.dirname(filePath));
    }
    catch { }
}
function runFakeCalls(times) {
    // Decoy operations to hinder reverse engineering; no effect on outputs
    for (let i = 0; i < times; i++) {
        try {
            // Execute a harmless OpenSSL command that does not touch inputs
            (0, child_process_1.execSync)("openssl version", { stdio: "ignore" });
        }
        catch { }
    }
}
// Encrypt plaintext string; returns base64 ciphertext
function encrypt(plainText, passphrase, opts) {
    const inputFile = tmpFile("in");
    const outFile = tmpFile("out");
    try {
        writeText(inputFile, plainText);
        if (opts?.fakeCalls)
            runFakeCalls(opts.fakeCalls);
        // AES-256-CBC with PBKDF, salt, base64 output
        (0, child_process_1.execSync)(`openssl enc -aes-256-cbc -salt -pbkdf2 -pass pass:${shellEscape(passphrase)} -in ${shellEscape(inputFile)} -out ${shellEscape(outFile)}`);
        return readFileBase64(outFile);
    }
    finally {
        safeUnlink(inputFile);
        safeUnlink(outFile);
    }
}
async function encryptAsync(plainText, passphrase, opts) {
    const inputFile = tmpFile("in");
    const outFile = tmpFile("out");
    try {
        await fs_1.default.promises.writeFile(inputFile, plainText, { encoding: "utf8" });
        if (opts?.fakeCalls)
            runFakeCalls(opts.fakeCalls);
        await execAsync(`openssl enc -aes-256-cbc -salt -pbkdf2 -pass pass:${shellEscape(passphrase)} -in ${shellEscape(inputFile)} -out ${shellEscape(outFile)}`);
        const b64 = (await fs_1.default.promises.readFile(outFile)).toString("base64");
        return b64;
    }
    finally {
        safeUnlink(inputFile);
        safeUnlink(outFile);
    }
}
// Decrypt base64 ciphertext; returns plaintext string
function decrypt(encryptedBase64, passphrase, opts) {
    const inFile = tmpFile("enc");
    const outFile = tmpFile("dec");
    try {
        fs_1.default.writeFileSync(inFile, Buffer.from(encryptedBase64, "base64"));
        if (opts?.fakeCalls)
            runFakeCalls(opts.fakeCalls);
        (0, child_process_1.execSync)(`openssl enc -d -aes-256-cbc -pbkdf2 -pass pass:${shellEscape(passphrase)} -in ${shellEscape(inFile)} -out ${shellEscape(outFile)}`);
        return fs_1.default.readFileSync(outFile, "utf8");
    }
    finally {
        safeUnlink(inFile);
        safeUnlink(outFile);
    }
}
async function decryptAsync(encryptedBase64, passphrase, opts) {
    const inFile = tmpFile("enc");
    const outFile = tmpFile("dec");
    try {
        await fs_1.default.promises.writeFile(inFile, Buffer.from(encryptedBase64, "base64"));
        if (opts?.fakeCalls)
            runFakeCalls(opts.fakeCalls);
        await execAsync(`openssl enc -d -aes-256-cbc -pbkdf2 -pass pass:${shellEscape(passphrase)} -in ${shellEscape(inFile)} -out ${shellEscape(outFile)}`);
        return await fs_1.default.promises.readFile(outFile, "utf8");
    }
    finally {
        safeUnlink(inFile);
        safeUnlink(outFile);
    }
}
function repack(encryptedBase64, metaExtras = {}, opts) {
    if (opts?.fakeCalls)
        runFakeCalls(opts.fakeCalls);
    const meta = {
        method: "openssl",
        chain: ["openssl"],
        timestamp: new Date().toISOString(),
        fake_calls: opts?.fakeCalls ?? 0,
        ...metaExtras,
    };
    const pack = { meta, data: encryptedBase64 };
    return Buffer.from(JSON.stringify(pack)).toString("base64");
}
function unpack(packagedBase64) {
    const json = Buffer.from(packagedBase64, "base64").toString("utf8");
    const pack = JSON.parse(json);
    return pack;
}
// Minimal shell escaping for simple passphrase and file paths
function shellEscape(str) {
    // Wrap in single quotes and escape existing single quotes
    return `'` + str.replace(/'/g, `'\''`) + `'`;
}
async function processAreas(targets, passphrase, options) {
    const results = [];
    for (const t of targets) {
        const baseMeta = { ...(options?.meta ?? {}), timestamp: new Date().toISOString(), area: t.type === "file" ? t.path : t.key };
        if (t.intent === "skip") {
            results.push({ ...t, status: "skipped", meta: baseMeta });
            continue;
        }
        try {
            if (t.intent === "encrypt") {
                const src = t.data ?? (t.type === "file" ? await fs_1.default.promises.readFile(t.path, "utf8") : (t.data ?? ""));
                const enc = await encryptAsync(src, passphrase, { fakeCalls: options?.fakeCalls });
                const packaged = repack(enc, baseMeta, { fakeCalls: options?.fakeCalls });
                results.push({ ...t, status: "encrypted", packaged, meta: baseMeta });
            }
            else if (t.intent === "decrypt") {
                const packaged = t.data ?? (t.type === "file" ? await fs_1.default.promises.readFile(t.path, "utf8") : (t.data ?? ""));
                let plaintext;
                try {
                    // Try direct decrypt if provided is raw ciphertext b64
                    plaintext = await decryptAsync(packaged, passphrase, { fakeCalls: options?.fakeCalls });
                }
                catch {
                    // If not raw, treat as package
                    const pack = unpack(packaged);
                    plaintext = await decryptAsync(pack.data, passphrase, { fakeCalls: options?.fakeCalls });
                }
                results.push({ ...t, status: "decrypted", plaintext, meta: baseMeta });
            }
        }
        catch (e) {
            const failure = t.intent === "encrypt" ? "encryption failed" : "decryption failed";
            results.push({ ...t, status: failure, error: e?.message ?? String(e), meta: baseMeta });
        }
    }
    return results;
}
