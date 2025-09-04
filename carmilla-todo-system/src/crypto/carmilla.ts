/**
 * Carmilla OpenSSL Encryption Module
 * Completely plug-and-play, no dependencies except Node.js built-ins
 * Native OpenSSL via child_process
 */

import { execSync, exec } from 'child_process';
import { randomBytes, createHash } from 'crypto';
import fs from 'fs';
import { promisify } from 'util';

const execAsync = promisify(exec);
const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);
const unlinkAsync = promisify(fs.unlink);

export type CarmillaMeta = {
  method: 'openssl';
  chain?: string[];
  passphrase_hint?: string;
  timestamp: string;
  salt?: string;
  iv?: string;
  fake_calls?: number;
  area?: string;
  user_id?: string;
  workspace_id?: string;
  project_id?: string;
  run_id?: string;
  [key: string]: any;
};

export type CarmillaPackage = {
  meta: CarmillaMeta;
  data: string; // base64 encrypted data
};

export type EncryptionResult = {
  success: boolean;
  data?: string;
  error?: string;
  meta?: CarmillaMeta;
};

// Generate unique run ID for tracking
function generateRunId(): string {
  return randomBytes(16).toString('hex');
}

// Add fake encryption calls to confuse reverse engineering
function addFakeCalls(count: number = 3): void {
  for (let i = 0; i < count; i++) {
    try {
      // Fake OpenSSL calls that do nothing harmful
      const fakeData = randomBytes(32).toString('hex');
      const fakePass = randomBytes(16).toString('hex');
      const fakeSalt = randomBytes(8).toString('hex');
      
      // These calls will fail silently (wrong format) but waste RE time
      execSync(`echo "${fakeData}" | openssl enc -aes-128-ecb -pass pass:${fakePass} -salt -S ${fakeSalt} 2>/dev/null || true`, 
        { encoding: 'utf8', stdio: 'pipe' });
    } catch {
      // Ignore fake call failures
    }
  }
}

/**
 * Encrypt data using OpenSSL AES-256-CBC
 * Each run uses unique salt and IV
 */
export function encrypt(data: string, passphrase: string, meta: Partial<CarmillaMeta> = {}): string {
  const tempInput = `.carmilla_temp_${randomBytes(8).toString('hex')}.in`;
  const tempOutput = `.carmilla_temp_${randomBytes(8).toString('hex')}.out`;
  
  try {
    // Add fake calls before real encryption
    addFakeCalls(Math.floor(Math.random() * 5) + 1);
    
    // Generate unique salt and IV for this run
    const salt = randomBytes(8).toString('hex');
    
    // Write data to temp file
    fs.writeFileSync(tempInput, data, 'utf8');
    
    // Encrypt using OpenSSL
    execSync(
      `openssl enc -aes-256-cbc -salt -S ${salt} -in "${tempInput}" -out "${tempOutput}" -pass pass:"${passphrase}" -pbkdf2`,
      { encoding: 'utf8', stdio: 'pipe' }
    );
    
    // Read encrypted data
    const encrypted = fs.readFileSync(tempOutput);
    const base64 = encrypted.toString('base64');
    
    // Clean up temp files immediately
    fs.unlinkSync(tempInput);
    fs.unlinkSync(tempOutput);
    
    // Store salt in metadata for decryption
    if (meta) {
      meta.salt = salt;
    }
    
    return base64;
  } catch (error) {
    // Clean up on error
    try { fs.unlinkSync(tempInput); } catch {}
    try { fs.unlinkSync(tempOutput); } catch {}
    throw new Error(`Encryption failed: ${error.message}`);
  }
}

/**
 * Decrypt data using OpenSSL AES-256-CBC
 */
export function decrypt(encryptedBase64: string, passphrase: string, salt?: string): string {
  const tempInput = `.carmilla_temp_${randomBytes(8).toString('hex')}.in`;
  const tempOutput = `.carmilla_temp_${randomBytes(8).toString('hex')}.out`;
  
  try {
    // Add fake calls
    addFakeCalls(Math.floor(Math.random() * 3) + 1);
    
    // Write encrypted data to temp file
    const encrypted = Buffer.from(encryptedBase64, 'base64');
    fs.writeFileSync(tempInput, encrypted);
    
    // Decrypt using OpenSSL
    const saltArg = salt ? `-S ${salt}` : '';
    execSync(
      `openssl enc -aes-256-cbc -d ${saltArg} -in "${tempInput}" -out "${tempOutput}" -pass pass:"${passphrase}" -pbkdf2`,
      { encoding: 'utf8', stdio: 'pipe' }
    );
    
    // Read decrypted data
    const decrypted = fs.readFileSync(tempOutput, 'utf8');
    
    // Clean up temp files
    fs.unlinkSync(tempInput);
    fs.unlinkSync(tempOutput);
    
    return decrypted;
  } catch (error) {
    // Clean up on error
    try { fs.unlinkSync(tempInput); } catch {}
    try { fs.unlinkSync(tempOutput); } catch {}
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

/**
 * Package encrypted data with metadata
 * Allows on-the-fly reconfiguration of encryption chain
 */
export function repack(
  encrypted: string, 
  passphrase_hint: string = '',
  chain: string[] = ['openssl'],
  additionalMeta: Partial<CarmillaMeta> = {}
): string {
  const meta: CarmillaMeta = {
    method: 'openssl',
    chain,
    passphrase_hint,
    timestamp: new Date().toISOString(),
    run_id: generateRunId(),
    fake_calls: Math.floor(Math.random() * 10),
    ...additionalMeta
  };
  
  const pack: CarmillaPackage = { meta, data: encrypted };
  return Buffer.from(JSON.stringify(pack)).toString('base64');
}

/**
 * Unpack and inspect metadata without decrypting
 * Allows chain reconfiguration before decryption
 */
export function unpack(packaged: string): CarmillaPackage {
  try {
    const json = Buffer.from(packaged, 'base64').toString('utf-8');
    const pack: CarmillaPackage = JSON.parse(json);
    
    // Inspect chain and potentially reconfigure
    if (pack.meta.chain && pack.meta.chain.length > 1) {
      // Chain can be modified here if needed
      console.log(`Encryption chain: ${pack.meta.chain.join(' -> ')}`);
    }
    
    return pack;
  } catch (error) {
    throw new Error(`Unpack failed: ${error.message}`);
  }
}

// Async versions for non-blocking operations
export async function encryptAsync(data: string, passphrase: string, meta: Partial<CarmillaMeta> = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const result = encrypt(data, passphrase, meta);
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
}

export async function decryptAsync(encryptedBase64: string, passphrase: string, salt?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const result = decrypt(encryptedBase64, passphrase, salt);
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
}

// Helper to check if OpenSSL is available
export function checkOpenSSL(): boolean {
  try {
    execSync('openssl version', { encoding: 'utf8', stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

// Export everything for plug-and-play usage
export default {
  encrypt,
  decrypt,
  repack,
  unpack,
  encryptAsync,
  decryptAsync,
  checkOpenSSL,
  generateRunId
};