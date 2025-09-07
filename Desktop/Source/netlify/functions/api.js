const crypto = require('crypto');

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Get the path
  const path = event.path.replace('/.netlify/functions/api', '').replace('/api', '');

  try {
    // Route based on path and method
    if (event.httpMethod === 'GET') {
      if (path === '/health' || path === '/health/') {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            status: 'OK',
            timestamp: new Date().toISOString(),
            message: '🔐 Cryptify API is running!',
            endpoints: ['/health', '/encrypt', '/decrypt', '/hash'],
            crypto: 'Node.js built-in (no OpenSSL required)'
          })
        };
      }
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');

      if (path === '/encrypt' || path === '/encrypt/') {
        const { text, key, iv } = body;

        if (!text) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Text is required' })
          };
        }

        // Generate key and IV if not provided
        const encryptionKey = key || crypto.randomBytes(32).toString('hex');
        const encryptionIV = iv || crypto.randomBytes(16).toString('hex');

        // Use AES-256-CBC (built into Node.js)
        const cipher = crypto.createCipher('aes-256-cbc', encryptionKey);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            encrypted,
            key: encryptionKey,
            iv: encryptionIV,
            algorithm: 'AES-256-CBC',
            message: 'Encryption successful!'
          })
        };
      }

      if (path === '/decrypt' || path === '/decrypt/') {
        const { encrypted, key, iv } = body;

        if (!encrypted || !key) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Encrypted text and key are required' })
          };
        }

        try {
          // Decrypt using AES-256-CBC
          const decipher = crypto.createDecipher('aes-256-cbc', key);
          let decrypted = decipher.update(encrypted, 'hex', 'utf8');
          decrypted += decipher.final('utf8');

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              decrypted,
              algorithm: 'AES-256-CBC',
              message: 'Decryption successful!'
            })
          };
        } catch (error) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              error: 'Decryption failed - invalid key or corrupted data',
              details: error.message
            })
          };
        }
      }

      if (path === '/hash' || path === '/hash/') {
        const { text, algorithm = 'sha256' } = body;

        if (!text) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Text is required' })
          };
        }

        // Generate hash using Node.js built-in crypto
        const hash = crypto.createHash(algorithm).update(text).digest('hex');

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            hash,
            algorithm,
            originalText: text,
            message: 'Hash generated successfully!'
          })
        };
      }
    }

    // Default response for unknown endpoints
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({
        error: 'Endpoint not found',
        availableEndpoints: ['/health', '/encrypt', '/decrypt', '/hash'],
        message: 'Check the API documentation for available endpoints'
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};
