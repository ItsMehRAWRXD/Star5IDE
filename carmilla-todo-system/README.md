# Carmilla Encrypted Todo System

A fully-featured encrypted Todo application with native OpenSSL encryption, in-memory patch editing, and selective area encryption. This system is completely plug-and-play with no external dependencies beyond Node.js and OpenSSL.

## Features

### 🔐 Carmilla OpenSSL Encryption
- **Native OpenSSL integration** via child_process (no npm dependencies)
- **Unique per-run encryption** with fresh salt and IV every time
- **Anti-reverse engineering** with fake encryption calls
- **Metadata packaging** with repack/unpack for flexible encryption chains
- **No fallback/substitution** - if encryption fails, it reports clearly

### 🔧 In-Memory Patch Editing
- **Car() markers** for dynamic code injection points
- **Runtime patching** without modifying source files
- **VM-based execution** with sandboxed context
- **Preview mode** to see patches before execution

### 🎯 Selective Area Encryption
- **Point-and-click** selection of areas to encrypt/decrypt
- **Detailed reporting** per area with success/failure status
- **No auto-downgrade** - uses only OpenSSL, never substitutes
- **File area support** for encrypting specific lines/sections

### 📝 Encrypted Todo Application
- **Add, remove, toggle** todos with timestamps
- **Individual or batch** encryption/decryption
- **Local storage** persistence with encrypted data
- **Real-time status** updates and encryption reports
- **Export/import** functionality for backup

## Architecture

```
carmilla-todo-system/
├── src/
│   ├── crypto/
│   │   └── carmilla.ts          # Core OpenSSL encryption module
│   ├── utils/
│   │   └── carPatcher.ts        # In-memory patch editor
│   ├── api/
│   │   ├── server.ts            # Express API server
│   │   └── encryptionService.ts # Selective area encryption
│   ├── components/
│   │   └── EncryptedTodoApp.tsx # React Todo component
│   ├── hooks/
│   │   └── useEncryption.ts     # React encryption hook
│   ├── App.tsx                  # Main app component
│   └── main.tsx                 # Entry point
├── docs/                        # Documentation
├── package.json                 # Dependencies
└── vite.config.ts              # Vite configuration
```

## Installation

1. **Clone the repository:**
```bash
git clone https://github.com/yourusername/carmilla-todo-system.git
cd carmilla-todo-system
```

2. **Install dependencies:**
```bash
npm install
```

3. **Verify OpenSSL is installed:**
```bash
npm run check-openssl
```

## Usage

### Development Mode

Run both backend and frontend in development mode:
```bash
npm run dev
```

This starts:
- Backend API server on http://localhost:3001
- Frontend Vite server on http://localhost:3000

### Production Build

```bash
npm run build
npm start
```

## API Documentation

### Encryption Endpoints

#### POST /api/encryption/encrypt
Encrypt data with detailed reporting.

```json
{
  "targets": [
    {
      "type": "string",
      "data": "secret data",
      "intent": "encrypt"
    }
  ],
  "passphrase": "your-passphrase"
}
```

#### POST /api/encryption/decrypt
Decrypt data with detailed reporting.

```json
{
  "targets": [
    {
      "type": "string",
      "data": "base64-encrypted-data",
      "intent": "decrypt"
    }
  ],
  "passphrase": "your-passphrase"
}
```

#### POST /api/encryption/batch
Batch encrypt/decrypt multiple items.

```json
{
  "items": [
    { "id": "1", "data": "data1", "intent": "encrypt" },
    { "id": "2", "data": "data2", "intent": "encrypt" }
  ],
  "passphrase": "your-passphrase"
}
```

### Patch Endpoints

#### POST /api/patch/execute
Execute code with Car() patches.

```json
{
  "code": "console.log('before');\nCar();\nconsole.log('after');",
  "patches": ["console.log('INJECTED!');"],
  "context": {}
}
```

#### POST /api/patch/preview
Preview patches without execution.

```json
{
  "code": "function test() {\n  Car();\n}",
  "patches": ["return 42;"]
}
```

## Code Examples

### Using Carmilla Encryption Directly

```typescript
import carmilla from './crypto/carmilla';

// Encrypt data
const encrypted = carmilla.encrypt('secret data', 'passphrase');

// Package with metadata
const packaged = carmilla.repack(encrypted, 'hint', ['openssl']);

// Unpack and decrypt
const pack = carmilla.unpack(packaged);
const decrypted = carmilla.decrypt(pack.data, 'passphrase', pack.meta.salt);
```

### Using Car() Patches

```typescript
import carPatcher from './utils/carPatcher';

// Source code with Car() markers
const code = `
function calculate() {
  let result = 10;
  Car();
  return result;
}
`;

// Patches to inject
const patches = ['result = result * 2;'];

// Execute with patches
const result = carPatcher.runPatchedString(code, patches);
```

### Using Selective Area Encryption

```typescript
import { processTargets } from './api/encryptionService';

const targets = [
  {
    type: 'file',
    path: '/path/to/file.txt',
    intent: 'encrypt'
  },
  {
    type: 'string',
    data: 'sensitive data',
    key: 'my-data',
    intent: 'encrypt'
  }
];

const result = await processTargets(targets, 'passphrase');
console.log(result.reports); // Detailed per-area reports
```

## Security Features

### Per-Run Isolation
- Every encryption operation uses unique salt and IV
- Timestamps and run IDs track each operation
- No reuse of temporary files or buffers

### Anti-Reverse Engineering
- Fake encryption calls to confuse analysis tools
- Random number of decoy operations
- Metadata obfuscation

### Transparent Reporting
- Detailed error messages for debugging
- Per-area success/failure status
- No hidden operations or fallbacks

## Philosophy

This project is built from pure creativity and curiosity. It's not about money, fame, or competition—it's about exploring new ideas, empowering developers, and making something meaningful.

## When / What / Why

**When:** Now  
**What:** A complete encrypted Todo system with plug-and-play encryption  
**Why:** Because secure, transparent, and flexible encryption should be accessible to everyone

## License

MIT License - See LICENSE file for details

## Author

Created by ItsMehRAWRXD

---

*Remember: True ring freedom means having complete control over your encryption, with no hidden dependencies or black-box operations.*