const crypto = require('crypto');

exports.handler = async (event, context) => {
  try {
    // Get the path from the event - handle both /api/* and /.netlify/functions/api/*
    let path = event.path;
    if (path.startsWith('/.netlify/functions/api')) {
      path = path.replace('/.netlify/functions/api', '');
    } else if (path.startsWith('/api')) {
      path = path.replace('/api', '');
    }
    
    // Set CORS headers
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, User-Agent, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    };

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: ''
      };
    }

    // Route based on path
    switch (path) {
      case '/health':
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            status: 'OK',
            timestamp: new Date().toISOString(),
            message: '🔐 Encryption Platform is running on Netlify!',
            features: ['AES-256', 'RSA', 'Hash Functions', 'Key Generation'],
            database: 'connected'
          })
        };

      case '/encrypt':
        if (event.httpMethod === 'POST') {
          try {
            const body = JSON.parse(event.body);
            const { text, algorithm = 'aes-256-cbc' } = body;
            
            if (!text) {
              return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Text to encrypt is required' })
              };
            }

            const key = crypto.randomBytes(32);
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipher(algorithm, key, iv);
            
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');

            return {
              statusCode: 200,
              headers,
              body: JSON.stringify({
                encrypted,
                key: key.toString('hex'),
                iv: iv.toString('hex'),
                algorithm,
                message: 'Text encrypted successfully'
              })
            };
          } catch (error) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: 'Encryption failed', details: error.message })
            };
          }
        }
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed. Use POST with text in body.' })
        };

      case '/decrypt':
        if (event.httpMethod === 'POST') {
          try {
            const body = JSON.parse(event.body);
            const { encrypted, key, iv, algorithm = 'aes-256-cbc' } = body;
            
            if (!encrypted || !key || !iv) {
              return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Encrypted text, key, and IV are required' })
              };
            }

            const decipher = crypto.createDecipher(algorithm, Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
            
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            return {
              statusCode: 200,
              headers,
              body: JSON.stringify({
                decrypted: decrypted.trim(),
                message: 'Text decrypted successfully'
              })
            };
          } catch (error) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: 'Decryption failed', details: error.message })
            };
          }
        }
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed. Use POST with encrypted, key, and IV in body.' })
        };

      case '/hash':
        if (event.httpMethod === 'POST') {
          try {
            const body = JSON.parse(event.body);
            const { text, algorithm = 'sha256' } = body;
            
            if (!text) {
              return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Text to hash is required' })
              };
            }

            const hash = crypto.createHash(algorithm).update(text).digest('hex');

            return {
              statusCode: 200,
              headers,
              body: JSON.stringify({
                hash,
                algorithm,
                originalLength: text.length,
                message: 'Text hashed successfully'
              })
            };
          } catch (error) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: 'Hashing failed', details: error.message })
            };
          }
        }
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed. Use POST with text in body.' })
        };

      case '/generate-key':
        if (event.httpMethod === 'POST') {
          try {
            const body = JSON.parse(event.body);
            const { type = 'aes', length = 256 } = body;
            
            let key, publicKey, privateKey;
            
            if (type === 'aes') {
              key = crypto.randomBytes(length / 8);
            } else if (type === 'rsa') {
              const keyPair = crypto.generateKeyPairSync('rsa', {
                modulusLength: length,
                publicKeyEncoding: { type: 'spki', format: 'pem' },
                privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
              });
              publicKey = keyPair.publicKey;
              privateKey = keyPair.privateKey;
            }

            return {
              statusCode: 200,
              headers,
              body: JSON.stringify({
                type,
                length,
                key: key ? key.toString('hex') : undefined,
                publicKey,
                privateKey,
                message: 'Key generated successfully'
              })
            };
          } catch (error) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: 'Key generation failed', details: error.message })
            };
          }
        }
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed. Use POST with type and length in body.' })
        };

      case '':
      case '/':
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            message: '🔐 Encryption Platform API is running on Netlify!',
            version: '1.0.0',
            status: 'active',
            features: {
              encryption: 'POST /encrypt - Encrypt text with AES-256',
              decryption: 'POST /decrypt - Decrypt encrypted text',
              hashing: 'POST /hash - Generate hash of text',
              keyGeneration: 'POST /generate-key - Generate encryption keys'
            },
            endpoints: {
              root: '/',
              health: '/health',
              encrypt: '/encrypt',
              decrypt: '/decrypt',
              hash: '/hash',
              generateKey: '/generate-key'
            },
            documentation: 'Use POST requests with JSON body for encryption operations'
          })
        };

      default:
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            error: 'Endpoint not found',
            availableEndpoints: ['/health', '/encrypt', '/decrypt', '/hash', '/generate-key'],
            message: 'Check the API documentation for available encryption endpoints'
          })
        };
    }
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};
