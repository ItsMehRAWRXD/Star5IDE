# Carmilla Encryption API Reference

## Overview

The Carmilla Encryption API provides comprehensive encryption, decryption, and patching capabilities through REST endpoints. All operations are explicit and require manual invocation - no automatic execution.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Currently no authentication required. For production use, implement proper authentication middleware.

## Request/Response Format

All requests and responses use JSON format with the following structure:

### Success Response
```json
{
  "success": true,
  "data": "...",
  "timestamp": "2025-01-04T21:22:48.000Z"
}
```

### Error Response
```json
{
  "error": "Error description",
  "message": "Detailed error message",
  "timestamp": "2025-01-04T21:22:48.000Z"
}
```

## Encryption Endpoints

### POST /encrypt

Encrypt a single data string using OpenSSL AES-256-CBC.

**Request Body:**
```json
{
  "data": "string to encrypt",
  "passphrase": "encryption passphrase"
}
```

**Response:**
```json
{
  "success": true,
  "encrypted": "base64-encoded-encrypted-data",
  "timestamp": "2025-01-04T21:22:48.000Z"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/encrypt \
  -H "Content-Type: application/json" \
  -d '{"data": "sensitive data", "passphrase": "my-secret"}'
```

### POST /decrypt

Decrypt a single encrypted string.

**Request Body:**
```json
{
  "encrypted": "base64-encoded-encrypted-data",
  "passphrase": "encryption passphrase"
}
```

**Response:**
```json
{
  "success": true,
  "decrypted": "original data",
  "timestamp": "2025-01-04T21:22:48.000Z"
}
```

### POST /encrypt-and-pack

Encrypt data and package with metadata in one operation.

**Request Body:**
```json
{
  "data": "string to encrypt",
  "passphrase": "encryption passphrase",
  "options": {
    "passphrase_hint": "optional hint",
    "chain": ["openssl", "argon2"],
    "custom_field": "value"
  }
}
```

**Response:**
```json
{
  "success": true,
  "packaged": "base64-encoded-package",
  "timestamp": "2025-01-04T21:22:48.000Z"
}
```

### POST /unpack-and-decrypt

Unpack and decrypt in one operation.

**Request Body:**
```json
{
  "packaged": "base64-encoded-package",
  "passphrase": "encryption passphrase"
}
```

**Response:**
```json
{
  "success": true,
  "decrypted": "original data",
  "timestamp": "2025-01-04T21:22:48.000Z"
}
```

### POST /encrypt-selective

Process multiple encryption targets with detailed reporting.

**Request Body:**
```json
{
  "targets": [
    {
      "type": "file",
      "path": "/path/to/file.txt",
      "intent": "encrypt"
    },
    {
      "type": "obj",
      "key": "secretData",
      "data": "sensitive information",
      "intent": "encrypt"
    },
    {
      "type": "file",
      "path": "/path/to/public.txt",
      "intent": "do-not-encrypt"
    }
  ],
  "passphrase": "encryption passphrase",
  "options": {
    "timestamp": "2025-01-04T21:22:48.000Z",
    "source": "api"
  }
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "type": "file",
      "path": "/path/to/file.txt",
      "intent": "encrypt",
      "status": "encrypted",
      "packaged": "base64-encoded-package",
      "meta": {
        "method": "openssl",
        "timestamp": "2025-01-04T21:22:48.000Z"
      }
    },
    {
      "type": "obj",
      "key": "secretData",
      "intent": "encrypt",
      "status": "encrypted",
      "packaged": "base64-encoded-package",
      "meta": {
        "method": "openssl",
        "timestamp": "2025-01-04T21:22:48.000Z"
      }
    },
    {
      "type": "file",
      "path": "/path/to/public.txt",
      "intent": "do-not-encrypt",
      "status": "skipped",
      "reason": "user marked as do-not-encrypt"
    }
  ],
  "summary": {
    "total": 3,
    "encrypted": 2,
    "failed": 0,
    "skipped": 1,
    "cannot_encrypt": 0
  },
  "timestamp": "2025-01-04T21:22:48.000Z"
}
```

### POST /repack

Package encrypted data with metadata.

**Request Body:**
```json
{
  "encrypted": "base64-encoded-encrypted-data",
  "options": {
    "passphrase_hint": "optional hint",
    "chain": ["openssl"],
    "timestamp": "2025-01-04T21:22:48.000Z"
  }
}
```

**Response:**
```json
{
  "success": true,
  "packaged": "base64-encoded-package",
  "timestamp": "2025-01-04T21:22:48.000Z"
}
```

### POST /unpack

Unpackage encrypted data and metadata.

**Request Body:**
```json
{
  "packaged": "base64-encoded-package"
}
```

**Response:**
```json
{
  "success": true,
  "unpacked": {
    "meta": {
      "method": "openssl",
      "chain": ["openssl"],
      "passphrase_hint": "optional hint",
      "timestamp": "2025-01-04T21:22:48.000Z"
    },
    "data": "base64-encoded-encrypted-data"
  },
  "timestamp": "2025-01-04T21:22:48.000Z"
}
```

## Patch System Endpoints

### POST /patch/scan

Scan a file for Car(); markers.

**Request Body:**
```json
{
  "filePath": "/path/to/file.ts"
}
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "locations": [15, 23, 31],
  "timestamp": "2025-01-04T21:22:48.000Z"
}
```

### POST /patch/apply

Apply patches to a file with Car(); markers.

**Request Body:**
```json
{
  "filePath": "/path/to/file.ts",
  "config": {
    "patches": [
      "console.log('Patched!');",
      "const debug = true;"
    ],
    "randomizeOrder": true,
    "addFakePatches": true,
    "preserveOriginal": true
  },
  "context": {
    "window": "undefined",
    "document": "undefined"
  }
}
```

**Response:**
```json
{
  "success": true,
  "originalFile": "original file content...",
  "patchedFile": "patched file content...",
  "patchesApplied": 2,
  "executionResult": "execution output or result",
  "errors": [],
  "timestamp": "2025-01-04T21:22:48.000Z"
}
```

### POST /patch/batch

Batch process multiple files with patches.

**Request Body:**
```json
{
  "filePaths": [
    "/path/to/file1.ts",
    "/path/to/file2.js",
    "/path/to/file3.py"
  ],
  "config": {
    "patches": [
      "console.log('Batch patched!');"
    ],
    "randomizeOrder": false,
    "addFakePatches": true
  },
  "context": {}
}
```

**Response:**
```json
{
  "success": true,
  "results": {
    "/path/to/file1.ts": {
      "originalFile": "content...",
      "patchedFile": "patched content...",
      "patchesApplied": 1,
      "executionResult": "result",
      "errors": []
    },
    "/path/to/file2.js": {
      "originalFile": "content...",
      "patchedFile": "patched content...",
      "patchesApplied": 1,
      "executionResult": "result",
      "errors": []
    }
  },
  "summary": {
    "total": 3,
    "successful": 2,
    "failed": 1
  },
  "timestamp": "2025-01-04T21:22:48.000Z"
}
```

## Health Check

### GET /health

Get service health and feature information.

**Response:**
```json
{
  "status": "healthy",
  "service": "Carmilla Encryption API",
  "version": "1.0.0",
  "timestamp": "2025-01-04T21:22:48.000Z",
  "features": [
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
}
```

## Error Codes

### HTTP Status Codes

- `200` - Success
- `400` - Bad Request (missing required fields, invalid data)
- `500` - Internal Server Error (encryption/decryption failed, system error)

### Common Error Messages

- `"Missing required fields: data, passphrase"` - Required fields not provided
- `"Encryption failed: [details]"` - OpenSSL encryption error
- `"Decryption failed: [details]"` - OpenSSL decryption error
- `"Invalid package structure"` - Malformed packaged data
- `"No Car(); markers found in file"` - No patch markers in file
- `"Execution failed: [details]"` - Patch execution error

## Rate Limiting

Currently no rate limiting implemented. For production use, consider implementing rate limiting middleware.

## File Size Limits

- Maximum request body size: 50MB
- Maximum individual file size: Limited by available memory
- Recommended file size: < 10MB for optimal performance

## Security Notes

1. **Passphrases**: Never log or store passphrases
2. **HTTPS**: Use HTTPS in production environments
3. **Authentication**: Implement proper authentication for production
4. **Input Validation**: All inputs are validated before processing
5. **Temp Files**: All temporary files are automatically cleaned up

## Examples

### Complete Workflow Example

```bash
# 1. Encrypt and package data
curl -X POST http://localhost:3000/api/encrypt-and-pack \
  -H "Content-Type: application/json" \
  -d '{
    "data": "sensitive configuration data",
    "passphrase": "my-secure-passphrase",
    "options": {
      "passphrase_hint": "config-encryption",
      "chain": ["openssl"]
    }
  }'

# 2. Unpack and decrypt data
curl -X POST http://localhost:3000/api/unpack-and-decrypt \
  -H "Content-Type: application/json" \
  -d '{
    "packaged": "base64-encoded-package-from-step-1",
    "passphrase": "my-secure-passphrase"
  }'
```

### Selective Encryption Example

```bash
curl -X POST http://localhost:3000/api/encrypt-selective \
  -H "Content-Type: application/json" \
  -d '{
    "targets": [
      {
        "type": "file",
        "path": "/workspace/config.json",
        "intent": "encrypt"
      },
      {
        "type": "obj",
        "key": "apiKey",
        "data": "sk-1234567890abcdef",
        "intent": "encrypt"
      }
    ],
    "passphrase": "secure-passphrase"
  }'
```

### Patch System Example

```bash
# 1. Scan for Car(); markers
curl -X POST http://localhost:3000/api/patch/scan \
  -H "Content-Type: application/json" \
  -d '{"filePath": "/workspace/main.ts"}'

# 2. Apply patches
curl -X POST http://localhost:3000/api/patch/apply \
  -H "Content-Type: application/json" \
  -d '{
    "filePath": "/workspace/main.ts",
    "config": {
      "patches": [
        "console.log(\"Debug mode enabled\");",
        "const DEBUG = true;"
      ],
      "randomizeOrder": true,
      "addFakePatches": true
    }
  }'
```