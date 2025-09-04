# 🔐 Carmilla Encryption Guide

## Overview

Carmilla is a native OpenSSL encryption system designed for maximum security, transparency, and plug-and-play compatibility. It uses AES-256-CBC with unique salt/IV per operation and includes anti-reverse engineering features.

## Key Features

### 🔒 Security Features
- **AES-256-CBC encryption** with random salt
- **Unique IV per operation** - no pattern leaks
- **Anti-reverse engineering** fake calls
- **Secure temp file handling**
- **No key reuse** - fresh cryptographic material per run

### 🔧 Technical Features
- **Zero npm dependencies** - pure Node.js + OpenSSL
- **Plug-and-play** - works in any Node.js/TypeScript project
- **Metadata packaging** with timestamps and chain info
- **Per-run isolation** - every encryption is unique
- **Transparent reporting** of all operations

## Basic Usage

### Simple Encrypt/Decrypt

```typescript
import { encrypt, decrypt } from './crypto/carmilla-openssl';

// Encrypt data
const encrypted = encrypt("Hello, World!", "myPassphrase");
console.log(encrypted); // Base64 encrypted data

// Decrypt data
const decrypted = decrypt(encrypted, "myPassphrase");
console.log(decrypted); // "Hello, World!"
```

### Async Operations (Recommended)

```typescript
import { encryptAsync, decryptAsync } from './crypto/carmilla-openssl';

async function example() {
  // Non-blocking encryption
  const encrypted = await encryptAsync("Secret data", "password123");
  
  // Non-blocking decryption
  const decrypted = await decryptAsync(encrypted, "password123");
  
  console.log(decrypted); // "Secret data"
}
```

### Package with Metadata

```typescript
import { encryptAsync, repack, unpack, decryptAsync } from './crypto/carmilla-openssl';

async function packageExample() {
  // Encrypt data
  const encrypted = await encryptAsync("Confidential info", "secret");
  
  // Package with metadata
  const packaged = repack(encrypted, "password hint", ["openssl"], {
    user_id: "john",
    project: "demo",
    classification: "confidential"
  });
  
  // Later: unpack and decrypt
  const pack = unpack(packaged);
  console.log(pack.meta); // View metadata
  
  const decrypted = await decryptAsync(pack.data, "secret");
  console.log(decrypted); // "Confidential info"
}
```

### One-Step Operations

```typescript
import { encryptAndRepack, unpackAndDecrypt } from './crypto/carmilla-openssl';

async function oneStepExample() {
  // Encrypt and package in one step
  const packaged = await encryptAndRepack(
    "My secret data",
    "password123",
    "hint: my birthday",
    { user: "alice", type: "personal" }
  );
  
  // Unpack and decrypt in one step
  const { data, meta } = await unpackAndDecrypt(packaged, "password123");
  console.log(data); // "My secret data"
  console.log(meta); // Metadata object
}
```

## Advanced Usage

### Selective Area Encryption

Encrypt only specific parts of your data:

```typescript
// Via API endpoint
const response = await fetch('/api/encryption/encrypt-selective', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    targets: [
      {
        type: 'text',
        key: 'secret_note',
        data: 'This is confidential',
        intent: 'encrypt'
      },
      {
        type: 'text',
        key: 'public_note', 
        data: 'This is public',
        intent: 'do-not-encrypt'
      },
      {
        type: 'text',
        key: 'broken_data',
        data: '', // Empty data
        intent: 'encrypt' // Will fail with clear error
      }
    ],
    passphrase: 'myPassword',
    meta: { batch_id: 'batch-001' }
  })
});

const result = await response.json();
console.log(result.summary); 
// { total: 3, encrypted: 1, failed: 1, skipped: 1 }
```

### Metadata Inspection

Inspect packages without decrypting:

```typescript
import { unpack } from './crypto/carmilla-openssl';

function inspectPackage(packagedData: string) {
  const pack = unpack(packagedData);
  
  console.log('Method:', pack.meta.method); // "openssl"
  console.log('Chain:', pack.meta.chain); // ["openssl"]
  console.log('Timestamp:', pack.meta.timestamp);
  console.log('Custom fields:', pack.meta.user_id, pack.meta.project);
  console.log('Has encrypted data:', !!pack.data);
  console.log('Data length:', pack.data.length);
  
  // Metadata is always readable, even without passphrase
}
```

## Security Best Practices

### 1. Passphrase Management

```typescript
// ✅ Good: Use strong, unique passphrases
const strongPassphrase = generateSecurePassphrase(); // Your implementation

// ❌ Bad: Weak or reused passphrases
const weakPassphrase = "123456";
```

### 2. Error Handling

```typescript
async function secureEncryption(data: string, passphrase: string) {
  try {
    const encrypted = await encryptAsync(data, passphrase);
    return { success: true, encrypted };
  } catch (error) {
    // Log error securely (don't expose passphrase)
    console.error('Encryption failed:', error.message);
    return { success: false, error: 'Encryption failed' };
  }
}
```

### 3. Temporary File Security

Carmilla automatically handles secure cleanup, but you can verify:

```typescript
// Carmilla automatically:
// 1. Uses random filenames with crypto.randomBytes()
// 2. Cleans up temp files in try/finally blocks
// 3. Handles cleanup even on errors
// 4. Never reuses temp files between operations
```

### 4. Per-Run Isolation

```typescript
// Every encryption is unique, even with same data/passphrase
const data = "Same data";
const pass = "Same passphrase";

const encrypted1 = await encryptAsync(data, pass);
const encrypted2 = await encryptAsync(data, pass);

console.log(encrypted1 !== encrypted2); // true - different salt/IV
```

## Metadata Schema

### Standard Fields

```typescript
interface CarmillaMeta {
  method: string;           // "openssl"
  chain?: string[];         // ["openssl"] or ["openssl", "custom"]
  passphrase_hint?: string; // Optional hint for users
  timestamp: string;        // ISO 8601 timestamp
  fake_calls?: string[];    // Anti-reverse engineering calls
  
  // Custom fields (your application)
  user_id?: string;
  workspace_id?: string; 
  project_id?: string;
  classification?: string;
  [key: string]: any;       // Any additional fields
}
```

### Example Metadata

```json
{
  "method": "openssl",
  "chain": ["openssl"],
  "passphrase_hint": "your birthday",
  "timestamp": "2025-01-09T12:34:56.789Z",
  "fake_calls": [
    "openssl enc -aes-128-ecb -nosalt -k \"fake1\"",
    "openssl dgst -sha1"
  ],
  "user_id": "alice",
  "project": "secret-project",
  "classification": "confidential",
  "batch_id": "batch-001"
}
```

## Error Handling

### Common Error Types

1. **Encryption Errors**
   - Invalid passphrase characters
   - OpenSSL not available
   - Temp file permission issues

2. **Decryption Errors**
   - Wrong passphrase
   - Corrupted data
   - Invalid package format

3. **Package Errors**
   - Invalid base64 encoding
   - Missing metadata
   - Malformed JSON

### Error Response Format

```typescript
// All errors follow this pattern
interface CarmillaError extends Error {
  message: string; // Human-readable error
  cause?: string;  // Technical details (if available)
}

// Example usage
try {
  const result = await encryptAsync(data, passphrase);
} catch (error) {
  if (error.message.includes('OpenSSL')) {
    console.error('OpenSSL not available:', error.message);
  } else if (error.message.includes('passphrase')) {
    console.error('Passphrase issue:', error.message);
  } else {
    console.error('Unknown encryption error:', error.message);
  }
}
```

## Performance Considerations

### File Size Limits

- **Small data** (< 1KB): Excellent performance
- **Medium data** (1KB - 1MB): Good performance  
- **Large data** (> 1MB): Consider streaming for very large files

### Concurrent Operations

```typescript
// Carmilla supports concurrent operations safely
const promises = [
  encryptAsync("Data 1", "pass1"),
  encryptAsync("Data 2", "pass2"), 
  encryptAsync("Data 3", "pass3")
];

const results = await Promise.all(promises);
// Each operation uses isolated temp files and crypto material
```

### Memory Usage

- **Sync operations**: Keep entire data in memory
- **Async operations**: Better for large data sets
- **Temp files**: Automatically cleaned up
- **No caching**: Each operation is isolated

## Integration Examples

### Express.js Middleware

```typescript
import express from 'express';
import { encryptAsync, decryptAsync } from './crypto/carmilla-openssl';

const app = express();

app.use('/api/secure', async (req, res, next) => {
  try {
    // Encrypt request body
    req.encryptedBody = await encryptAsync(
      JSON.stringify(req.body),
      req.headers['x-passphrase']
    );
    next();
  } catch (error) {
    res.status(400).json({ error: 'Encryption failed' });
  }
});
```

### Database Integration

```typescript
import { encryptAndRepack, unpackAndDecrypt } from './crypto/carmilla-openssl';

class SecureUserService {
  async saveUser(userData: any, passphrase: string) {
    // Encrypt sensitive data before saving
    const encryptedData = await encryptAndRepack(
      JSON.stringify(userData),
      passphrase,
      'user-data',
      { user_id: userData.id, type: 'profile' }
    );
    
    return db.users.create({ 
      id: userData.id,
      encrypted_data: encryptedData 
    });
  }
  
  async getUser(userId: string, passphrase: string) {
    const user = await db.users.findById(userId);
    const { data } = await unpackAndDecrypt(user.encrypted_data, passphrase);
    return JSON.parse(data);
  }
}
```

## Troubleshooting

### OpenSSL Not Found

```bash
# Linux/Ubuntu
sudo apt-get install openssl

# macOS (usually pre-installed)
brew install openssl

# Windows
# Download from https://slproweb.com/products/Win32OpenSSL.html
```

### Permission Issues

```typescript
// Ensure write permissions for temp files
import fs from 'fs';
import path from 'path';

const tempDir = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { mode: 0o755 });
}
```

### Memory Issues with Large Files

```typescript
// For very large files, consider chunking
async function encryptLargeFile(filePath: string, passphrase: string) {
  const chunkSize = 1024 * 1024; // 1MB chunks
  // Implementation depends on your specific needs
}
```