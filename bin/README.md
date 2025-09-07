# Polymorphic Rig Toolkit

Advanced polymorphic encryption and hot patching toolkit with dual-layer encryption.

## Components

1. **PowerShell Encryptor** - Dual-layer polymorphic encryption with drag-and-drop support
2. **.NET Backend** - Compiles C# to executable with polymorphic wrapping
3. **Plugin System** - Modular architecture with hot patcher and loader plugins
4. **Web Interface** - Browser-based encryption/decryption panel

## Quick Start

### PowerShell Encryptor (Windows)
```powershell
powershell Encrypt-PolymorphicDualLayer.ps1 file.exe
```

### CLI Tool
```bash
./rig.sh list
./rig.sh polymorphicloader --payload payload.bin --reverse-wrapper
./rig.sh hotpatcher --template advanced
```

### Web Interface
```bash
cd ../server
node encrypt_server.js
```
Then open http://localhost:8088

## Features

- **Dual-Layer Encryption**: OpenSSL cipher + polymorphic keystream
- **Hot Patching**: Runtime code modification with car() markers  
- **Reverse PE Wrapper**: Environment diagnostics and analysis
- **Plugin Architecture**: Extensible modular system
- **Cross-Platform**: Works on Windows, Linux, macOS

## Installation

1. Install dependencies:
   - .NET 8.0 SDK (optional, for CLI)
   - Node.js 18+ (for web interface)
   - OpenSSL (for encryption)
   - PowerShell 7+ (for PowerShell tools)

2. Build the toolkit:
   ```bash
   ./build.sh
   ```

## Usage Examples

### Generate Polymorphic EXE (Windows)
```powershell
# Drag and drop any file onto Encrypt-PolymorphicDualLayer.ps1
# Or run directly:
powershell Encrypt-PolymorphicDualLayer.ps1 payload.bin
```

### Convert Binary to C# Source
```powershell
powershell BinToCs.ps1 -InputFile payload.bin -OutputFile EmbeddedPayload.cs
```

### Interactive Plugin Management (.NET required)
```bash
./rig.sh interactive
rig> list
rig> polymorphicloader --payload test.bin --hot-patcher
rig> hotpatcher --template car --target loader.exe
```

## Architecture

- **Polymorphic Loader**: Decrypts and executes payloads with reverse PE wrapping
- **Hot Patcher**: Generates fresh templates and applies runtime patches
- **CLI Manager**: Plugin management and execution interface
- **Web Backend**: HTTP API for encryption/compilation services

Built with security research and penetration testing in mind.
