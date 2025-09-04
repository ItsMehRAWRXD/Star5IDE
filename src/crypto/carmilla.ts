import { execSync, exec } from "child_process";
import fs from "fs";
import { promisify } from "util";
import { randomBytes } from "crypto";

const execAsync = promisify(exec);
const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);
const unlinkAsync = promisify(fs.unlink);

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
  data: string;
};

export type EncryptionTarget = {
  type: "file" | "obj" | "buffer";
  path?: string;
  key?: string;
  data?: string;
  intent: "encrypt" | "do-not-encrypt" | "cannot-encrypt";
};

export type EncryptionResult = {
  type: string;
  path?: string;
  key?: string;
  intent: string;
  status: "encrypted" | "encryption failed" | "skipped" | "cannot encrypt";
  packaged?: string;
  error?: string;
  reason?: string;
  meta?: CarmillaMeta;
};

/**
 * Core Carmilla OpenSSL encryption - pure Node.js, no dependencies
 * Each run generates unique salt/IV - no reuse, no fallback
 */
export class Carmilla {
  private static generateFakeCalls(): number {
    return Math.floor(Math.random() * 5) + 1;
  }

  private static async createTempFile(content: string): Promise<string> {
    const tempFile = `/tmp/carmilla_${randomBytes(8).toString('hex')}.tmp`;
    await writeFileAsync(tempFile, content);
    return tempFile;
  }

  private static async cleanupTempFile(filePath: string): Promise<void> {
    try {
      await unlinkAsync(filePath);
    } catch (e) {
      // Ignore cleanup errors
    }
  }

  /**
   * Encrypt data using OpenSSL AES-256-CBC
   * Each call generates unique salt/IV - no reuse
   */
  static async encrypt(data: string, passphrase: string): Promise<string> {
    const fakeCalls = this.generateFakeCalls();
    
    // Generate fake encryption calls to thwart reverse engineering
    for (let i = 0; i < fakeCalls; i++) {
      const fakeData = randomBytes(32).toString('hex');
      const fakePass = randomBytes(16).toString('hex');
      try {
        const fakeTemp = await this.createTempFile(fakeData);
        execSync(`echo "${fakePass}" | openssl enc -aes-256-cbc -base64 -in "${fakeTemp}" -out /dev/null -pass stdin`, { stdio: 'ignore' });
        await this.cleanupTempFile(fakeTemp);
      } catch (e) {
        // Ignore fake call errors
      }
    }

    try {
      const inputFile = await this.createTempFile(data);
      const outputFile = `/tmp/carmilla_out_${randomBytes(8).toString('hex')}.tmp`;
      
      // Real encryption with unique salt/IV each time
      execSync(`echo "${passphrase}" | openssl enc -aes-256-cbc -base64 -salt -in "${inputFile}" -out "${outputFile}" -pass stdin`);
      
      const encrypted = await readFileAsync(outputFile, 'utf-8');
      
      await this.cleanupTempFile(inputFile);
      await this.cleanupTempFile(outputFile);
      
      return encrypted.trim();
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt data using OpenSSL AES-256-CBC
   */
  static async decrypt(encryptedData: string, passphrase: string): Promise<string> {
    const fakeCalls = this.generateFakeCalls();
    
    // Generate fake decryption calls
    for (let i = 0; i < fakeCalls; i++) {
      const fakeData = randomBytes(32).toString('base64');
      const fakePass = randomBytes(16).toString('hex');
      try {
        const fakeTemp = await this.createTempFile(fakeData);
        execSync(`echo "${fakePass}" | openssl enc -aes-256-cbc -base64 -d -in "${fakeTemp}" -out /dev/null -pass stdin`, { stdio: 'ignore' });
        await this.cleanupTempFile(fakeTemp);
      } catch (e) {
        // Ignore fake call errors
      }
    }

    try {
      const inputFile = await this.createTempFile(encryptedData);
      const outputFile = `/tmp/carmilla_dec_${randomBytes(8).toString('hex')}.tmp`;
      
      execSync(`echo "${passphrase}" | openssl enc -aes-256-cbc -base64 -d -in "${inputFile}" -out "${outputFile}" -pass stdin`);
      
      const decrypted = await readFileAsync(outputFile, 'utf-8');
      
      await this.cleanupTempFile(inputFile);
      await this.cleanupTempFile(outputFile);
      
      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Package encrypted data with metadata
   */
  static repack(encrypted: string, options: Partial<CarmillaMeta> = {}): string {
    const meta: CarmillaMeta = {
      method: "openssl",
      chain: options.chain || ["openssl"],
      passphrase_hint: options.passphrase_hint || "",
      timestamp: new Date().toISOString(),
      fake_calls: this.generateFakeCalls(),
      ...options
    };

    const pack: CarmillaPackage = { meta, data: encrypted };
    return Buffer.from(JSON.stringify(pack)).toString('base64');
  }

  /**
   * Unpackage encrypted data and metadata
   */
  static unpack(packaged: string): CarmillaPackage {
    try {
      const json = Buffer.from(packaged, 'base64').toString('utf-8');
      const pack: CarmillaPackage = JSON.parse(json);
      
      // Validate package structure
      if (!pack.meta || !pack.data) {
        throw new Error("Invalid package structure");
      }
      
      return pack;
    } catch (error) {
      throw new Error(`Unpack failed: ${error.message}`);
    }
  }

  /**
   * Encrypt with automatic packaging
   */
  static async encryptAndPack(data: string, passphrase: string, options: Partial<CarmillaMeta> = {}): Promise<string> {
    const encrypted = await this.encrypt(data, passphrase);
    return this.repack(encrypted, options);
  }

  /**
   * Unpack and decrypt in one operation
   */
  static async unpackAndDecrypt(packaged: string, passphrase: string): Promise<string> {
    const pack = this.unpack(packaged);
    return await this.decrypt(pack.data, passphrase);
  }

  /**
   * Process multiple encryption targets with detailed reporting
   */
  static async processTargets(targets: EncryptionTarget[], passphrase: string, options: Partial<CarmillaMeta> = {}): Promise<EncryptionResult[]> {
    const results: EncryptionResult[] = [];
    const timestamp = new Date().toISOString();

    for (const target of targets) {
      const baseResult: EncryptionResult = {
        type: target.type,
        path: target.path,
        key: target.key,
        intent: target.intent,
        status: "skipped",
        meta: { ...options, timestamp }
      };

      if (target.intent === "do-not-encrypt") {
        baseResult.status = "skipped";
        baseResult.reason = "user marked as do-not-encrypt";
        results.push(baseResult);
        continue;
      }

      if (target.intent === "cannot-encrypt") {
        baseResult.status = "cannot encrypt";
        baseResult.reason = "marked as cannot encrypt";
        results.push(baseResult);
        continue;
      }

      if (target.intent === "encrypt") {
        try {
          let dataToEncrypt: string;
          
          if (target.type === "file" && target.path) {
            dataToEncrypt = await readFileAsync(target.path, 'utf-8');
          } else if (target.data) {
            dataToEncrypt = target.data;
          } else {
            throw new Error("No data to encrypt");
          }

          const encrypted = await this.encrypt(dataToEncrypt, passphrase);
          const packaged = this.repack(encrypted, { ...options, timestamp });

          baseResult.status = "encrypted";
          baseResult.packaged = packaged;
          results.push(baseResult);
        } catch (error) {
          baseResult.status = "encryption failed";
          baseResult.error = error.message;
          results.push(baseResult);
        }
      }
    }

    return results;
  }
}

export default Carmilla;