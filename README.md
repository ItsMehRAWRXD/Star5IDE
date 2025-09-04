# 🚗 Carmilla Todo App

A comprehensive todo list application featuring **Carmilla OpenSSL encryption** and **Car(); patch system** for in-memory code editing. This project demonstrates enterprise-grade encryption, dynamic code patching, and modern web development practices.

## ✨ Features

### 🔐 Carmilla OpenSSL Encryption
- **Native OpenSSL integration** with AES-256-CBC
- **Unique salt/IV per operation** for maximum security
- **No npm dependencies** - pure Node.js + OpenSSL binary
- **Anti-reverse engineering** with fake encryption calls
- **Metadata packaging** with timestamps and chain info
- **Plug-and-play** - works in any Node.js/TypeScript project

### ⚡ Car(); Patch System
- **In-memory code patching** using `Car();` markers
- **Dynamic code injection** without modifying files on disk
- **Isolated VM execution** for security
- **Real-time debugging** and runtime modifications
- **Security validation** to prevent dangerous operations

### 📋 Todo Management
- **Encrypted todo storage** with passphrase protection
- **Selective encryption** - choose which todos to encrypt
- **Real-time statistics** and status tracking
- **Per-run isolation** - every encryption is unique
- **Transparent reporting** of encryption success/failure

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- OpenSSL (usually pre-installed on Linux/macOS)
- TypeScript

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd carmilla-todo-app

# Install dependencies
npm install

# Start development servers (backend + frontend)
npm run dev
```

The app will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

### Production Build

```bash
# Build both server and client
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
src/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── App.tsx         # Main app component
│   │   └── main.tsx        # Entry point
│   └── index.html          # HTML template
├── server/                 # Node.js backend
│   ├── api/                # REST API routes
│   │   ├── encryption.ts   # Encryption endpoints
│   │   ├── patch.ts        # Patch system endpoints
│   │   └── todos.ts        # Todo CRUD endpoints
│   ├── crypto/             # Carmilla encryption
│   │   └── carmilla-openssl.ts
│   ├── patch/              # Car(); patch system
│   │   └── carPatcher.ts
│   └── index.ts            # Server entry point
└── shared/                 # Shared TypeScript types
    └── types.ts
```

## 🔐 Carmilla Encryption Usage

### Basic Encryption/Decryption

```typescript
import { encryptAsync, decryptAsync, repack, unpack } from './crypto/carmilla-openssl';

// Encrypt data
const encrypted = await encryptAsync("Hello, World!", "myPassphrase");

// Package with metadata
const packaged = repack(encrypted, "hint", ["openssl"], { 
  user: "john", 
  timestamp: new Date().toISOString() 
});

// Unpack and decrypt
const { data, meta } = await unpackAndDecrypt(packaged, "myPassphrase");
console.log(data); // "Hello, World!"
```

### API Endpoints

- `POST /api/encryption/encrypt` - Encrypt data
- `POST /api/encryption/decrypt` - Decrypt data  
- `POST /api/encryption/encrypt-selective` - Selective area encryption
- `POST /api/encryption/inspect` - Inspect package metadata

## ⚡ Car(); Patch System Usage

### In Your Code

```javascript
function myFunction() {
  console.log("Before patch");
  Car(); // <-- Patch injection point
  console.log("After patch");
}
```

### Apply Patches

```typescript
import { executePatched } from './patch/carPatcher';

const sourceCode = `
function demo() {
  console.log("Start");
  Car();
  console.log("End");
}
demo();
`;

const patches = [
  'console.log("🚗 Patch injected!");'
];

const result = executePatched(sourceCode, patches);
// Executes patched code in isolated VM
```

### API Endpoints

- `POST /api/patch/find-markers` - Find Car(); markers
- `POST /api/patch/apply-patches` - Apply patches (preview)
- `POST /api/patch/execute-patched` - Execute patched code
- `POST /api/patch/generate-patches` - Generate random patches

## 📋 Todo API

- `GET /api/todos` - Get all todos
- `POST /api/todos` - Create todo (with optional encryption)
- `PUT /api/todos/:id` - Update todo
- `DELETE /api/todos/:id` - Delete todo
- `POST /api/todos/:id/decrypt` - Decrypt specific todo
- `GET /api/todos/stats` - Get todo statistics

## 🔧 Configuration

### Environment Variables

```bash
NODE_ENV=development
PORT=3001
```

### OpenSSL Requirements

The Carmilla encryption module requires OpenSSL to be available in your system PATH. On most Linux and macOS systems, this is pre-installed. For Windows, you may need to install OpenSSL separately.

## 🛡️ Security Features

### Carmilla Encryption Security
- **AES-256-CBC** with random salt per operation
- **Unique IV** for every encryption (no pattern leaks)
- **Anti-reverse engineering** fake calls
- **No key reuse** - fresh cryptographic material per run
- **Secure temp file handling** with automatic cleanup

### Car(); Patch System Security
- **Isolated VM execution** - patches run in sandboxed environment
- **Dangerous operation blocking** - prevents fs, child_process, eval, etc.
- **Timeout protection** - 5-second execution limit
- **Input validation** - patch code is validated before execution

## 📊 Technical Details

### Encryption Chain
Every encryption operation follows this chain:
1. Generate random salt and IV
2. Execute fake calls (anti-reverse engineering)
3. Encrypt with OpenSSL AES-256-CBC
4. Package with metadata (timestamp, chain, hints)
5. Base64 encode for transport
6. Clean up temporary files securely

### Per-Run Isolation
- Each encryption uses new cryptographic material
- Metadata includes unique timestamps and run IDs
- No state is shared between operations
- Failed operations are clearly reported with reasons

## 🎯 Use Cases

- **Secure todo/note applications** with optional encryption
- **Development tools** with runtime code modification
- **Security research** and cryptographic experimentation
- **Educational projects** for learning encryption and VM isolation
- **Plugin systems** with dynamic code injection
- **Debugging tools** with live code patching

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🔗 API Documentation

Visit `/api/health` for service status and available endpoints.

---

**Built with ❤️ using Carmilla OpenSSL encryption and Car(); patch system**