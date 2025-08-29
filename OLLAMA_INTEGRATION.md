# Ollama Integration Guide

This project now includes local Ollama integration for AI-powered security analysis and assistance.

## Features

### Python Integration
- **AI-powered scan analysis**: Automatically analyze scan results with detailed reports
- **Custom payload generation**: Get AI-suggested payloads based on target analysis
- **Vulnerability explanations**: Detailed explanations of security vulnerabilities
- **Async support**: Non-blocking AI operations

### VS Code Extension Integration
- **Status bar indicator**: Shows Ollama connection status
- **Code analysis**: Analyze current file or selection for security issues
- **Quick queries**: Ask Ollama questions directly from VS Code
- **Command palette integration**: Easy access to all Ollama features

## Installation

### 1. Install Ollama

First, install Ollama on your system:

**Linux/macOS:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

**Windows:**
Download from [https://ollama.ai](https://ollama.ai)

### 2. Start Ollama

```bash
ollama serve
```

### 3. Install a Model

```bash
# Install the default model (llama2)
ollama pull llama2

# Or install other models
ollama pull codellama
ollama pull mistral
```

### 4. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 5. Install Node.js Dependencies (for VS Code extension)

```bash
npm install
```

## Usage

### Python Scanner with AI Analysis

Run the scanner with AI analysis enabled:

```bash
# Basic scan with AI analysis
python modern_rfi_scanner.py --targets targets.txt --ai-analysis

# Specify a different model
python modern_rfi_scanner.py --targets targets.txt --ai-analysis --ollama-model codellama

# Single URL scan with AI analysis
python modern_rfi_scanner.py --url "http://example.com/page.php?id=" --ai-analysis
```

### VS Code Extension

1. **Open Command Palette** (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. **Search for "Ollama"** to see available commands:
   - `Ollama: Show Status` - Check Ollama connection and available models
   - `Ollama: Analyze Current File` - Analyze the current file for security issues
   - `Ollama: Quick Query` - Ask Ollama a question

### Status Bar

The VS Code extension shows Ollama status in the status bar:
- 🟢 `$(light-bulb) Ollama` - Ollama is running
- 🔴 `$(error) Ollama` - Ollama is not running

Click the status bar item to see detailed status information.

## Testing

Run the integration test to verify everything is working:

```bash
python test_ollama_integration.py
```

This will test:
- Ollama connection
- Model availability
- Basic response generation
- Scan results analysis
- Integration with the main scanner

## Configuration

### Python Configuration

You can customize the Ollama client behavior:

```python
from ollama_client import OllamaClient, OllamaConfig

# Custom configuration
config = OllamaConfig(
    base_url="http://localhost:11434",  # Ollama API URL
    model="codellama",                  # Default model
    timeout=30,                         # Request timeout
    max_retries=3                       # Retry attempts
)

client = OllamaClient(config)
```

### VS Code Configuration

Add these settings to your VS Code settings.json:

```json
{
    "ollama.baseUrl": "http://localhost:11434",
    "ollama.defaultModel": "llama2",
    "ollama.timeout": 30000
}
```

## API Reference

### Python Client

#### `OllamaClient`

Main client class for interacting with Ollama.

**Methods:**
- `check_connection()` - Check if Ollama is running
- `list_models()` - Get available models
- `generate_response(prompt, options)` - Generate AI response
- `analyze_scan_results(results)` - Analyze security scan results
- `generate_payload_suggestions(target, context)` - Generate custom payloads
- `explain_vulnerability(data)` - Explain security vulnerabilities

#### `OllamaConfig`

Configuration class for Ollama client.

**Parameters:**
- `base_url` - Ollama API URL (default: "http://localhost:11434")
- `model` - Default model name (default: "llama2")
- `timeout` - Request timeout in seconds (default: 30)
- `max_retries` - Maximum retry attempts (default: 3)

### VS Code Extension

#### `OllamaExtension`

Main extension class for VS Code integration.

**Methods:**
- `showStatus()` - Show Ollama connection status
- `analyzeCurrentFile()` - Analyze current file for security issues
- `quickQuery(prompt)` - Send a quick query to Ollama

## Examples

### Python Examples

```python
import asyncio
from ollama_client import OllamaClient

async def example():
    client = OllamaClient()
    
    # Check connection
    if await client.check_connection():
        print("Ollama is running!")
        
        # Generate response
        response = await client.generate_response("Explain RFI vulnerability")
        print(response.content)
        
        # Analyze scan results
        results = [{"url": "http://test.com", "vulnerable": True}]
        analysis = await client.analyze_scan_results(results)
        print(analysis)

asyncio.run(example())
```

### VS Code Extension Examples

```typescript
import { OllamaClient } from './ollama-client';

const client = new OllamaClient();

// Check connection
const isConnected = await client.checkConnection();
if (isConnected) {
    // Generate response
    const response = await client.generateResponse("Hello, Ollama!");
    console.log(response.content);
}
```

## Troubleshooting

### Common Issues

1. **"Ollama is not running"**
   - Start Ollama: `ollama serve`
   - Check if port 11434 is available

2. **"No models found"**
   - Install a model: `ollama pull llama2`
   - Check available models: `ollama list`

3. **Import errors**
   - Install dependencies: `pip install -r requirements.txt`
   - Check Python path and imports

4. **VS Code extension not working**
   - Reload VS Code window
   - Check extension logs
   - Verify Node.js dependencies are installed

### Debug Mode

Enable debug logging:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Check Ollama Status

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# List models
ollama list

# Test model
ollama run llama2 "Hello, world!"
```

## Security Notes

- This integration is for **educational and authorized security testing only**
- All AI analysis is performed locally on your machine
- No data is sent to external services
- Use only on systems you own or have permission to test

## Contributing

To add new AI features:

1. Extend the `OllamaClient` class with new methods
2. Add corresponding VS Code extension commands
3. Update this documentation
4. Add tests to `test_ollama_integration.py`

## License

This integration follows the same license as the main project. Use responsibly and only for authorized security testing.