/**
 * Selective Area Encryption Service
 * Provides detailed per-area reporting and audit trails
 * Never downgrades or substitutes encryption methods
 */

import {
  encrypt,
  decrypt,
  repack,
  unpack,
  encryptAsync,
  decryptAsync,
  checkOpenSSL,
  generateRunId
} from '../crypto/carmilla';
import fs from 'fs/promises';
import path from 'path';

export type EncryptionIntent = 'encrypt' | 'decrypt' | 'do-not-touch' | 'cannot-process';

export interface EncryptionTarget {
  type: 'file' | 'object' | 'buffer' | 'string';
  path?: string;        // for files
  key?: string;         // for objects
  data?: string;        // for direct data
  intent: EncryptionIntent;
  passphrase?: string;  // optional per-target passphrase
}

export interface EncryptionReport {
  type: string;
  path?: string;
  key?: string;
  intent: EncryptionIntent;
  status: 'encrypted' | 'decrypted' | 'skipped' | 'failed';
  packaged?: string;    // base64 package if successful
  error?: string;       // detailed error if failed
  reason?: string;      // reason for skip
  meta?: any;          // encryption metadata
  timestamp: string;
  runId: string;
  duration?: number;    // ms taken for this operation
}

export interface BatchEncryptionResult {
  success: boolean;
  runId: string;
  totalTargets: number;
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  reports: EncryptionReport[];
  timestamp: string;
  totalDuration: number;
}

/**
 * Process a single encryption target
 */
async function processTarget(
  target: EncryptionTarget,
  defaultPassphrase: string,
  runId: string,
  meta: any = {}
): Promise<EncryptionReport> {
  const startTime = Date.now();
  const report: EncryptionReport = {
    type: target.type,
    path: target.path,
    key: target.key,
    intent: target.intent,
    status: 'failed',
    timestamp: new Date().toISOString(),
    runId
  };
  
  // Skip if marked as do-not-touch
  if (target.intent === 'do-not-touch') {
    report.status = 'skipped';
    report.reason = 'marked as do-not-touch';
    report.duration = Date.now() - startTime;
    return report;
  }
  
  // Skip if marked as cannot-process
  if (target.intent === 'cannot-process') {
    report.status = 'skipped';
    report.reason = 'marked as cannot-process';
    report.duration = Date.now() - startTime;
    return report;
  }
  
  const passphrase = target.passphrase || defaultPassphrase;
  
  try {
    let data: string = '';
    
    // Get data based on target type
    switch (target.type) {
      case 'file':
        if (!target.path) {
          throw new Error('File path required for file type');
        }
        try {
          data = await fs.readFile(target.path, 'utf8');
        } catch (err) {
          throw new Error(`Cannot read file: ${err.message}`);
        }
        break;
        
      case 'object':
      case 'string':
      case 'buffer':
        if (!target.data) {
          throw new Error('Data required for non-file types');
        }
        data = target.data;
        break;
        
      default:
        throw new Error(`Unknown target type: ${target.type}`);
    }
    
    // Process based on intent
    if (target.intent === 'encrypt') {
      // Attempt encryption - no fallback or substitution
      const encrypted = await encryptAsync(data, passphrase, {
        ...meta,
        area: target.key || target.path,
        target_type: target.type
      });
      
      // Package with metadata
      const packaged = repack(encrypted, '', ['openssl'], {
        ...meta,
        area: target.key || target.path,
        target_type: target.type,
        original_size: data.length
      });
      
      report.status = 'encrypted';
      report.packaged = packaged;
      report.meta = { 
        size: data.length,
        encrypted_size: encrypted.length 
      };
      
      // Save encrypted file if it was a file target
      if (target.type === 'file' && target.path) {
        const encPath = `${target.path}.carmilla`;
        await fs.writeFile(encPath, packaged, 'utf8');
        report.meta.saved_to = encPath;
      }
      
    } else if (target.intent === 'decrypt') {
      // Check if data is a package
      let decrypted: string;
      
      try {
        const pack = unpack(data);
        // Decrypt using metadata from package
        decrypted = await decryptAsync(pack.data, passphrase, pack.meta.salt);
        report.meta = {
          original_meta: pack.meta,
          decrypted_size: decrypted.length
        };
      } catch {
        // Try direct decryption if not a package
        decrypted = await decryptAsync(data, passphrase);
        report.meta = { decrypted_size: decrypted.length };
      }
      
      report.status = 'decrypted';
      report.packaged = decrypted; // Return decrypted data
      
      // Save decrypted file if it was a file target
      if (target.type === 'file' && target.path) {
        const decPath = target.path.replace('.carmilla', '');
        await fs.writeFile(decPath, decrypted, 'utf8');
        report.meta.saved_to = decPath;
      }
    }
    
  } catch (error) {
    // Report detailed error - never hide or substitute
    report.status = 'failed';
    report.error = error.message;
    
    // Add debugging info
    if (error.stack) {
      report.meta = { 
        ...report.meta, 
        stack: error.stack.split('\n').slice(0, 3) 
      };
    }
  }
  
  report.duration = Date.now() - startTime;
  return report;
}

/**
 * Process multiple targets with detailed reporting
 */
export async function processTargets(
  targets: EncryptionTarget[],
  passphrase: string,
  meta: any = {}
): Promise<BatchEncryptionResult> {
  const startTime = Date.now();
  const runId = generateRunId();
  const reports: EncryptionReport[] = [];
  
  // Check OpenSSL availability first
  if (!checkOpenSSL()) {
    return {
      success: false,
      runId,
      totalTargets: targets.length,
      processed: 0,
      succeeded: 0,
      failed: targets.length,
      skipped: 0,
      reports: targets.map(t => ({
        type: t.type,
        path: t.path,
        key: t.key,
        intent: t.intent,
        status: 'failed',
        error: 'OpenSSL not available',
        timestamp: new Date().toISOString(),
        runId
      })),
      timestamp: new Date().toISOString(),
      totalDuration: Date.now() - startTime
    };
  }
  
  // Process each target
  for (const target of targets) {
    const report = await processTarget(target, passphrase, runId, meta);
    reports.push(report);
  }
  
  // Calculate statistics
  const succeeded = reports.filter(r => r.status === 'encrypted' || r.status === 'decrypted').length;
  const failed = reports.filter(r => r.status === 'failed').length;
  const skipped = reports.filter(r => r.status === 'skipped').length;
  
  return {
    success: failed === 0,
    runId,
    totalTargets: targets.length,
    processed: reports.length,
    succeeded,
    failed,
    skipped,
    reports,
    timestamp: new Date().toISOString(),
    totalDuration: Date.now() - startTime
  };
}

/**
 * Encrypt specific areas of a file
 */
export async function encryptFileAreas(
  filePath: string,
  areas: Array<{ start: number; end: number; }>,
  passphrase: string
): Promise<BatchEncryptionResult> {
  const startTime = Date.now();
  const runId = generateRunId();
  const reports: EncryptionReport[] = [];
  
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Process each area
    for (const area of areas) {
      const areaContent = lines.slice(area.start, area.end + 1).join('\n');
      const target: EncryptionTarget = {
        type: 'string',
        data: areaContent,
        key: `lines_${area.start}-${area.end}`,
        intent: 'encrypt'
      };
      
      const report = await processTarget(target, passphrase, runId, {
        file: filePath,
        area
      });
      reports.push(report);
    }
    
    // Save area map
    const areaMap = {
      file: filePath,
      areas: areas.map((a, i) => ({
        ...a,
        encrypted: reports[i].status === 'encrypted',
        package: reports[i].packaged
      }))
    };
    
    await fs.writeFile(
      `${filePath}.areas.json`,
      JSON.stringify(areaMap, null, 2)
    );
    
  } catch (error) {
    return {
      success: false,
      runId,
      totalTargets: areas.length,
      processed: 0,
      succeeded: 0,
      failed: areas.length,
      skipped: 0,
      reports: [{
        type: 'file',
        path: filePath,
        intent: 'encrypt',
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString(),
        runId
      }],
      timestamp: new Date().toISOString(),
      totalDuration: Date.now() - startTime
    };
  }
  
  const succeeded = reports.filter(r => r.status === 'encrypted').length;
  const failed = reports.filter(r => r.status === 'failed').length;
  
  return {
    success: failed === 0,
    runId,
    totalTargets: areas.length,
    processed: reports.length,
    succeeded,
    failed,
    skipped: 0,
    reports,
    timestamp: new Date().toISOString(),
    totalDuration: Date.now() - startTime
  };
}

// Export for plug-and-play usage
export default {
  processTargets,
  encryptFileAreas,
  processTarget
};