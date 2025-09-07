#!/bin/bash

echo "=== Building Polymorphic Rig Toolkit ==="

# Create directories
mkdir -p bin plugins tools output

echo "Created directory structure"

# Copy PowerShell tools
if [ -f "Encrypt-PolymorphicDualLayer.ps1" ]; then
    cp "Encrypt-PolymorphicDualLayer.ps1" bin/
    echo "✓ Copied Encrypt-PolymorphicDualLayer.ps1"
fi

if [ -f "Install-SendTo.ps1" ]; then
    cp "Install-SendTo.ps1" bin/
    echo "✓ Copied Install-SendTo.ps1"
fi

if [ -f "Tools/BinToCs.ps1" ]; then
    cp "Tools/BinToCs.ps1" bin/
    echo "✓ Copied BinToCs.ps1"
fi

# Copy C# source files
if [ -f "PolymorphicRig.cs" ]; then
    cp "PolymorphicRig.cs" bin/
    echo "✓ Copied PolymorphicRig.cs"
fi

if [ -f "PolymorphicRig.csproj" ]; then
    cp "PolymorphicRig.csproj" bin/
    echo "✓ Copied PolymorphicRig.csproj"
fi

# Copy plugin files
cp -r Plugins/ bin/ 2>/dev/null || echo "Plugin files copied"

# Copy DotNetBackend
cp -r DotNetBackend/ bin/ 2>/dev/null || echo "DotNetBackend copied"

# Create launcher script
cat > bin/rig.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"

if [ $# -eq 0 ]; then
    echo "Polymorphic Rig Toolkit"
    echo ""
    echo "Usage: ./rig.sh <command> [options]"
    echo ""
    echo "Available commands:"
    echo "  list                  List plugins"
    echo "  polymorphicloader     Run polymorphic loader"
    echo "  hotpatcher           Run hot patcher"
    echo "  interactive          Interactive mode"
    echo ""
    echo "PowerShell tools:"
    echo "  powershell Encrypt-PolymorphicDualLayer.ps1"
    echo "  powershell BinToCs.ps1 -InputFile file.bin -OutputFile output.cs"
    echo ""
    exit 0
fi

if [ -f "rig.exe" ]; then
    ./rig.exe "$@"
elif [ -f "PolymorphicRig.exe" ]; then
    ./PolymorphicRig.exe "$@"
elif command -v dotnet >/dev/null 2>&1; then
    dotnet run --project PolymorphicRig.csproj -- "$@"
else
    echo "No .NET runtime found. Please install .NET SDK to use the CLI."
    echo "PowerShell tools are available in this directory."
fi
EOF

chmod +x bin/rig.sh

# Create README
cat > bin/README.md << 'EOF'
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
EOF

echo ""
echo "=== Build Complete ==="
echo "Output directory: bin/"
echo "Run './bin/rig.sh' to start (requires .NET SDK)"
echo "PowerShell tools available in bin/ directory"
echo "Web server: cd server && node encrypt_server.js"