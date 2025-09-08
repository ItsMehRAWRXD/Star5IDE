const express = require('express');
const crypto = require('crypto');
const zlib = require('zlib');
const router = express.Router();
const { logger } = require('../utils/logger');
const { 
  generateSecureKey, 
  hashData, 
  encryptData, 
  decryptData,
  formatResponse,
  handleError,
  generateUUID
} = require('../utils/helpers');

// Import encryption engines (lazy loading)
const CamelliaAssemblyEngine = require('../engines/camellia-assembly');
const DualCryptoEngine = require('../engines/dual-crypto-engine');

// Initialize engines lazily
let camelliaEngine = null;
let dualCryptoEngine = null;

// Helper functions for lazy engine loading
async function getCamelliaEngine() {
  if (!camelliaEngine) {
    console.log('🔄 Loading Camellia engine on demand...');
    camelliaEngine = new CamelliaAssemblyEngine();
    await camelliaEngine.initialize();
    console.log('✅ Camellia engine loaded successfully');
  }
  return camelliaEngine;
}

async function getDualCryptoEngine() {
  if (!dualCryptoEngine) {
    console.log('🔄 Loading Dual Crypto engine on demand...');
    dualCryptoEngine = new DualCryptoEngine();
    await dualCryptoEngine.initialize();
    console.log('✅ Dual Crypto engine loaded successfully');
  }
  return dualCryptoEngine;
}

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Crypto routes are working!', timestamp: new Date().toISOString() });
});

// Dual Encryption Engine endpoint
router.post('/dual-encrypt', async (req, res) => {
  const requestId = generateUUID();
  try {
    console.log('Dual encryption endpoint called');
    console.log('Request body:', req.body);
    
    const {
      data,
      algorithm = 'aes-camellia-dual',
      key = null,
      iv = null,
      dataType = 'text',
      targetExtension = '.enc',
      stubFormat = 'csharp',
      convertStub = false,
      sourceFormat = 'csharp',
      targetFormat = 'exe',
      crossCompile = false,
      fileType = 'exe'
    } = req.body;

    if (!data) {
      return res.status(400).json(formatResponse(false, null, 'Data is required', 400));
    }

    console.log('Getting dual crypto engine...');
    const dualEngine = await getDualCryptoEngine();
    
    console.log('Performing dual encryption...');
    const result = await dualEngine.encrypt(data, {
      algorithm,
      key,
      iv,
      dataType,
      targetExtension,
      stubFormat,
      convertStub,
      sourceFormat,
      targetFormat,
      crossCompile,
      fileType
    });

    logger.info('Dual encryption completed', {
      requestId,
      algorithm,
      dataLength: data.length,
      fileType,
      stubFormat
    });

    res.json(formatResponse(true, result, 'Dual encryption completed successfully'));

  } catch (error) {
    console.error('Dual encryption error:', error);
    logger.error('Dual encryption failed', {
      requestId,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json(formatResponse(false, null, `Dual encryption failed: ${error.message}`, 500));
  }
});

// Camellia Assembly Engine endpoint
router.post('/camellia-encrypt', async (req, res) => {
  const requestId = generateUUID();
  try {
    console.log('Camellia encryption endpoint called');
    console.log('Request body:', req.body);
    
    const {
      data,
      algorithm = 'camellia-256-cbc',
      key = null,
      iv = null,
      dataType = 'text',
      targetExtension = '.enc',
      stubFormat = 'csharp',
      convertStub = false,
      sourceFormat = 'csharp',
      targetFormat = 'exe',
      crossCompile = false,
      fileType = 'exe'
    } = req.body;

    if (!data) {
      return res.status(400).json(formatResponse(false, null, 'Data is required', 400));
    }

    console.log('Getting Camellia engine...');
    const camellia = await getCamelliaEngine();
    
    console.log('Performing Camellia encryption...');
    const result = await camellia.encrypt(data, {
      algorithm,
      key,
      iv,
      dataType,
      targetExtension,
      stubFormat,
      convertStub,
      sourceFormat,
      targetFormat,
      crossCompile,
      fileType
    });

    logger.info('Camellia encryption completed', {
      requestId,
      algorithm,
      dataLength: data.length,
      fileType,
      stubFormat
    });

    res.json(formatResponse(true, result, 'Camellia encryption completed successfully'));

  } catch (error) {
    console.error('Camellia encryption error:', error);
    logger.error('Camellia encryption failed', {
      requestId,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json(formatResponse(false, null, `Camellia encryption failed: ${error.message}`, 500));
  }
});

// Hot patch generator endpoint
router.post('/hot-patch', async (req, res) => {
  const requestId = generateUUID();
  try {
    const { generatorName, newGenerator } = req.body;

    if (!generatorName || !newGenerator) {
      return res.status(400).json(formatResponse(false, null, 'Generator name and new generator are required', 400));
    }

    console.log(`Hot patching generator: ${generatorName}`);
    const dualEngine = await getDualCryptoEngine();
    await dualEngine.hotPatchGenerator(generatorName, newGenerator);

    logger.info('Generator hot patched', {
      requestId,
      generatorName
    });

    res.json(formatResponse(true, { generatorName }, 'Generator hot patched successfully'));

  } catch (error) {
    console.error('Hot patch error:', error);
    logger.error('Hot patch failed', {
      requestId,
      error: error.message
    });
    res.status(500).json(formatResponse(false, null, `Hot patch failed: ${error.message}`, 500));
  }
});

// Rollback generator endpoint
router.post('/rollback', async (req, res) => {
  const requestId = generateUUID();
  try {
    const { generatorName } = req.body;

    if (!generatorName) {
      return res.status(400).json(formatResponse(false, null, 'Generator name is required', 400));
    }

    console.log(`Rolling back generator: ${generatorName}`);
    const dualEngine = await getDualCryptoEngine();
    await dualEngine.rollbackGenerator(generatorName);

    logger.info('Generator rolled back', {
      requestId,
      generatorName
    });

    res.json(formatResponse(true, { generatorName }, 'Generator rolled back successfully'));

  } catch (error) {
    console.error('Rollback error:', error);
    logger.error('Rollback failed', {
      requestId,
      error: error.message
    });
    res.status(500).json(formatResponse(false, null, `Rollback failed: ${error.message}`, 500));
  }
});

// Text Encryption
router.post('/encrypt', (req, res) => {
  const requestId = generateUUID();
  try {
    console.log('Crypto encrypt endpoint called');
    console.log('Request body:', req.body);
    const { text, algorithm = 'aes-256-cbc', key } = req.body;
    
    if (!text) {
      return res.status(400).json(formatResponse(false, null, 'Text is required', 400));
    }
    
    console.log('Generating secret key...');
    const secretKey = key || generateSecureKey(32);
    console.log('Secret key generated:', secretKey);
    
    console.log('Encrypting data...');
    const { encrypted, iv } = encryptData(text, secretKey);
    console.log('Encryption completed');
    
    logger.info('Text encryption completed', {
      requestId,
      algorithm,
      textLength: text.length,
      hasCustomKey: !!key
    });
    
    res.json(formatResponse(true, {
      encrypted,
      key: secretKey,
      iv,
      algorithm,
      requestId
    }, 'Text encrypted successfully'));
  } catch (error) {
    console.error('Crypto encrypt error:', error);
    logger.error('Encryption error', { requestId, error: error.message });
    res.status(400).json(formatResponse(false, null, error.message, 400));
  }
});

// Text Decryption
router.post('/decrypt', (req, res) => {
  try {
    const { encrypted, algorithm = 'aes-256-cbc', key } = req.body;
    
    const decipher = crypto.createDecipher(algorithm, key);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    res.json({
      success: true,
      decrypted,
      algorithm
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// File Compression
router.post('/compress', (req, res) => {
  try {
    const { data, method = 'gzip' } = req.body;
    
    const buffer = Buffer.from(data, 'utf8');
    
    if (method === 'gzip') {
      zlib.gzip(buffer, (err, compressed) => {
        if (err) throw err;
        res.json({
          success: true,
          compressed: compressed.toString('base64'),
          originalSize: buffer.length,
          compressedSize: compressed.length,
          ratio: ((1 - compressed.length / buffer.length) * 100).toFixed(2) + '%'
        });
      });
    } else {
      zlib.deflate(buffer, (err, compressed) => {
        if (err) throw err;
        res.json({
          success: true,
          compressed: compressed.toString('base64'),
          originalSize: buffer.length,
          compressedSize: compressed.length,
          ratio: ((1 - compressed.length / buffer.length) * 100).toFixed(2) + '%'
        });
      });
    }
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Hash Generation
router.post('/hash', (req, res) => {
  try {
    const { text, algorithm = 'sha256' } = req.body;
    
    const hash = crypto.createHash(algorithm).update(text).digest('hex');
    
    res.json({
      success: true,
      hash,
      algorithm,
      length: hash.length
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Random Key Generation
router.post('/generate-key', (req, res) => {
  try {
    const { length = 32, format = 'hex' } = req.body;
    
    const key = crypto.randomBytes(length);
    
    res.json({
      success: true,
      key: key.toString(format),
      length,
      format
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// RawrZ Engine Encryption Endpoint
router.post('/rawrz/encrypt', (req, res) => {
  const requestId = generateUUID();
  try {
    const { 
      method = 'AES_256_CBC', 
      template = 'csharp',
      antiAnalysis = false,
      polymorphic = false,
      memoryOnly = false,
      selfDelete = false
    } = req.body;
    
    // Generate RawrZ-specific encryption key
    const rawrzKey = generateSecureKey(64); // 512-bit key for RawrZ
    const sessionId = generateUUID();
    
    // Simulate RawrZ encryption process
    const encryptionResult = {
      method,
      template,
      features: {
        antiAnalysis,
        polymorphic,
        memoryOnly,
        selfDelete
      },
      key: rawrzKey,
      sessionId,
      requestId,
      timestamp: new Date().toISOString()
    };
    
    logger.info('RawrZ encryption initiated', {
      requestId,
      sessionId,
      method,
      template,
      features: encryptionResult.features
    });
    
    res.json(formatResponse(true, {
      ...encryptionResult,
      stubUrl: `/api/crypto/rawrz/stub/${sessionId}`,
      downloadUrl: `/api/crypto/rawrz/download/${sessionId}`
    }, 'RawrZ encryption completed successfully'));
    
  } catch (error) {
    logger.error('RawrZ encryption error', { requestId, error: error.message });
    res.status(400).json(formatResponse(false, null, error.message, 400));
  }
});

// RawrZ Stub Generation
router.get('/rawrz/stub/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  
  try {
    // Generate C# stub code based on session parameters
    const stubCode = generateRawrZStub(sessionId);
    
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="rawrz_stub_${sessionId}.cs"`);
    res.send(stubCode);
    
  } catch (error) {
    logger.error('RawrZ stub generation error', { sessionId, error: error.message });
    res.status(400).json(formatResponse(false, null, error.message, 400));
  }
});

// Stub Conversion Endpoint
router.post('/convert-stub', async (req, res) => {
  const requestId = generateUUID();
  try {
    const { 
      sourceFormat = 'csharp',
      targetFormat = 'exe',
      crossCompile = false,
      algorithm = 'aes-256-gcm',
      key,
      iv,
      authTag
    } = req.body;
    
    const advancedCrypto = require('../engines/advanced-crypto');
    
    const conversion = await advancedCrypto.generateStubConversion({
      sourceFormat,
      targetFormat,
      crossCompile,
      algorithm,
      key: key || generateSecureKey(32),
      iv: iv || generateSecureKey(16),
      authTag
    });
    
    logger.info('Stub conversion completed', {
      requestId,
      sourceFormat,
      targetFormat,
      crossCompile
    });
    
    res.json(formatResponse(true, conversion, 'Stub conversion completed successfully'));
    
  } catch (error) {
    logger.error('Stub conversion error', { requestId, error: error.message });
    res.status(400).json(formatResponse(false, null, error.message, 400));
  }
});

// Extension Change Endpoint
router.post('/change-extension', (req, res) => {
  const requestId = generateUUID();
  try {
    const { 
      targetExtension,
      preserveOriginal = false,
      platform = process.platform
    } = req.body;
    
    if (!targetExtension) {
      return res.status(400).json(formatResponse(false, null, 'Target extension is required', 400));
    }
    
    const advancedCrypto = require('../engines/advanced-crypto');
    
    const instructions = advancedCrypto.generateExtensionChangeInstructions(targetExtension, preserveOriginal);
    
    logger.info('Extension change instructions generated', {
      requestId,
      targetExtension,
      preserveOriginal,
      platform
    });
    
    res.json(formatResponse(true, instructions, 'Extension change instructions generated successfully'));
    
  } catch (error) {
    logger.error('Extension change error', { requestId, error: error.message });
    res.status(400).json(formatResponse(false, null, error.message, 400));
  }
});

// Compiler Detection Endpoint
router.get('/compilers', async (req, res) => {
  const requestId = generateUUID();
  try {
    const advancedCrypto = require('../engines/advanced-crypto');
    
    // Re-detect compilers
    await advancedCrypto.detectCompilers();
    
    const compilerInfo = {
      detected: advancedCrypto.compilerPaths,
      supported: advancedCrypto.supportedFormats,
      platform: process.platform,
      architecture: process.arch
    };
    
    logger.info('Compiler detection completed', {
      requestId,
      detected: compilerInfo.detected
    });
    
    res.json(formatResponse(true, compilerInfo, 'Compiler detection completed successfully'));
    
  } catch (error) {
    logger.error('Compiler detection error', { requestId, error: error.message });
    res.status(400).json(formatResponse(false, null, error.message, 400));
  }
});

// Helper function to generate RawrZ stub
function generateRawrZStub(sessionId) {
  return `using System;
using System.Security.Cryptography;
using System.Text;

namespace RawrZEngine
{
    public class RawrZStub
    {
        private static readonly string SESSION_ID = "${sessionId}";
        private static readonly string ENCRYPTION_KEY = "${generateSecureKey(32)}";
        
        public static void Main()
        {
            Console.WriteLine("RawrZ Engine Stub - Session: " + SESSION_ID);
            
            // Anti-analysis checks
            if (IsDebuggerPresent() || IsVirtualMachine())
            {
                Environment.Exit(1);
            }
            
            // Execute encrypted payload
            ExecutePayload();
        }
        
        private static bool IsDebuggerPresent()
        {
            return System.Diagnostics.Debugger.IsAttached;
        }
        
        private static bool IsVirtualMachine()
        {
            // VM detection logic
            return false;
        }
        
        private static void ExecutePayload()
        {
            // Payload execution logic
            Console.WriteLine("RawrZ payload executed successfully");
        }
    }
}`;
}

module.exports = router;