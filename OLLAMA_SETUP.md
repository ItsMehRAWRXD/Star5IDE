# Ollama Local LLM Integration

This project now includes support for connecting to a local Ollama instance for running Large Language Models (LLMs) locally.

## Prerequisites

1. **Install Ollama**: Download and install Ollama from [https://ollama.ai](https://ollama.ai)

2. **Start Ollama**: Run the Ollama service
   ```bash
   ollama serve
   ```

3. **Pull a model**: Download a model to use (e.g., llama2, mistral, codellama)
   ```bash
   ollama pull llama2
   ```

## Installation

Install the required Python dependencies:

```bash
pip install -r requirements.txt
```

## Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` to configure your Ollama settings (optional - defaults work for standard setup)

## Usage

### Quick Start

Run the example script to test your Ollama connection:

```bash
python ollama_example.py
```

### Using in Your Code

```python
from ollama_client import OllamaClient, quick_chat

# Create a client
client = OllamaClient()

# Quick chat
response = quick_chat("llama2", "Hello, how are you?")
print(response)

# Full chat with context
messages = [
    {"role": "system", "content": "You are a helpful coding assistant."},
    {"role": "user", "content": "Write a Python function to calculate factorial"}
]
response = client.chat(model="llama2", messages=messages)
print(response['message']['content'])
```

## Available Methods

- `OllamaClient()` - Create a client instance
- `client.list_models()` - List available models
- `client.chat()` - Chat with a model
- `client.generate()` - Generate text completion
- `client.pull_model()` - Download a new model
- `client.check_connection()` - Verify Ollama is running
- `quick_chat()` - One-line chat function

## Troubleshooting

1. **Connection Error**: Make sure Ollama is running (`ollama serve`)
2. **No Models Found**: Pull a model first (`ollama pull llama2`)
3. **Different Host**: Set `OLLAMA_HOST` in your `.env` file or pass it to the client

## Popular Models

- `llama2` - Meta's Llama 2 model
- `mistral` - Mistral AI's 7B model
- `codellama` - Code-focused Llama model
- `phi` - Microsoft's small language model
- `neural-chat` - Intel's fine-tuned model

Pull any model with: `ollama pull <model-name>`