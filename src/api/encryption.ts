import express from "express";
import Carmilla, { EncryptionTarget, EncryptionResult } from "../crypto/carmilla";
import CarPatcher, { PatchConfig } from "../patch/carPatcher";

const router = express.Router();

// Middleware for JSON parsing
router.use(express.json({ limit: '50mb' }));
router.use(express.urlencoded({ extended: true, limit: '50mb' }));

/**
 * POST /api/encrypt
 * Encrypt a single data string
 */
router.post('/encrypt', async (req, res) => {
  try {
    const { data, passphrase, options = {} } = req.body;
    
    if (!data || !passphrase) {
      return res.status(400).json({
        error: "Missing required fields: data, passphrase"
      });
    }

    const encrypted = await Carmilla.encrypt(data, passphrase);
    
    res.json({
      success: true,
      encrypted,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: "Encryption failed",
      message: error.message
    });
  }
});

/**
 * POST /api/decrypt
 * Decrypt a single encrypted string
 */
router.post('/decrypt', async (req, res) => {
  try {
    const { encrypted, passphrase } = req.body;
    
    if (!encrypted || !passphrase) {
      return res.status(400).json({
        error: "Missing required fields: encrypted, passphrase"
      });
    }

    const decrypted = await Carmilla.decrypt(encrypted, passphrase);
    
    res.json({
      success: true,
      decrypted,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: "Decryption failed",
      message: error.message
    });
  }
});

/**
 * POST /api/encrypt-and-pack
 * Encrypt and package with metadata
 */
router.post('/encrypt-and-pack', async (req, res) => {
  try {
    const { data, passphrase, options = {} } = req.body;
    
    if (!data || !passphrase) {
      return res.status(400).json({
        error: "Missing required fields: data, passphrase"
      });
    }

    const packaged = await Carmilla.encryptAndPack(data, passphrase, options);
    
    res.json({
      success: true,
      packaged,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: "Encrypt and pack failed",
      message: error.message
    });
  }
});

/**
 * POST /api/unpack-and-decrypt
 * Unpack and decrypt in one operation
 */
router.post('/unpack-and-decrypt', async (req, res) => {
  try {
    const { packaged, passphrase } = req.body;
    
    if (!packaged || !passphrase) {
      return res.status(400).json({
        error: "Missing required fields: packaged, passphrase"
      });
    }

    const decrypted = await Carmilla.unpackAndDecrypt(packaged, passphrase);
    
    res.json({
      success: true,
      decrypted,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: "Unpack and decrypt failed",
      message: error.message
    });
  }
});

/**
 * POST /api/encrypt-selective
 * Process multiple encryption targets with detailed reporting
 */
router.post('/encrypt-selective', async (req, res) => {
  try {
    const { targets, passphrase, options = {} } = req.body;
    
    if (!targets || !Array.isArray(targets) || !passphrase) {
      return res.status(400).json({
        error: "Missing required fields: targets (array), passphrase"
      });
    }

    // Validate targets structure
    for (const target of targets) {
      if (!target.type || !target.intent) {
        return res.status(400).json({
          error: "Invalid target structure. Required: type, intent"
        });
      }
    }

    const results = await Carmilla.processTargets(targets, passphrase, options);
    
    res.json({
      success: true,
      results,
      summary: {
        total: results.length,
        encrypted: results.filter(r => r.status === "encrypted").length,
        failed: results.filter(r => r.status === "encryption failed").length,
        skipped: results.filter(r => r.status === "skipped").length,
        cannot_encrypt: results.filter(r => r.status === "cannot encrypt").length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: "Selective encryption failed",
      message: error.message
    });
  }
});

/**
 * POST /api/repack
 * Package encrypted data with metadata
 */
router.post('/repack', async (req, res) => {
  try {
    const { encrypted, options = {} } = req.body;
    
    if (!encrypted) {
      return res.status(400).json({
        error: "Missing required field: encrypted"
      });
    }

    const packaged = Carmilla.repack(encrypted, options);
    
    res.json({
      success: true,
      packaged,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: "Repack failed",
      message: error.message
    });
  }
});

/**
 * POST /api/unpack
 * Unpackage encrypted data and metadata
 */
router.post('/unpack', async (req, res) => {
  try {
    const { packaged } = req.body;
    
    if (!packaged) {
      return res.status(400).json({
        error: "Missing required field: packaged"
      });
    }

    const unpacked = Carmilla.unpack(packaged);
    
    res.json({
      success: true,
      unpacked,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: "Unpack failed",
      message: error.message
    });
  }
});

/**
 * POST /api/patch/scan
 * Scan file for Car(); markers
 */
router.post('/patch/scan', async (req, res) => {
  try {
    const { filePath } = req.body;
    
    if (!filePath) {
      return res.status(400).json({
        error: "Missing required field: filePath"
      });
    }

    const scanResult = await CarPatcher.scanMarkers(filePath);
    
    res.json({
      success: true,
      ...scanResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: "Scan failed",
      message: error.message
    });
  }
});

/**
 * POST /api/patch/apply
 * Apply patches to file with Car(); markers
 */
router.post('/patch/apply', async (req, res) => {
  try {
    const { filePath, config, context = {} } = req.body;
    
    if (!filePath || !config) {
      return res.status(400).json({
        error: "Missing required fields: filePath, config"
      });
    }

    const patchResult = await CarPatcher.runWithPatches(filePath, config, context);
    
    res.json({
      success: true,
      ...patchResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: "Patch application failed",
      message: error.message
    });
  }
});

/**
 * POST /api/patch/batch
 * Batch process multiple files with patches
 */
router.post('/patch/batch', async (req, res) => {
  try {
    const { filePaths, config, context = {} } = req.body;
    
    if (!filePaths || !Array.isArray(filePaths) || !config) {
      return res.status(400).json({
        error: "Missing required fields: filePaths (array), config"
      });
    }

    const batchResults = await CarPatcher.batchProcess(filePaths, config, context);
    
    // Convert Map to Object for JSON serialization
    const results: Record<string, any> = {};
    batchResults.forEach((value, key) => {
      results[key] = value;
    });
    
    res.json({
      success: true,
      results,
      summary: {
        total: filePaths.length,
        successful: Array.from(batchResults.values()).filter(r => !r.errors || r.errors.length === 0).length,
        failed: Array.from(batchResults.values()).filter(r => r.errors && r.errors.length > 0).length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: "Batch patch processing failed",
      message: error.message
    });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    status: "healthy",
    service: "Carmilla Encryption API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    features: [
      "encrypt",
      "decrypt", 
      "encrypt-and-pack",
      "unpack-and-decrypt",
      "encrypt-selective",
      "repack",
      "unpack",
      "patch/scan",
      "patch/apply",
      "patch/batch"
    ]
  });
});

export default router;