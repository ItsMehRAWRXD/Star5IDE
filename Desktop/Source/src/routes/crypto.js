const express = require('express');
const crypto = require('crypto');
const zlib = require('zlib');
const router = express.Router();
const { logger, securityLogger } = require('../utils/logger');
const { 
  generateSecureKey, 
  hashData, 
  encryptData, 
  decryptData,
  formatResponse,
  handleError,
  generateUUID
} = require('../utils/helpers');

// Text Encryption
router.post('/encrypt', (req, res) => {
  const requestId = generateUUID();
  try {
    const { text, algorithm = 'aes-256-cbc', key } = req.body;
    
    if (!text) {
      return res.status(400).json(formatResponse(false, null, 'Text is required', 400));
    }
    
    const secretKey = key || generateSecureKey(32);
    const { encrypted, iv } = encryptData(text, secretKey);
    
    securityLogger.info('Text encryption completed', {
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
    
    securityLogger.info('RawrZ encryption initiated', {
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