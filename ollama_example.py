#!/usr/bin/env python3
"""
Example usage of the Ollama client
Demonstrates various ways to interact with local Ollama instance
"""

import os
from dotenv import load_dotenv
from ollama_client import OllamaClient, quick_chat

# Load environment variables
load_dotenv()


def main():
    # Create client instance
    client = OllamaClient()
    
    print("Ollama Client Example")
    print("=" * 50)
    
    # Check connection
    print("\n1. Checking Ollama connection...")
    if client.check_connection():
        print("✓ Successfully connected to Ollama")
    else:
        print("✗ Could not connect to Ollama. Make sure Ollama is running locally.")
        print("  Run: ollama serve")
        return
    
    # List available models
    print("\n2. Available models:")
    models = client.list_models()
    if models:
        for model in models:
            print(f"  - {model['name']} ({model.get('size', 'N/A')})")
    else:
        print("  No models found. Pull a model first:")
        print("  Run: ollama pull llama2")
    
    # Example 1: Simple chat
    print("\n3. Simple chat example:")
    model_name = os.getenv('OLLAMA_DEFAULT_MODEL', 'llama2')
    
    if not models:
        print(f"  Attempting to pull {model_name}...")
        if client.pull_model(model_name):
            print(f"  ✓ Model {model_name} pulled successfully")
        else:
            print(f"  ✗ Failed to pull {model_name}")
            return
    
    messages = [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "What is Python and why is it popular?"}
    ]
    
    print(f"  Using model: {model_name}")
    print("  User: What is Python and why is it popular?")
    
    response = client.chat(model=model_name, messages=messages)
    if 'error' not in response:
        print(f"  Assistant: {response['message']['content']}")
    else:
        print(f"  Error: {response['error']}")
    
    # Example 2: Quick chat (one-liner)
    print("\n4. Quick chat example:")
    quick_response = quick_chat(
        model=model_name,
        prompt="Write a haiku about programming"
    )
    print(f"  Haiku: {quick_response}")
    
    # Example 3: Text generation
    print("\n5. Text generation example:")
    gen_response = client.generate(
        model=model_name,
        prompt="Complete this Python function:\ndef fibonacci(n):\n    # Generate the nth Fibonacci number\n",
        temperature=0.2  # Lower temperature for more deterministic code
    )
    
    if 'error' not in gen_response:
        print(f"  Generated code:\n{gen_response['response']}")
    else:
        print(f"  Error: {gen_response['error']}")
    
    # Example 4: Streaming response
    print("\n6. Streaming example:")
    print("  Streaming response for: 'Explain recursion in one sentence'")
    print("  Response: ", end="", flush=True)
    
    stream_messages = [
        {"role": "user", "content": "Explain recursion in one sentence"}
    ]
    
    for chunk in client.client.chat(
        model=model_name, 
        messages=stream_messages, 
        stream=True
    ):
        print(chunk['message']['content'], end="", flush=True)
    print()  # New line after streaming
    
    print("\n" + "=" * 50)
    print("Example completed!")


if __name__ == "__main__":
    # Note: python-dotenv is optional, install with: pip install python-dotenv
    try:
        main()
    except ImportError as e:
        if 'dotenv' in str(e):
            print("Note: python-dotenv not installed. Running without .env file.")
            print("Install with: pip install python-dotenv")
            # Run without dotenv
            from ollama_client import OllamaClient
            client = OllamaClient()
            if client.check_connection():
                print("Connected to Ollama successfully!")
            else:
                print("Could not connect to Ollama.")
    except KeyboardInterrupt:
        print("\nExample interrupted by user.")