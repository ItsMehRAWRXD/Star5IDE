# RawrZ OpenSSL Stub Generator

## Overview
This is a **pure OpenSSL** stub generator that creates encrypted payloads using industry-standard encryption algorithms. **No XOR fallback** - only OpenSSL EVP APIs for maximum security and compatibility.

## Features
- **AES-256-GCM**: Authenticated encryption with Galois/Counter Mode
- **AES-256-CBC**: Cipher Block Chaining mode
- **ChaCha20**: High-performance stream cipher
- **Memory-only execution**: Decrypts and executes payloads entirely in memory
- **No external files**: Everything embedded in the generated stub
- **Windows compatible**: Uses Windows API for memory protection and execution

## Prerequisites
1. **OpenSSL Development Libraries** (installed at `C:\Program Files\OpenSSL-Win64`)
2. **Microsoft Visual Studio** or **Build Tools** with MSVC compiler
3. **Windows SDK** for Windows API headers

## Quick Start

### 1. Build the Generator
```batch
build_openssl_stub.bat
```

### 2. Prepare Your Payload
Place your shellcode/executable as `payload.bin` in the same directory.

### 3. Generate Encrypted Stub
```batch
RawrZOpenSSLStub.exe
```

This creates `stub.cpp` containing your encrypted payload.

### 4. Build the Final Stub
```batch
cl /std:c++17 stub.cpp /link libcrypto.lib
```

## How It Works

### Encryption Process
1. Reads `payload.bin` as binary data
2. Generates cryptographically secure random key and IV
3. Encrypts using selected cipher (AES-256-GCM by default)
4. Generates authentication tag for GCM mode
5. Outputs `stub.cpp` with embedded encrypted data

### Decryption Process
1. Stub initializes OpenSSL EVP context
2. Decrypts embedded blob using hardcoded key/IV
3. Sets GCM tag if using authenticated encryption
4. Changes memory protection to PAGE_EXECUTE_READWRITE
5. Jumps to decrypted payload

## Supported Ciphers

| Cipher | Key Size | IV Size | Tag Size | Security Level |
|--------|----------|---------|----------|----------------|
| AES-256-GCM | 32 bytes | 12 bytes | 16 bytes | ⭐⭐⭐⭐⭐ |
| AES-256-CBC | 32 bytes | 16 bytes | 0 bytes | ⭐⭐⭐⭐ |
| ChaCha20 | 32 bytes | 12 bytes | 0 bytes | ⭐⭐⭐⭐⭐ |

## Customization

### Change Default Cipher
Modify the `cipher` variable in `main()`:
```cpp
std::string cipher = "ChaCha20";  // or "AES-256-CBC"
```

### Add More Ciphers
Extend the cipher selection logic in the `encrypt()` function:
```cpp
else if (method == "AES-128-GCM") { cipher = EVP_aes_128_gcm(); keyLen = 16; ivLen = 12; tagLen = 16; }
```

## Security Features

- **Cryptographically secure random generation** using OpenSSL's RAND_bytes()
- **Authenticated encryption** with AES-GCM (prevents tampering)
- **Memory protection** using VirtualProtect() for execution
- **No XOR fallback** - eliminates weak encryption vectors
- **Industry standard algorithms** - no custom crypto

## Troubleshooting

### Build Errors
- **OpenSSL not found**: Update `OPENSSL_DIR` in `build_openssl_stub.bat`
- **Missing libcrypto.lib**: Ensure OpenSSL development libraries are installed
- **Header not found**: Check `OPENSSL_INCLUDE` path

### Runtime Errors
- **payload.bin missing**: Place your payload file in the same directory
- **OpenSSL initialization failed**: Verify OpenSSL DLLs are in PATH or same directory

## Integration with RawrZ

This stub generator can be integrated into the main RawrZ framework:
1. Add as a new plugin option
2. Use for automated stub generation
3. Integrate with the existing encryption system
4. Replace XOR-based stubs with OpenSSL equivalents

## License
This code is part of the RawrZ offensive security framework. Use responsibly and only on systems you own or have explicit permission to test.
