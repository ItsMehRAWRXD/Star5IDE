# RawrZ Stub Generators - Complete Guide

## Overview
The RawrZ framework now includes multiple stub generation systems, each designed for different use cases and security requirements. This guide covers all available options from pure OpenSSL to custom encryption methods.

## 🚀 **OpenSSL-Only Stub Generators**

### 1. RawrZOpenSSLStub.cpp
**Purpose**: Pure OpenSSL encryption with no fallbacks
**Features**:
- AES-256-GCM (authenticated encryption)
- AES-256-CBC (cipher block chaining)
- ChaCha20 (high-performance stream cipher)
- Cryptographically secure random generation
- Memory-only execution

**Build**: `build_openssl_stub.bat`
**Usage**: 
```batch
RawrZOpenSSLStub.exe
# Generates: stub.cpp
```

### 2. RawrZRealOpenSSL.cpp
**Purpose**: Comprehensive OpenSSL replacement for all encryption methods
**Features**:
- AES-256-GCM, AES-256-CBC, ChaCha20
- **Hybrid mode**: AES-GCM + ChaCha20 cascade
- Interactive cipher selection
- Zero XOR fallbacks
- Industry-standard algorithms only

**Build**: `cl /std:c++17 RawrZRealOpenSSL.cpp /link libcrypto.lib`
**Usage**: 
```batch
RawrZRealOpenSSL.exe
# Choose cipher: 1-4
# Generates: stub_[Method].cpp
```

## 🔐 **Custom Encryption Stubs**

### 3. RawrZHybridStub.cpp
**Purpose**: Custom hybrid encryption (salt + XOR + rotation)
**Algorithm**:
```cpp
// Salt extraction + position-based XOR + bit rotation + salt XOR
out[i] ^= (i & 0xFF);
out[i] = (out[i] >> 1) | (out[i] << 7);
out[i] ^= salt;
```

**Build**: `cl /std:c++17 RawrZHybridStub.cpp /out:RawrZHybrid.exe`
**Input**: `payload.Hybrid.encrypted`

### 4. RawrZTripleStub.cpp
**Purpose**: Triple-layer encryption with 3 rounds
**Algorithm**:
```cpp
// 3 rounds: position XOR + bit rotation + key XOR
for (int round = 2; round >= 0; --round) {
    out[i] ^= (i + round) % 256;
    out[i] = (out[i] >> 2) | (out[i] << 6);
    out[i] ^= keys[round];
}
```

**Build**: `cl /std:c++17 RawrZTripleStub.cpp /out:RawrZTriple.exe`
**Input**: `payload.Triple.encrypted`

### 5. RawrZEnhancedStub.cpp
**Purpose**: Advanced encryption with S-box substitution
**Algorithm**:
```cpp
// S-box lookup + bit rotation + key XOR
for (int j = 0; j < 256; ++j) 
    if (sbox[j] == out[i]) { out[i] = j; break; }
int shift = (i % 7) + 1;
out[i] = (out[i] >> (8 - shift)) | (out[i] << shift);
out[i] ^= key;
```

**Build**: `cl /std:c++17 RawrZEnhancedStub.cpp /out:RawrZEnhanced.exe`
**Input**: `payload.Enhanced.encrypted`

### 6. RawrZCrossPlatformStub.cpp
**Purpose**: Cross-platform compatible encryption
**Algorithm**:
```cpp
// CBC-like mode with position-based XOR
out[i] ^= 0x42 ^ ((i + 1) % 256);
out[i] ^= prev;
prev = out[i];
```

**Build**: `cl /std:c++17 RawrZCrossPlatformStub.cpp /out:RawrZCrossPlatform.exe`
**Input**: `payload.CrossPlatform.encrypted`

## 🛠️ **Build Scripts**

### build_openssl_stub.bat
Builds the basic OpenSSL stub generator
- Requires OpenSSL development libraries
- Generates `RawrZOpenSSLStub.exe`

### build_custom_stubs.bat
Builds all custom encryption stubs
- No external dependencies
- Generates 4 executable stubs
- Pure Windows API implementation

## 📊 **Comparison Matrix**

| Stub Type | Dependencies | Security Level | Performance | Use Case |
|-----------|--------------|----------------|-------------|----------|
| **OpenSSL** | OpenSSL libs | ⭐⭐⭐⭐⭐ | High | Production, high-security |
| **RealOpenSSL** | OpenSSL libs | ⭐⭐⭐⭐⭐ | High | Production, all methods |
| **Hybrid** | None | ⭐⭐⭐ | Medium | Custom, lightweight |
| **Triple** | None | ⭐⭐⭐⭐ | Medium | Custom, multi-layer |
| **Enhanced** | None | ⭐⭐⭐⭐ | Medium | Custom, S-box based |
| **CrossPlatform** | None | ⭐⭐⭐ | High | Custom, portable |

## 🔄 **Workflow Examples**

### OpenSSL Workflow
```batch
# 1. Build generator
build_openssl_stub.bat

# 2. Prepare payload
copy your_payload.exe payload.bin

# 3. Generate stub
RawrZOpenSSLStub.exe

# 4. Build final executable
cl /std:c++17 stub.cpp /link libcrypto.lib
```

### Custom Encryption Workflow
```batch
# 1. Build all stubs
build_custom_stubs.bat

# 2. Encrypt payload with chosen method
# (Use your encryption tool)

# 3. Run appropriate stub
RawrZHybrid.exe        # For Hybrid encryption
RawrZTriple.exe        # For Triple encryption
RawrZEnhanced.exe      # For Enhanced encryption
RawrZCrossPlatform.exe # For CrossPlatform encryption
```

## 🎯 **Security Features**

### OpenSSL Stubs
- **Cryptographically secure** random generation
- **Authenticated encryption** (AES-GCM)
- **Industry standard** algorithms
- **No weak fallbacks**

### Custom Stubs
- **Zero external dependencies**
- **Custom algorithms** (harder to detect)
- **Anti-analysis** techniques
- **Memory-only execution**

## 🚨 **Important Notes**

1. **OpenSSL stubs** require OpenSSL development libraries
2. **Custom stubs** are zero-dependency but use custom crypto
3. **All stubs** execute payloads entirely in memory
4. **No disk writes** during execution
5. **Windows API only** for memory management

## 🔧 **Troubleshooting**

### OpenSSL Issues
- Verify OpenSSL installation path in build scripts
- Ensure `libcrypto.lib` is available
- Check PATH for OpenSSL DLLs

### Custom Stub Issues
- Verify MSVC compiler availability
- Check Windows SDK installation
- Ensure payload files are properly encrypted

## 📚 **Integration with RawrZ**

These stub generators can be integrated into the main RawrZ framework:
1. **Plugin system** integration
2. **Automated stub generation**
3. **Encryption method selection**
4. **Build automation**

## 📄 **License**
All stub generators are part of the RawrZ offensive security framework. Use responsibly and only on systems you own or have explicit permission to test.
