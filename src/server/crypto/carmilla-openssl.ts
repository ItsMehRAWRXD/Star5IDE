import { execSync, exec } from "child_process";
import fs from "fs";
import { promisify } from "util";
import { randomBytes } from "crypto";
import { CarmillaMeta, CarmillaPackage } from "../../shared/types";

const execAsync = promisify(exec);
const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);
const unlinkAsync = promisify(fs.unlink);

// Generate fake encryption calls to thwart reverse engineering
function generateFakeCalls(): string[] {
  const fakes = [
    'openssl enc -aes-128-ecb -nosalt -k "fake1"',
    'openssl dgst -sha1',
    'openssl rand -hex 16',
    'openssl enc -des-cbc -nosalt -k "decoy"',
    'openssl base64 -d'
  ];
  return fakes.sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 3) + 1);
}

function executeFakeCalls(fakes: string[]): void {
  // Execute fake calls with dummy data to confuse reverse engineering
  fakes.forEach(fake => {
    try {
      execSync(`echo "dummy" | ${fake}`, { stdio: 'ignore', timeout: 1000 });
    } catch {
      // Ignore errors from fake calls
    }
  });
}

/**
 * Encrypt data using OpenSSL AES-256-CBC with unique salt/IV per run
 */
export function encrypt(data: string, passphrase: string): string {
  const fakes = generateFakeCalls();
  executeFakeCalls(fakes);

  const tempInput = `.tmp_carmilla_input_${randomBytes(8).toString('hex')}.txt`;
  const tempOutput = `.tmp_carmilla_output_${randomBytes(8).toString('hex')}.enc`;
  
  try {
    fs.writeFileSync(tempInput, data);
    
    // OpenSSL AES-256-CBC with salt (unique per run)
    execSync(`openssl enc -aes-256-cbc -salt -in ${tempInput} -out ${tempOutput} -k "${passphrase}"`);
    
    const encrypted = fs.readFileSync(tempOutput, 'base64');
    
    // Cleanup
    fs.unlinkSync(tempInput);
    fs.unlinkSync(tempOutput);
    
    return encrypted;
  } catch (error) {
    // Cleanup on error
    try { fs.unlinkSync(tempInput); } catch {}
    try { fs.unlinkSync(tempOutput); } catch {}
    throw new Error(`Encryption failed: ${error.message}`);
  }
}

/**
 * Decrypt data using OpenSSL AES-256-CBC
 */
export function decrypt(encryptedBase64: string, passphrase: string): string {
  const fakes = generateFakeCalls();
  executeFakeCalls(fakes);

  const tempInput = `.tmp_carmilla_decrypt_${randomBytes(8).toString('hex')}.enc`;
  const tempOutput = `.tmp_carmilla_decrypt_${randomBytes(8).toString('hex')}.txt`;
  
  try {
    fs.writeFileSync(tempInput, encryptedBase64, 'base64');
    
    execSync(`openssl enc -aes-256-cbc -d -in ${tempInput} -out ${tempOutput} -k "${passphrase}"`);
    
    const decrypted = fs.readFileSync(tempOutput, 'utf8');
    
    // Cleanup
    fs.unlinkSync(tempInput);
    fs.unlinkSync(tempOutput);
    
    return decrypted;
  } catch (error) {
    // Cleanup on error
    try { fs.unlinkSync(tempInput); } catch {}
    try { fs.unlinkSync(tempOutput); } catch {}
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

/**
 * Async encrypt for non-blocking operations
 */
export async function encryptAsync(data: string, passphrase: string): Promise<string> {
  const fakes = generateFakeCalls();
  executeFakeCalls(fakes);

  const tempInput = `.tmp_carmilla_input_${randomBytes(8).toString('hex')}.txt`;
  const tempOutput = `.tmp_carmilla_output_${randomBytes(8).toString('hex')}.enc`;
  
  try {
    await writeFileAsync(tempInput, data);
    
    await execAsync(`openssl enc -aes-256-cbc -salt -in ${tempInput} -out ${tempOutput} -k "${passphrase}"`);
    
    const encrypted = await readFileAsync(tempOutput, 'base64');
    
    // Cleanup
    await unlinkAsync(tempInput);
    await unlinkAsync(tempOutput);
    
    return encrypted;
  } catch (error) {
    // Cleanup on error
    try { await unlinkAsync(tempInput); } catch {}
    try { await unlinkAsync(tempOutput); } catch {}
    throw new Error(`Async encryption failed: ${error.message}`);
  }
}

/**
 * Async decrypt for non-blocking operations
 */
export async function decryptAsync(encryptedBase64: string, passphrase: string): Promise<string> {
  const fakes = generateFakeCalls();
  executeFakeCalls(fakes);

  const tempInput = `.tmp_carmilla_decrypt_${randomBytes(8).toString('hex')}.enc`;
  const tempOutput = `.tmp_carmilla_decrypt_${randomBytes(8).toString('hex')}.txt`;
  
  try {
    await writeFileAsync(tempInput, encryptedBase64, 'base64');
    
    await execAsync(`openssl enc -aes-256-cbc -d -in ${tempInput} -out ${tempOutput} -k "${passphrase}"`);
    
    const decrypted = await readFileAsync(tempOutput, 'utf8');
    
    // Cleanup
    await unlinkAsync(tempInput);
    await unlinkAsync(tempOutput);
    
    return decrypted;
  } catch (error) {
    // Cleanup on error
    try { await unlinkAsync(tempInput); } catch {}
    try { await unlinkAsync(tempOutput); } catch {}
    throw new Error(`Async decryption failed: ${error.message}`);
  }
}

/**
 * Repack encrypted data with metadata and chain info
 */
export function repack(
  encrypted: string,
  passphrase_hint = '',
  chain: string[] = ['openssl'],
  meta: Partial<CarmillaMeta> = {}
): string {
  const fullMeta: CarmillaMeta = {
    method: 'openssl',
    chain,
    passphrase_hint,
    timestamp: new Date().toISOString(),
    fake_calls: generateFakeCalls(), // Anti-reverse engineering
    ...meta
  };
  
  const pack: CarmillaPackage = { meta: fullMeta, data: encrypted };
  return Buffer.from(JSON.stringify(pack)).toString('base64');
}

/**
 * Unpack a Carmilla package to extract metadata and encrypted data
 */
export function unpack(packaged: string): CarmillaPackage {
  try {
    const json = Buffer.from(packaged, 'base64').toString('utf-8');
    const pack: CarmillaPackage = JSON.parse(json);
    
    // Validate package structure
    if (!pack.meta || !pack.data) {
      throw new Error('Invalid package structure');
    }
    
    return pack;
  } catch (error) {
    throw new Error(`Unpack failed: ${error.message}`);
  }
}

/**
 * Complete encrypt and repack in one operation
 */
export async function encryptAndRepack(
  data: string,
  passphrase: string,
  passphrase_hint = '',
  meta: Partial<CarmillaMeta> = {}
): Promise<string> {
  const encrypted = await encryptAsync(data, passphrase);
  return repack(encrypted, passphrase_hint, ['openssl'], meta);
}

/**
 * Complete unpack and decrypt in one operation
 */
export async function unpackAndDecrypt(
  packaged: string,
  passphrase: string
): Promise<{ data: string; meta: CarmillaMeta }> {
  const pack = unpack(packaged);
  const decrypted = await decryptAsync(pack.data, passphrase);
  return { data: decrypted, meta: pack.meta };
}