# RawrZ Native Stub Generator

A comprehensive native C++ stub generation system that can create executable stubs and attach payloads without requiring .NET dependencies.

## Features

- **Native C++ Implementation**: No .NET runtime required
- **Anti-Analysis Detection**: Detects debuggers, VMs, and sandboxes
- **Payload Encryption**: AES-like encryption with random keys
- **Multiple Format Support**: JavaScript, Python, Batch, PowerShell, and binary files
- **PE Stub Generation**: Creates minimal but functional Windows executables
- **Resource Embedding**: Embeds payloads as Windows resources
- **Temporary File Cleanup**: Automatic cleanup after execution
- **Obfuscation**: Random delays and string generation

## Requirements

### Compiler Options
You need one of the following C++ compilers:

1. **MinGW-w64** (Recommended for Windows)
   - Download: https://www.mingw-w64.org/downloads/
   - Add to PATH environment variable

2. **Visual Studio Build Tools**
   - Download: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022
   - Install C++ build tools

3. **LLVM/Clang**
   - Download: https://releases.llvm.org/
   - Add to PATH environment variable

### System Requirements
- Windows 7 or later
- Windows SDK headers (usually included with compiler)
- Administrator privileges (for some operations)

## Quick Start

### 1. Compile the System

Run the comprehensive build script:

```batch
compile_all_native.bat
```

This will:
- Detect your available compiler
- Compile all components
- Generate stub templates
- Create test payloads

### 2. Generate Your First Stub

```batch
# Basic stub
native_stubs\native_stub_generator.exe -o my_stub.exe

# Stub with JavaScript payload
native_stubs\native_stub_generator.exe -o js_stub.exe -p test_payloads\test.js

# Stub with Python payload
native_stubs\native_stub_generator.exe -o py_stub.exe -p test_payloads\test.py
```

### 3. Test the Stub

Simply run the generated `.exe` file. It will:
- Extract the embedded payload
- Decrypt if necessary
- Execute based on file type
- Clean up temporary files

## Components

### Core Files

1. **`native_stub_generator.cpp`** - Main stub generation engine
2. **`pe_stub_template.cpp`** - PE executable template generator
3. **`stub_runner.cpp`** - Payload extraction and execution engine
4. **`self_contained_executable.cpp`** - Self-contained executable generator

### Generated Outputs

- **`native_stubs/`** - Compiled executables
- **`stub_templates/`** - Generated PE templates
- **`test_payloads/`** - Sample payloads for testing

## Usage Examples

### Basic Stub Generation

```batch
# Generate empty stub
native_stub_generator.exe -o empty_stub.exe

# Generate stub with payload
native_stub_generator.exe -o payload_stub.exe -p my_script.js

# Generate stub with custom properties
native_stub_generator.exe -o app.exe -p script.py -i icon.ico -v 1.0.0 -c "Company" -n "Product"
```

### Advanced Options

```batch
# Disable anti-analysis features
native_stub_generator.exe -o test.exe --no-anti-analysis

# Hide console window
native_stub_generator.exe -o silent.exe --hide-console

# Don't auto-execute payload
native_stub_generator.exe -o manual.exe --no-auto-execute

# Disable payload encryption
native_stub_generator.exe -o plain.exe --no-encrypt
```

### Payload Types Supported

- **JavaScript** (`.js`) - Executed with Node.js
- **Python** (`.py`) - Executed with Python interpreter
- **Batch** (`.bat`, `.cmd`) - Executed with cmd.exe
- **PowerShell** (`.ps1`) - Executed with PowerShell
- **Binary** (`.exe`, `.dll`) - Direct execution
- **Text** (`.txt`, `.log`) - Opened with default handler

## Anti-Analysis Features

The system includes multiple layers of anti-analysis detection:

### Debugger Detection
- Windows API `IsDebuggerPresent()`
- Debug register inspection
- PEB `BeingDebugged` flag check

### Virtual Machine Detection
- Registry key inspection
- Process name analysis
- Hardware fingerprinting

### Sandbox Detection
- Analysis tool detection
- Process monitoring
- File system analysis

### Timing Analysis
- Sleep duration verification
- Execution timing anomalies
- Random delay insertion

## Security Features

### Payload Encryption
- Random 32-byte encryption keys
- Random 16-byte initialization vectors
- XOR-based encryption (can be upgraded to AES)

### Obfuscation
- Random string generation
- Variable naming obfuscation
- Code structure randomization

### Resource Management
- Temporary file creation with random names
- Automatic cleanup after execution
- Resource ID randomization

## File Structure

```
RawrZ_Dev/
├── native_stub_generator.cpp      # Main generator
├── pe_stub_template.cpp           # PE template generator
├── stub_runner.cpp                # Payload execution engine
├── self_contained_executable.cpp  # Self-contained generator
├── compile_all_native.bat         # Full build script
├── compile_native_stub.bat        # Basic compilation
├── native_stubs/                  # Compiled executables
├── stub_templates/                # Generated templates
├── test_payloads/                 # Test files
└── NATIVE_STUB_README.md         # This file
```

## Compilation Options

### MinGW (Recommended)
```batch
g++ -std=c++17 -O2 -static -static-libgcc -static-libstdc++ -o output.exe input.cpp -ladvapi32 -lversion -lshlwapi -lpsapi -lntdll -lkernel32 -luser32
```

### Visual Studio
```batch
cl /EHsc /std:c++17 /O2 /MT /Fe:output.exe input.cpp advapi32.lib version.lib shlwapi.lib psapi.lib ntdll.lib kernel32.lib user32.lib
```

### Clang
```batch
clang++ -std=c++17 -O2 -static -o output.exe input.cpp -ladvapi32 -lversion -lshlwapi -lpsapi -lntdll -lkernel32 -luser32
```

## Troubleshooting

### Common Issues

1. **"No C++ compiler found"**
   - Install MinGW-w64, Visual Studio Build Tools, or Clang
   - Ensure compiler is in PATH environment variable

2. **"Missing Windows SDK headers"**
   - Install Windows SDK
   - Verify compiler installation includes headers

3. **"Compilation failed"**
   - Check error messages for specific issues
   - Ensure sufficient disk space
   - Try running as Administrator

4. **"Stub execution failed"**
   - Verify payload file exists and is readable
   - Check file permissions
   - Ensure required interpreters are installed (Node.js, Python, etc.)

### Debug Mode

To enable debug output, compile with debug flags:

```batch
# MinGW debug
g++ -std=c++17 -g -D_DEBUG -o debug_stub.exe input.cpp [libraries]

# Visual Studio debug
cl /EHsc /std:c++17 /Zi /Od /D_DEBUG /Fe:debug_stub.exe input.cpp [libraries]
```

## Advanced Usage

### Custom PE Templates

Generate custom PE templates:

```batch
native_stubs\pe_stub_template.exe
```

This creates:
- `console_stub.exe` - Console application template
- `gui_stub.exe` - GUI application template

### Resource Customization

Modify resource IDs in the source code:

```cpp
// Constants for resource IDs
static constexpr int RESOURCE_ENCRYPTED_DATA = 100;
static constexpr int RESOURCE_ENCRYPTION_KEY = 101;
static constexpr int RESOURCE_INIT_VECTOR = 102;
static constexpr int RESOURCE_CONFIG = 103;
```

### Anti-Analysis Customization

Enable/disable specific detection methods:

```cpp
struct AntiAnalysisFlags {
    bool checkDebugger = true;
    bool checkVirtualMachine = true;
    bool checkSandbox = true;
    bool checkTiming = true;
    bool checkProcessList = true;
    bool checkRegistry = true;
    bool checkFileSystem = true;
};
```

## Security Considerations

### Legal Use
- This tool is for educational and authorized testing purposes only
- Ensure you have permission to test on target systems
- Comply with local laws and regulations

### Detection Avoidance
- The anti-analysis features help avoid detection
- However, advanced security tools may still detect the stubs
- Use responsibly and ethically

### Payload Security
- Encrypt sensitive payloads
- Use strong encryption keys
- Implement proper key management

## Contributing

To contribute to this project:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is provided as-is for educational purposes. Use responsibly and in accordance with applicable laws.

## Support

For issues and questions:

1. Check the troubleshooting section
2. Review error messages carefully
3. Ensure all requirements are met
4. Test with simple payloads first

## Version History

- **v1.0** - Initial release with basic stub generation
- **v1.1** - Added PE template generation
- **v1.2** - Enhanced anti-analysis features
- **v1.3** - Improved payload execution engine

---

**Note**: This tool is designed for legitimate security testing and educational purposes. Always ensure you have proper authorization before testing on any system.
