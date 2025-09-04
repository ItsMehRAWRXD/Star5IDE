# 📚 API Reference

## 🔐 Encryption API

### POST /api/encryption/encrypt

Encrypt data using Carmilla OpenSSL encryption.

**Request Body:**
```json
{
  "data": "Hello, World!",
  "passphrase": "mySecretKey",
  "meta": {
    "user_id": "john",
    "project": "demo"
  }
}
```

**Response:**
```json
{
  "success": true,
  "packaged": "base64-encoded-package",
  "meta": {
    "method": "openssl",
    "timestamp": "2025-01-09T...",
    "user_id": "john",
    "project": "demo"
  }
}
```

### POST /api/encryption/decrypt

Decrypt Carmilla-encrypted data.

**Request Body:**
```json
{
  "packaged": "base64-encoded-package",
  "passphrase": "mySecretKey"
}
```

**Response:**
```json
{
  "success": true,
  "data": "Hello, World!",
  "meta": {
    "method": "openssl",
    "timestamp": "2025-01-09T...",
    "user_id": "john"
  }
}
```

### POST /api/encryption/encrypt-selective

Encrypt specific areas/sections of data.

**Request Body:**
```json
{
  "targets": [
    {
      "type": "text",
      "key": "secret1",
      "data": "Confidential information",
      "intent": "encrypt"
    },
    {
      "type": "text", 
      "key": "public1",
      "data": "Public information",
      "intent": "do-not-encrypt"
    }
  ],
  "passphrase": "mySecretKey",
  "meta": {
    "batch_id": "batch-123"
  }
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "type": "text",
      "key": "secret1",
      "intent": "encrypt",
      "status": "encrypted",
      "packaged": "base64-encoded-package",
      "meta": {
        "method": "openssl",
        "timestamp": "2025-01-09T..."
      }
    },
    {
      "type": "text",
      "key": "public1", 
      "intent": "do-not-encrypt",
      "status": "skipped",
      "reason": "user marked as do-not-encrypt",
      "meta": {
        "timestamp": "2025-01-09T..."
      }
    }
  ],
  "summary": {
    "total": 2,
    "encrypted": 1,
    "failed": 0,
    "skipped": 1,
    "cannotEncrypt": 0
  }
}
```

### POST /api/encryption/inspect

Inspect package metadata without decrypting.

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
  "meta": {
    "method": "openssl",
    "chain": ["openssl"],
    "timestamp": "2025-01-09T...",
    "fake_calls": ["openssl enc -aes-128-ecb..."]
  },
  "hasData": true,
  "dataLength": 1024
}
```

## ⚡ Patch API

### POST /api/patch/find-markers

Find Car(); markers in source code.

**Request Body:**
```json
{
  "sourceCode": "function demo() {\n  console.log('start');\n  Car();\n  console.log('end');\n}"
}
```

**Response:**
```json
{
  "success": true,
  "markers": [
    {
      "line": 3,
      "column": 2,
      "originalLine": "  Car();"
    }
  ],
  "count": 1
}
```

### POST /api/patch/apply-patches

Apply patches to source code (preview only).

**Request Body:**
```json
{
  "sourceCode": "function demo() {\n  Car();\n}",
  "patches": [
    "console.log('Patch injected!');"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "originalCode": "function demo() {\n  Car();\n}",
    "patchedCode": "function demo() {\n  console.log('Patch injected!');\n}",
    "patchPoints": [...],
    "patches": [...]
  }
}
```

### POST /api/patch/execute-patched

Execute patched code in isolated VM.

**Request Body:**
```json
{
  "sourceCode": "function demo() {\n  Car();\n  return 42;\n}\ndemo();",
  "patches": [
    "console.log('Executing patch!');"
  ],
  "context": {
    "customVar": "Hello!"
  }
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "originalCode": "...",
    "patchedCode": "...",
    "patchPoints": [...],
    "patches": [...],
    "executionResult": 42,
    "error": null
  }
}
```

### POST /api/patch/generate-patches

Generate random patches for testing.

**Request Body:**
```json
{
  "count": 3
}
```

**Response:**
```json
{
  "success": true,
  "patches": [
    "console.log('🚗 Patch injected at runtime!');",
    "const patchId = 'abc123';",
    "console.log('Dynamic patch execution:', new Date().toISOString());"
  ],
  "count": 3
}
```

## 📋 Todo API

### GET /api/todos

Get all todos.

**Response:**
```json
{
  "success": true,
  "todos": [
    {
      "id": 1,
      "text": "[ENCRYPTED]",
      "completed": false,
      "encrypted": true,
      "created_at": "2025-01-09T...",
      "updated_at": "2025-01-09T..."
    }
  ]
}
```

### POST /api/todos

Create a new todo.

**Request Body:**
```json
{
  "text": "Buy groceries",
  "encrypt": true,
  "passphrase": "mySecret"
}
```

**Response:**
```json
{
  "success": true,
  "todo": {
    "id": 2,
    "text": "[ENCRYPTED]",
    "completed": false,
    "encrypted": true,
    "created_at": "2025-01-09T...",
    "updated_at": "2025-01-09T..."
  }
}
```

### PUT /api/todos/:id

Update a todo.

**Request Body:**
```json
{
  "text": "Buy organic groceries",
  "completed": true,
  "encrypt": false
}
```

### POST /api/todos/:id/decrypt

Decrypt and view a todo.

**Request Body:**
```json
{
  "passphrase": "mySecret"
}
```

**Response:**
```json
{
  "success": true,
  "todo": {
    "id": 1,
    "text": "Buy groceries",
    "completed": false,
    "encrypted": true,
    "decrypted": true,
    "meta": {
      "method": "openssl",
      "timestamp": "2025-01-09T..."
    },
    "created_at": "2025-01-09T...",
    "updated_at": "2025-01-09T..."
  }
}
```

### DELETE /api/todos/:id

Delete a todo.

**Response:**
```json
{
  "success": true
}
```

### GET /api/todos/stats

Get todo statistics.

**Response:**
```json
{
  "success": true,
  "stats": {
    "total": 5,
    "completed": 2,
    "pending": 3,
    "encrypted": 3,
    "unencrypted": 2
  }
}
```

## 🩺 Health Check

### GET /api/health

Get service health status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-09T...",
  "services": {
    "encryption": "carmilla-openssl",
    "patch": "car-marker-system", 
    "todos": "in-memory-storage"
  }
}
```

## 🚫 Error Responses

All endpoints return error responses in this format:

```json
{
  "success": false,
  "error": "Brief error description",
  "details": "Detailed error message"
}
```

Common HTTP status codes:
- `400` - Bad Request (missing/invalid parameters)
- `404` - Not Found (todo not found)
- `500` - Internal Server Error (encryption/execution failure)

## 🔐 Security Notes

1. **Passphrases** are never stored or logged
2. **Temporary files** are automatically cleaned up
3. **VM execution** is isolated and sandboxed
4. **Dangerous operations** are blocked in patch execution
5. **Timeout protection** prevents infinite loops
6. **Input validation** prevents code injection attacks