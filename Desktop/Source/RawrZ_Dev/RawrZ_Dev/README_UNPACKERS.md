# ZenCrypto Payload Extractors

This directory contains several native (non-.NET) solutions for extracting encrypted payloads from ZenCrypto stub executables.

## Overview

Your `SelfContainedExecutable` class writes data in this format:
```
ZEN_RESOURCES
[4 bytes: encrypted data length]
[encrypted data]
[4 bytes: key length]
[key]
[4 bytes: IV length]
[IV]
END_ZEN_RESOURCES
```

## Available Extractors

### 1. Native C++ Unpacker (`unpack.cpp`)

**Compilation:**
```bash
# MSVC
cl /O2 /GS- unpack.cpp

# MinGW-w64
g++ -O2 -s -static unpack.cpp -o unpack.exe

# Clang
clang++ -O2 -s -static unpack.cpp -o unpack.exe
```

**Usage:**
```bash
unpack.exe packed.exe payload.bin
```

**Features:**
- No CRT dependencies
- No .NET runtime
- Windows API only
- Detailed progress output
- Memory-safe operations

### 2. Python Extractor (`extract_payload.py`)

**Requirements:**
- Python 3.6+ (stock CPython)
- No external packages needed

**Usage:**
```bash
python extract_payload.py packed.exe payload.bin
```

**Features:**
- Cross-platform (Windows, Linux, macOS)
- No dependencies
- Clean error handling
- Hex output of key/IV

### 3. PowerShell Script (`extract_payload.ps1`)

**Requirements:**
- Windows PowerShell 5.1+ or PowerShell Core
- No .NET assemblies loaded

**Usage:**
```powershell
.\extract_payload.ps1 -In packed.exe -Out payload.bin
```

**Features:**
- Runs on any Windows box
- No installation required
- Colored output
- Detailed progress information

## Compilation Script

Use `compile_unpacker.bat` to automatically compile the C++ unpacker with different compilers:

```bash
compile_unpacker.bat
```

This will attempt to compile with:
- MSVC (Visual Studio)
- MinGW-w64
- Clang

## Workflow

1. **Generate stub** using your `SelfContainedExecutable` class
2. **Extract payload** using any of the unpackers above
3. **Decrypt payload** using AES-256-CBC with the extracted key/IV

## Example

```bash
# Generate a stub (your existing code)
# ... generates calc_stub.exe

# Extract the encrypted payload
python extract_payload.py calc_stub.exe payload.bin

# You now have:
# - payload.bin (encrypted)
# - Key and IV (displayed during extraction)
# - Decrypt with AES-256-CBC
```

## Notes

- All extractors are completely native with no .NET dependencies
- The C++ version is the most efficient for production use
- Python version is best for cross-platform compatibility
- PowerShell version is best for Windows-only environments
- All extractors handle the same data format from your `WriteResourceData` function

## Troubleshooting

**"Marker not found" errors:**
- Verify the stub was generated correctly
- Check that the file wasn't corrupted
- Ensure you're using the right stub file

**Compilation errors:**
- Install the appropriate C++ compiler
- Use the compilation script for automatic detection
- Check that Windows SDK is installed (for MSVC)

**Permission errors:**
- Run as administrator if needed
- Check file permissions
- Ensure output directory is writable
