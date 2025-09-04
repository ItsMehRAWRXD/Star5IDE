// Carmilla OpenSSL encryption module (plug-and-play, no external npm deps)
// Provides synchronous and asynchronous helpers.
// All operations are explicit – nothing runs on import.

const { execSync, exec } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { promisify } = require('util');

const execAsync = promisify(exec);

function tmpFile(prefix = 'carmilla_') {
  return path.join(os.tmpdir(), `${prefix}${Date.now()}_${Math.random().toString(16).slice(2)}`);
}

function _opensslEncryptSync(data, passphrase) {
  const inFile = tmpFile('in_');
  const outFile = tmpFile('out_');
  fs.writeFileSync(inFile, data, 'utf8');
  try {
    execSync(`openssl enc -aes-256-cbc -salt -pbkdf2 -pass pass:${passphrase} -in "${inFile}" -out "${outFile}"`);
    const enc = fs.readFileSync(outFile);
    return enc.toString('base64');
  } finally {
    fs.rmSync(inFile, { force: true });
    fs.rmSync(outFile, { force: true });
  }
}

async function _opensslEncrypt(data, passphrase) {
  const inFile = tmpFile('in_');
  const outFile = tmpFile('out_');
  await fs.promises.writeFile(inFile, data, 'utf8');
  try {
    await execAsync(`openssl enc -aes-256-cbc -salt -pbkdf2 -pass pass:${passphrase} -in "${inFile}" -out "${outFile}"`);
    const enc = await fs.promises.readFile(outFile);
    return enc.toString('base64');
  } finally {
    fs.rmSync(inFile, { force: true });
    fs.rmSync(outFile, { force: true });
  }
}

function _opensslDecryptSync(base64Data, passphrase) {
  const inFile = tmpFile('in_');
  const outFile = tmpFile('out_');
  fs.writeFileSync(inFile, Buffer.from(base64Data, 'base64'));
  try {
    execSync(`openssl enc -d -aes-256-cbc -pbkdf2 -pass pass:${passphrase} -in "${inFile}" -out "${outFile}"`);
    return fs.readFileSync(outFile, 'utf8');
  } finally {
    fs.rmSync(inFile, { force: true });
    fs.rmSync(outFile, { force: true });
  }
}

async function _opensslDecrypt(base64Data, passphrase) {
  const inFile = tmpFile('in_');
  const outFile = tmpFile('out_');
  await fs.promises.writeFile(inFile, Buffer.from(base64Data, 'base64'));
  try {
    await execAsync(`openssl enc -d -aes-256-cbc -pbkdf2 -pass pass:${passphrase} -in "${inFile}" -out "${outFile}"`);
    return await fs.promises.readFile(outFile, 'utf8');
  } finally {
    fs.rmSync(inFile, { force: true });
    fs.rmSync(outFile, { force: true });
  }
}

module.exports = {
  encryptSync: _opensslEncryptSync,
  decryptSync: _opensslDecryptSync,
  encryptAsync: _opensslEncrypt,
  decryptAsync: _opensslDecrypt,
  // Add repack/unpack helpers
  repackSync(dataBase64, meta = {}) {
    const pack = {
      meta: { timestamp: new Date().toISOString(), ...meta, method: 'openssl' },
      data: dataBase64,
    };
    return Buffer.from(JSON.stringify(pack)).toString('base64');
  },
  unpackSync(packagedBase64) {
    const json = Buffer.from(packagedBase64, 'base64').toString('utf8');
    return JSON.parse(json);
  },
  async repack(dataBase64, meta = {}) {
    return this.repackSync(dataBase64, meta);
  },
  async unpack(packagedBase64) {
    return this.unpackSync(packagedBase64);
  },
};