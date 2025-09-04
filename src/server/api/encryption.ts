import express from "express";
import {
  encryptAsync,
  decryptAsync,
  repack,
  unpack,
  encryptAndRepack,
  unpackAndDecrypt
} from "../crypto/carmilla-openssl";
import { EncryptionTarget, EncryptionResult } from "../../shared/types";

const router = express.Router();

/**
 * Simple encrypt endpoint
 */
router.post('/encrypt', async (req, res) => {
  try {
    const { data, passphrase, meta = {} } = req.body;
    
    if (!data || !passphrase) {
      return res.status(400).json({ error: 'Data and passphrase are required' });
    }
    
    const encrypted = await encryptAsync(data, passphrase);
    const packaged = repack(encrypted, '', ['openssl'], {
      timestamp: new Date().toISOString(),
      ...meta
    });
    
    res.json({ 
      success: true, 
      packaged,
      meta: { timestamp: new Date().toISOString(), ...meta }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Encryption failed', 
      details: error.message 
    });
  }
});

/**
 * Simple decrypt endpoint
 */
router.post('/decrypt', async (req, res) => {
  try {
    const { packaged, passphrase } = req.body;
    
    if (!packaged || !passphrase) {
      return res.status(400).json({ error: 'Packaged data and passphrase are required' });
    }
    
    const { data, meta } = await unpackAndDecrypt(packaged, passphrase);
    
    res.json({ 
      success: true, 
      data,
      meta
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Decryption failed', 
      details: error.message 
    });
  }
});

/**
 * Selective area encryption - encrypt specific areas/sections
 */
router.post('/encrypt-selective', async (req, res) => {
  try {
    const { targets, passphrase, meta = {} }: { 
      targets: EncryptionTarget[], 
      passphrase: string, 
      meta: any 
    } = req.body;
    
    if (!targets || !Array.isArray(targets) || !passphrase) {
      return res.status(400).json({ 
        error: 'Targets array and passphrase are required' 
      });
    }
    
    const results: EncryptionResult[] = [];
    const timestamp = new Date().toISOString();
    
    for (const target of targets) {
      const baseResult: Partial<EncryptionResult> = {
        type: target.type,
        path: target.path,
        key: target.key,
        intent: target.intent,
        meta: {
          method: 'openssl',
          timestamp,
          ...meta
        }
      };
      
      if (target.intent === 'do-not-encrypt') {
        results.push({
          ...baseResult,
          status: 'skipped',
          reason: 'user marked as do-not-encrypt'
        } as EncryptionResult);
        continue;
      }
      
      if (target.intent === 'cannot-encrypt') {
        results.push({
          ...baseResult,
          status: 'cannot-encrypt',
          reason: 'user marked as cannot-encrypt'
        } as EncryptionResult);
        continue;
      }
      
      // Attempt encryption
      try {
        if (!target.data) {
          results.push({
            ...baseResult,
            status: 'encryption-failed',
            error: 'no data provided'
          } as EncryptionResult);
          continue;
        }
        
        const encrypted = await encryptAsync(target.data, passphrase);
        const packaged = repack(encrypted, '', ['openssl'], {
          area: target.key || target.path,
          type: target.type,
          timestamp,
          ...meta
        });
        
        results.push({
          ...baseResult,
          status: 'encrypted',
          packaged
        } as EncryptionResult);
        
      } catch (error) {
        results.push({
          ...baseResult,
          status: 'encryption-failed',
          error: error.message
        } as EncryptionResult);
      }
    }
    
    res.json({ 
      success: true, 
      results,
      summary: {
        total: targets.length,
        encrypted: results.filter(r => r.status === 'encrypted').length,
        failed: results.filter(r => r.status === 'encryption-failed').length,
        skipped: results.filter(r => r.status === 'skipped').length,
        cannotEncrypt: results.filter(r => r.status === 'cannot-encrypt').length
      }
    });
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Selective encryption failed', 
      details: error.message 
    });
  }
});

/**
 * Selective area decryption
 */
router.post('/decrypt-selective', async (req, res) => {
  try {
    const { targets, passphrase }: { 
      targets: { packaged: string; key?: string; path?: string }[], 
      passphrase: string 
    } = req.body;
    
    if (!targets || !Array.isArray(targets) || !passphrase) {
      return res.status(400).json({ 
        error: 'Targets array and passphrase are required' 
      });
    }
    
    const results = [];
    
    for (const target of targets) {
      try {
        const { data, meta } = await unpackAndDecrypt(target.packaged, passphrase);
        
        results.push({
          key: target.key,
          path: target.path,
          status: 'decrypted',
          data,
          meta
        });
        
      } catch (error) {
        results.push({
          key: target.key,
          path: target.path,
          status: 'decryption-failed',
          error: error.message
        });
      }
    }
    
    res.json({ 
      success: true, 
      results,
      summary: {
        total: targets.length,
        decrypted: results.filter(r => r.status === 'decrypted').length,
        failed: results.filter(r => r.status === 'decryption-failed').length
      }
    });
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Selective decryption failed', 
      details: error.message 
    });
  }
});

/**
 * Get package metadata without decrypting
 */
router.post('/inspect', async (req, res) => {
  try {
    const { packaged } = req.body;
    
    if (!packaged) {
      return res.status(400).json({ error: 'Packaged data is required' });
    }
    
    const pack = unpack(packaged);
    
    res.json({ 
      success: true, 
      meta: pack.meta,
      hasData: !!pack.data,
      dataLength: pack.data.length
    });
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Inspection failed', 
      details: error.message 
    });
  }
});

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    encryption: 'carmilla-openssl-ready'
  });
});

export default router;