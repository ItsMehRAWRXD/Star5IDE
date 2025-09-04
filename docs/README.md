# Carmilla OpenSSL Encryption System

A comprehensive, plug-and-play encryption system with in-memory patching capabilities, built for Node.js/TypeScript with zero external dependencies.

## Features

- **Native OpenSSL Integration**: Uses system OpenSSL binary via child_process
- **Per-Run Isolation**: Unique salt/IV generation for every encryption operation
- **Selective Encryption**: Point-and-click encryption for specific areas/files
- **Car(); Patch System**: In-memory code injection and patching
- **Anti-Reverse Engineering**: Fake encryption calls to confuse analysis
- **Detailed Reporting**: Comprehensive per-area encryption status reports
- **REST API**: Full HTTP API for web integration
- **Web UI**: React-based interface for configuration

## Quick Start

### Installation

```bash
# No npm dependencies required - just Node.js and OpenSSL
# Ensure OpenSSL is installed on your system
```

### Basic Usage

```typescript
import Carmilla from './src/crypto/carmilla';

// Encrypt data
const encrypted = await Carmilla.encrypt("sensitive data", "my-passphrase");

// Decrypt data
const decrypted = await Carmilla.decrypt(encrypted, "my-passphrase");

// Encrypt and package with metadata
const packaged = await Carmilla.encryptAndPack("data", "passphrase", {
  passphrase_hint: "hint",
  chain: ["openssl", "argon2"]
});

// Unpack and decrypt
const result = await Carmilla.unpackAndDecrypt(packaged, "passphrase");
```

### Car(); Patch System

```typescript
import CarPatcher from './src/patch/carPatcher';

// Place Car(); markers in your code
// main.ts
function myFunction() {
  console.log("Before patch");
  Car();
  console.log("After patch");
}

// Apply patches
const result = await CarPatcher.runWithPatches("main.ts", {
  patches: [
    'console.log("Injected code!");',
    'const dynamic = "runtime value";'
  ],
  randomizeOrder: true,
  addFakePatches: true
});
```

## Architecture

### Core Components

1. **Carmilla Encryption Module** (`src/crypto/carmilla.ts`)
   - Native OpenSSL AES-256-CBC encryption
   - Unique salt/IV per operation
   - Metadata packaging/unpackaging
   - Fake call generation for security

2. **Car(); Patch System** (`src/patch/carPatcher.ts`)
   - In-memory code injection
   - Sandboxed execution
   - Batch processing
   - Anti-reverse engineering

3. **REST API** (`src/api/encryption.ts`)
   - HTTP endpoints for all operations
   - JSON request/response format
   - Error handling and validation

4. **Web UI** (`src/components/EncryptionUI.tsx`)
   - Point-and-click encryption configuration
   - Real-time patch application
   - Results visualization

### Security Features

- **Per-Run Isolation**: Every encryption uses unique salt/IV
- **No Fallback**: Failed encryption returns error, no substitution
- **Fake Calls**: Random fake encryption operations to confuse analysis
- **Explicit API**: No automatic execution, all operations are explicit
- **Sandboxed Execution**: Patch system runs in isolated context

## API Reference

### Encryption Endpoints

- `POST /api/encrypt` - Encrypt single data string
- `POST /api/decrypt` - Decrypt single encrypted string
- `POST /api/encrypt-and-pack` - Encrypt and package with metadata
- `POST /api/unpack-and-decrypt` - Unpack and decrypt in one operation
- `POST /api/encrypt-selective` - Process multiple targets with reporting
- `POST /api/repack` - Package encrypted data with metadata
- `POST /api/unpack` - Unpackage encrypted data and metadata

### Patch Endpoints

- `POST /api/patch/scan` - Scan file for Car(); markers
- `POST /api/patch/apply` - Apply patches to file
- `POST /api/patch/batch` - Batch process multiple files

### Health Check

- `GET /api/health` - Service health and feature list

## Usage Examples

### Selective Encryption

```typescript
const targets = [
  {
    type: "file",
    path: "/workspace/config.json",
    intent: "encrypt"
  },
  {
    type: "obj",
    key: "secretData",
    data: "sensitive information",
    intent: "encrypt"
  },
  {
    type: "file",
    path: "/workspace/public.txt",
    intent: "do-not-encrypt"
  }
];

const results = await Carmilla.processTargets(targets, "passphrase");
// Returns detailed per-area status report
```

### Batch Patching

```typescript
const filePaths = ["file1.ts", "file2.js", "file3.py"];
const config = {
  patches: [
    'console.log("Debug info");',
    'const debug = true;'
  ],
  randomizeOrder: true,
  addFakePatches: true
};

const results = await CarPatcher.batchProcess(filePaths, config);
```

### Web Integration

```typescript
// Frontend usage
const response = await fetch('/api/encrypt-selective', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    targets: [
      { type: "file", path: "/data/secret.txt", intent: "encrypt" }
    ],
    passphrase: "user-passphrase"
  })
});

const data = await response.json();
console.log(data.results); // Detailed encryption report
```

## Configuration

### Environment Variables

- `DO_API_TOKEN` - DigitalOcean API token (for cloud features)
- `NODE_ENV` - Environment (development/production)

### OpenSSL Requirements

- OpenSSL must be installed and accessible via command line
- Supports AES-256-CBC encryption
- Automatic salt generation enabled

## Security Considerations

1. **Passphrase Management**: Never store passphrases in code or logs
2. **Temp Files**: All temporary files are automatically cleaned up
3. **Memory**: No sensitive data persisted in memory after operations
4. **Network**: Use HTTPS for API endpoints in production
5. **Access Control**: Implement proper authentication for web UI

## Troubleshooting

### Common Issues

1. **OpenSSL Not Found**
   ```bash
   # Install OpenSSL
   # Ubuntu/Debian: sudo apt-get install openssl
   # macOS: brew install openssl
   # Windows: Download from OpenSSL website
   ```

2. **Permission Errors**
   ```bash
   # Ensure write permissions for temp directory
   chmod 755 /tmp
   ```

3. **Memory Issues**
   ```bash
   # For large files, consider streaming or chunking
   # The system handles files up to 50MB by default
   ```

### Debug Mode

```typescript
// Enable detailed logging
process.env.DEBUG = 'carmilla:*';

// Check system requirements
const health = await fetch('/api/health');
console.log(await health.json());
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

- GitHub Issues: Report bugs and feature requests
- Documentation: Check docs/ folder for detailed guides
- API Reference: See src/api/ for endpoint documentation