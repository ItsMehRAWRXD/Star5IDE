# RawrZ Framework - Testing Suite

## 🎯 **Overview**
This folder contains all testing and validation files for the RawrZ offensive security framework. All tests are designed to validate encryption, stub generation, and core functionality without cluttering the main development workspace.

## 📁 **Test Files**

### **1. Encryption Testing**
- **`test_ssl_encryption.cpp`** - Comprehensive encryption method testing
- **`test_ssl_encryption.bat`** - Automated compilation and execution script
- **`test_payload.txt`** - Sample payload for encryption testing

### **2. Stub Generation Testing**
- **`test_openssl_stubs.cpp`** - OpenSSL-only stub generation testing
- **`test_openssl_stubs.bat`** - Automated stub generation testing script

## 🔐 **Encryption Methods Tested**

### **Custom Encryption (Legacy)**
- **Hybrid**: XOR + Bit rotation + Position-based XOR
- **Triple**: 3-round encryption with fixed keys
- **Enhanced**: XOR + Variable bit rotation + S-Box + Final XOR
- **CrossPlatform**: CBC-like mode with random IV

### **OpenSSL Encryption (Production)**
- **AES-256-GCM**: Authenticated encryption with Galois/Counter Mode
- **AES-256-CBC**: Cipher Block Chaining mode
- **ChaCha20**: High-performance stream cipher

## 🚀 **Stub Types Generated**

### **C++ Stubs**
- Full OpenSSL integration
- Anti-debugging checks
- Memory execution capabilities
- Professional-grade decryption

### **ASM Stubs**
- Low-level assembly implementation
- OpenSSL library linking
- Anti-analysis features
- File loading and execution

## 🛠️ **Usage Instructions**

### **Running Encryption Tests**
```batch
cd Tests
.\test_ssl_encryption.bat
```

### **Running Stub Generation Tests**
```batch
cd Tests
.\test_openssl_stubs.bat
```

### **Manual Compilation**
```batch
g++ -std=c++17 -O2 test_ssl_encryption.cpp -o test_ssl_encryption.exe -I"C:\Program Files\OpenSSL-Win64\include" -L"C:\Program Files\OpenSSL-Win64\lib" -llibcrypto -llibssl
```

## 📊 **Expected Outputs**

### **Encryption Test Results**
- Encrypted payload files (`.encrypted`)
- Size comparison reports
- Encryption overhead analysis
- Method-specific performance data

### **Stub Generation Results**
- C++ stub files (`.cpp`)
- Assembly stub files (`.asm`)
- Encrypted payload files
- Generation success reports

## 🔧 **Requirements**

### **System Requirements**
- Windows 10/11
- MinGW-w64 or MSVC compiler
- C++17 support

### **OpenSSL Installation**
- **Path**: `C:\Program Files\OpenSSL-Win64`
- **Version**: 1.1.1 or higher
- **Architecture**: x64

### **Dependencies**
- `libcrypto.lib`
- `libssl.lib`
- OpenSSL headers

## 📝 **Test Results Documentation**

### **Encryption Overhead**
- **AES-256-GCM**: +60 bytes (key + IV + auth tag)
- **AES-256-CBC**: +48 bytes (key + IV) + padding
- **ChaCha20**: +44 bytes (key + nonce)
- **Custom Methods**: +1 byte (salt/key/IV)

### **Security Features**
- Random key generation
- Secure random number generation
- Authenticated encryption (GCM)
- Anti-tampering protection

## 🚨 **Important Notes**

### **No XOR Fallbacks**
- All tests use pure OpenSSL encryption
- No legacy XOR encryption methods
- Production-ready security standards

### **Anti-Analysis Features**
- Anti-debugging checks
- VM detection
- Timing analysis
- Process monitoring

### **Memory Management**
- Proper resource cleanup
- Secure memory allocation
- Execution memory protection

## 🔍 **Troubleshooting**

### **Common Issues**
1. **OpenSSL not found**: Verify installation path
2. **Compilation errors**: Check C++17 support
3. **Library linking**: Ensure correct library paths
4. **Permission errors**: Run as administrator if needed

### **Debug Mode**
- Check console output for detailed error messages
- Verify file paths and permissions
- Confirm OpenSSL library availability

## 📚 **Additional Resources**

### **OpenSSL Documentation**
- [OpenSSL EVP Documentation](https://www.openssl.org/docs/man1.1.1/man3/EVP_EncryptInit_ex.html)
- [AES-GCM Implementation](https://wiki.openssl.org/index.php/EVP_Authenticated_Encryption_and_Decryption)
- [ChaCha20 Cipher](https://www.openssl.org/docs/man1.1.1/man3/EVP_chacha20.html)

### **RawrZ Framework**
- Main application: `RawrZ_Simple.cpp`
- Plugin system: `PluginSystem.h`
- Core encryption: Integrated OpenSSL functions

## 🎉 **Success Criteria**

### **Encryption Tests**
- All encryption methods working
- Proper file generation
- Correct overhead calculations
- No compilation errors

### **Stub Generation Tests**
- C++ stubs generated successfully
- ASM stubs generated successfully
- OpenSSL integration working
- Anti-analysis features functional

---

**Last Updated**: January 2025  
**Version**: 1.0  
**Maintainer**: RawrZ Development Team
