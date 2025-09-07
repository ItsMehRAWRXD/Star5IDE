# 🔐 Polymorphic Encryption System

A comprehensive polymorphic encryption system with dual-layer encryption, hot patching, and modular plugin architecture.

## 🌟 Features

- **Dual-Layer Encryption**: OpenSSL cipher + polymorphic keystream + evolving XOR
- **Multiple Ciphers**: AES-256-CBC, Camellia-256-CBC, ChaCha20
- **Position-Independent**: Self-relocating executables ready to run anywhere
- **Hot Patching**: Dynamic code modification with car() markers
- **Reverse PE Wrapper**: Environment capture and diagnosis
- **Plugin System**: Modular architecture for extensibility
- **Web Interface**: Modern, responsive web frontend
- **Send-To Integration**: Right-click encryption from Windows Explorer
- **Real-time Compilation**: .NET backend with compilation service

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Web Frontend (HTML/JS)                   │
├─────────────────────────────────────────────────────────────┤
│                 .NET Backend (ASP.NET Core)                 │
├─────────────────────────────────────────────────────────────┤
│              Plugin System (Modular Architecture)           │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Encryption    │  │ Polymorphic     │  │ Hot Patcher  │ │
│  │    Plugin       │  │ Loader Plugin   │  │   System     │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│           PowerShell Scripts (Core Encryption)              │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### 1. Setup Environment
```powershell
.\Setup-Environment.ps1
```

### 2. Start the System
```powershell
# Start web backend
.\Start-Backend.bat

# Or use HTTP listener (alternative)
.\HTTP-Listener.ps1
```

### 3. Access Web Interface
Open http://localhost:5000 in your browser

### 4. Use Send-To Integration
Right-click any file → Send to → Encrypt-PolymorphicDualLayer

## 📁 Project Structure

```
/workspace/
├── Encrypt-PolymorphicDualLayer.ps1    # Main encryption script
├── PolymorphicBackend/                 # .NET Web API backend
│   ├── Controllers/
│   │   └── CompilerController.cs
│   ├── Program.cs
│   └── PolymorphicBackend.csproj
├── PolymorphicLoader/                  # Self-decrypting loader
│   ├── PolymorphicLoader.cs
│   ├── Program.cs
│   └── PolymorphicLoader.csproj
├── HotPatcher/                         # Dynamic patching system
│   ├── HotPatcher.cs
│   ├── Program.cs
│   └── HotPatcher.csproj
├── PluginSystem/                       # Modular plugin architecture
│   ├── IPlugin.cs
│   ├── PluginManager.cs
│   ├── Plugins/
│   │   ├── PolymorphicLoaderPlugin.cs
│   │   └── EncryptionPlugin.cs
│   ├── Program.cs
│   └── PluginSystem.csproj
├── WebFrontend/                        # Web user interface
│   └── index.html
├── Install-SendTo.ps1                  # Send-To integration
├── Uninstall-SendTo.ps1
├── Setup-Environment.ps1               # Environment setup
├── HTTP-Listener.ps1                   # Alternative HTTP server
├── Build-All.ps1                       # Build script
└── README.md
```

## 🔧 Components

### 1. Dual-Layer Encryption Script
**File**: `Encrypt-PolymorphicDualLayer.ps1`

- **Layer 1**: OpenSSL cipher encryption (AES/Camellia/ChaCha20)
- **Layer 2**: Cipher-specific polymorphic keystream + evolving XOR
- **Output**: Position-independent executable with embedded payload
- **Features**: User-selectable extension, GUI configuration

### 2. .NET Backend
**Directory**: `PolymorphicBackend/`

- REST API for compilation and encryption services
- Web frontend integration
- Real-time C# compilation to executable
- Runs on http://localhost:5000

### 3. Polymorphic Loader
**Directory**: `PolymorphicLoader/`

- Self-decrypting stub with embedded payload
- Reverse PE wrapper for environment capture
- Hot patching support with car() markers
- Position-independent execution

### 4. Hot Patcher System
**Directory**: `HotPatcher/`

- Dynamic code patching with car() markers
- Template generation for fresh code
- Interactive command interface
- Memory protection management

### 5. Plugin System
**Directory**: `PluginSystem/`

- Modular architecture for extensibility
- Built-in encryption and loader plugins
- Dynamic plugin loading and management
- Command-line interface

### 6. Web Frontend
**Directory**: `WebFrontend/`

- Modern, responsive HTML/CSS/JavaScript interface
- Drag-and-drop file encryption
- Real-time progress indicators
- Multiple cipher and polymorphic mode selection

## 💻 Usage Examples

### Command Line Encryption
```powershell
# Encrypt a file with GUI selection
.\Encrypt-PolymorphicDualLayer.ps1 "C:\path\to\file.exe"

# Use plugin system
.\Start-PluginSystem.bat
# Then: encrypt aes-256-cbc "C:\path\to\file.exe"
```

### Web Interface
1. Open http://localhost:5000
2. Select cipher (AES/Camellia/ChaCha20)
3. Choose polymorphic mode (XOR/AES-CTR/Camellia-CTR/ChaCha20)
4. Set output extension (.exe/.dll/.bin or none)
5. Upload file and click "Encrypt & Download"

### Send-To Integration
1. Right-click any file in Windows Explorer
2. Select "Send to" → "Encrypt-PolymorphicDualLayer"
3. Choose encryption options in the GUI
4. Get encrypted executable with your chosen extension

### Hot Patching
```powershell
.\Start-HotPatcher.bat
# Interactive commands:
# load patch_name patch_file.bin
# apply patch_name car_marker_1
# generate xor 256
# list patches
```

## 🔒 Security Features

### Dual-Layer Encryption
1. **Primary Layer**: OpenSSL cipher (AES-256-CBC, Camellia-256-CBC, ChaCha20)
2. **Secondary Layer**: Cipher-specific polymorphic keystream + evolving XOR

### Polymorphic Techniques
- **car() Markers**: Hot patching points for dynamic modification
- **Evolving XOR**: Key evolution based on position and previous state
- **Keystream Generation**: AES-CTR, Camellia-CTR, ChaCha20 keystreams
- **Position Independence**: Self-relocating code with PEB parsing

### Environment Capture
- Process information gathering
- Module enumeration
- System environment detection
- Real-time diagnosis capabilities

## 🛠️ Requirements

- **OS**: Windows 10/11
- **.NET**: .NET 8.0 SDK
- **OpenSSL**: OpenSSL command-line tools
- **PowerShell**: PowerShell 5.1+
- **Compiler**: Visual Studio Build Tools (for C compilation)

## 📦 Installation

### Automated Setup
```powershell
# Clone or download the project
# Navigate to the project directory
.\Setup-Environment.ps1
```

### Manual Setup
```powershell
# 1. Install Send-To integration
.\Install-SendTo.ps1

# 2. Build all projects
.\Build-All.ps1

# 3. Start the backend
.\Start-Backend.bat
```

## 🎯 Use Cases

- **Educational**: Learning about polymorphic encryption techniques
- **Research**: Studying advanced obfuscation methods
- **Security Testing**: Penetration testing and red team exercises
- **Malware Analysis**: Understanding polymorphic malware behavior
- **Software Protection**: Protecting intellectual property

## ⚠️ Security Notice

This system is designed for **educational and research purposes**. Users are responsible for:

- Complying with applicable laws and regulations
- Using the system ethically and responsibly
- Not using it for malicious purposes
- Understanding the legal implications in their jurisdiction

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is provided for educational and research purposes. Please use responsibly and in accordance with applicable laws.

## 🆘 Support

For issues and questions:
1. Check the documentation
2. Review the code comments
3. Test with the provided examples
4. Create an issue with detailed information

---

**Remember**: With great power comes great responsibility. Use this system ethically and legally! 🛡️