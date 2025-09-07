# JSON-Driven Stub Generator

A comprehensive, pure native C++ stub generation system that uses JSON configuration files to generate and attach various types of protection stubs to executable files. No .NET dependencies required.

## Features

### 🔒 Anti-Analysis Stubs
- **Anti-Debug**: Multiple detection methods (IsDebuggerPresent, CheckRemoteDebuggerPresent, NtQueryInformationProcess, Hardware Breakpoints, Timing Checks)
- **Anti-VM**: Registry artifacts, process list, file system, hardware info, network adapters detection
- **Anti-Sandbox**: User interaction, system uptime, memory size, CPU cores, disk space checks

### 🔑 Licensing & Protection
- **License Check**: Online/offline validation, AES-encrypted licenses, hardware binding, expiration checks
- **Payload Protection**: AES-256-GCM encryption, PBKDF2 key derivation, memory mapping, on-demand decryption
- **Code Obfuscation**: Instruction substitution, dead code injection, control flow flattening, string encryption

### 🛡️ Self-Protection
- **Integrity Check**: File hash verification, section integrity, import table validation, resource verification
- **Anti-Tampering**: Debugger detection, memory protection, code injection prevention, hook detection

### 📡 Telemetry & Updates
- **Telemetry Blocker**: Blocks Microsoft telemetry, Google analytics, and other tracking domains
- **Auto-Updater**: Configurable update checking, downloading, and installation

## Quick Start

### 1. Build the Generator

```batch
# From Visual Studio Developer Command Prompt
cd RawrZ_Dev
build_json_stub_generator.bat
```

### 2. Configure Your Targets

Edit `stub_config.json` to specify:
- Target executables to protect
- Types of stubs to apply
- Injection methods and priorities
- Encryption settings

### 3. Generate Stubs

```batch
# Using the C++ generator
json_stub_generator.exe stub_config.json

# Or using PowerShell (more features)
powershell -ExecutionPolicy Bypass -File json_stub_processor.ps1 -ConfigFile stub_config.json -GenerateReport
```

## Configuration Structure

### Target Executables

```json
{
  "target_executables": [
    {
      "name": "calculator.exe",
      "path": "./calc_executables/calc.exe",
      "output_path": "./protected/calc_protected.exe",
      "enabled": true,
      "backup_original": true
    }
  ]
}
```

### Stub Configurations

```json
{
  "stub_configurations": {
    "anti_analysis": {
      "enabled": true,
      "priority": 1,
      "stubs": [
        {
          "type": "anti_debug",
          "enabled": true,
          "methods": [
            "IsDebuggerPresent",
            "CheckRemoteDebuggerPresent",
            "NtQueryInformationProcess"
          ],
          "actions": {
            "on_detection": "exit_process",
            "exit_code": 0,
            "delay_ms": 100
          }
        }
      ]
    }
  }
}
```

### Injection Methods

```json
{
  "injection_methods": {
    "primary": "resource_section",
    "fallback": "code_section",
    "options": {
      "resource_section": {
        "enabled": true,
        "resource_type": "CUSTOM_DATA",
        "resource_id": 1337,
        "encrypt_resource": true
      },
      "entry_point_modification": {
        "enabled": true,
        "preserve_original": true,
        "stub_execution_order": "before_main"
      }
    }
  }
}
```

## Advanced Usage

### PowerShell Processing

The PowerShell script provides additional features:

```powershell
# Validate configuration only
.\json_stub_processor.ps1 -ConfigFile stub_config.json -ValidateOnly

# Generate with custom directories
.\json_stub_processor.ps1 -ConfigFile stub_config.json -OutputDir "C:\protected" -BackupDir "C:\backups"

# Generate with detailed report
.\json_stub_processor.ps1 -ConfigFile stub_config.json -GenerateReport -Verbose
```

### Batch Processing

Enable batch processing for multiple targets:

```json
{
  "batch_processing": {
    "enabled": true,
    "max_concurrent": 4,
    "continue_on_error": false,
    "generate_report": true,
    "report_format": "json"
  }
}
```

### Custom Stub Types

Add custom stub types by extending the `StubType` enum and implementing the corresponding generation method:

```cpp
enum class StubType {
    // ... existing types ...
    CUSTOM_PROTECTION
};

std::vector<uint8_t> JSONStubGenerator::GenerateCustomProtectionStub(const json& params) {
    // Your custom stub generation logic
    return custom_stub_data;
}
```

## Compilation Requirements

### Prerequisites
- Visual Studio 2019/2022 with C++ development tools
- Windows SDK 10.0.19041.0 or later
- C++17 support enabled

### Dependencies
- **nlohmann/json**: Automatically downloaded during build
- **Windows Libraries**: advapi32, version, shlwapi, psapi, ntdll, imagehlp

### Compiler Flags
```batch
cl /EHsc /std:c++17 /O2 /MT /I"." /I"nlohmann" json_stub_generator.cpp
```

## Output Structure

```
RawrZ_Dev/
├── protected/                    # Protected executables
│   ├── calc_protected.exe
│   └── notepad_protected.exe
├── backups/                     # Original file backups
│   ├── calculator.exe.backup
│   └── notepad.exe.backup
├── logs/                        # Generation logs
├── stub_generation_report.json  # Detailed report
└── stub_config.json            # Configuration file
```

## Security Features

### Encryption
- **AES-256-GCM**: Authenticated encryption for stubs and payloads
- **PBKDF2**: Key derivation with configurable iterations
- **Random Key Generation**: Cryptographically secure random keys

### Anti-Analysis
- **Multiple Detection Methods**: Redundant detection techniques
- **Configurable Responses**: Exit, delay, or custom actions
- **Hardware Binding**: Machine-specific protection

### Integrity Protection
- **Hash Verification**: SHA-256 integrity checks
- **Section Validation**: PE section integrity verification
- **Anti-Tampering**: Runtime protection against modifications

## Troubleshooting

### Common Issues

1. **Compilation Errors**
   - Ensure Visual Studio Developer Command Prompt is used
   - Check Windows SDK installation
   - Verify C++17 support

2. **Runtime Errors**
   - Check target file paths in configuration
   - Verify file permissions
   - Ensure target files are valid PE executables

3. **Stub Injection Failures**
   - Check PE file validity
   - Verify section alignment requirements
   - Review injection method configuration

### Debug Mode

Enable verbose logging:

```powershell
.\json_stub_processor.ps1 -ConfigFile stub_config.json -Verbose
```

### Validation

Test configuration before processing:

```powershell
.\json_stub_processor.ps1 -ConfigFile stub_config.json -ValidateOnly
```

## Performance Considerations

### Optimization
- **Release Build**: Use `/O2` optimization flag
- **Multi-threading**: Configure `max_concurrent` for batch processing
- **Memory Management**: Efficient vector operations for large files

### Resource Usage
- **Disk Space**: Backup files and protected executables
- **Memory**: Configurable buffer sizes for file processing
- **CPU**: Optimized stub generation algorithms

## Extending the System

### Adding New Stub Types

1. Extend the `StubType` enum
2. Implement the generation method
3. Add configuration parameters
4. Update the JSON schema

### Custom Injection Methods

1. Implement new injection logic
2. Add configuration options
3. Update PE manipulation code
4. Test with various file types

### Integration with Other Tools

The system can be integrated with:
- CI/CD pipelines
- Automated testing frameworks
- Security analysis tools
- Deployment systems

## License

This project is provided as-is for educational and research purposes. Use responsibly and in accordance with applicable laws and regulations.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review configuration examples
3. Validate JSON schema
4. Check compilation requirements

---

**Note**: This tool is designed for legitimate software protection purposes. Ensure compliance with all applicable laws and regulations when using this software.
