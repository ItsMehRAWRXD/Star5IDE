"""
Ollama Client Module for Local LLM Connection
This module provides a wrapper for connecting to a local Ollama instance
"""

import os
import json
from typing import Optional, Dict, List, Any
import ollama
from ollama import Client


class OllamaClient:
    """
    Client for interacting with local Ollama instance
    """
    
    def __init__(self, host: Optional[str] = None):
        """
        Initialize Ollama client
        
        Args:
            host: Ollama host URL. Defaults to http://localhost:11434
        """
        self.host = host or os.getenv('OLLAMA_HOST', 'http://localhost:11434')
        self.client = Client(host=self.host)
        
    def list_models(self) -> List[Dict[str, Any]]:
        """
        List all available models in the local Ollama instance
        
        Returns:
            List of model information dictionaries
        """
        try:
            response = self.client.list()
            return response.get('models', [])
        except Exception as e:
            print(f"Error listing models: {e}")
            return []
    
    def chat(self, 
             model: str, 
             messages: List[Dict[str, str]], 
             stream: bool = False,
             temperature: float = 0.7,
             **kwargs) -> Dict[str, Any]:
        """
        Send a chat request to Ollama
        
        Args:
            model: Model name to use (e.g., 'llama2', 'mistral')
            messages: List of message dictionaries with 'role' and 'content'
            stream: Whether to stream the response
            temperature: Temperature for generation (0.0 to 1.0)
            **kwargs: Additional parameters for the model
            
        Returns:
            Response dictionary from Ollama
        """
        try:
            response = self.client.chat(
                model=model,
                messages=messages,
                stream=stream,
                options={
                    'temperature': temperature,
                    **kwargs
                }
            )
            return response
        except Exception as e:
            return {'error': str(e)}
    
    def generate(self, 
                 model: str, 
                 prompt: str, 
                 stream: bool = False,
                 temperature: float = 0.7,
                 **kwargs) -> Dict[str, Any]:
        """
        Generate text completion
        
        Args:
            model: Model name to use
            prompt: Text prompt
            stream: Whether to stream the response
            temperature: Temperature for generation
            **kwargs: Additional parameters
            
        Returns:
            Response dictionary from Ollama
        """
        try:
            response = self.client.generate(
                model=model,
                prompt=prompt,
                stream=stream,
                options={
                    'temperature': temperature,
                    **kwargs
                }
            )
            return response
        except Exception as e:
            return {'error': str(e)}
    
    def pull_model(self, model_name: str) -> bool:
        """
        Pull/download a model from Ollama registry
        
        Args:
            model_name: Name of the model to pull
            
        Returns:
            True if successful, False otherwise
        """
        try:
            self.client.pull(model_name)
            print(f"Successfully pulled model: {model_name}")
            return True
        except Exception as e:
            print(f"Error pulling model {model_name}: {e}")
            return False
    
    def check_connection(self) -> bool:
        """
        Check if Ollama server is accessible
        
        Returns:
            True if connection successful, False otherwise
        """
        try:
            self.list_models()
            return True
        except:
            return False


# Convenience functions for quick usage
def create_client(host: Optional[str] = None) -> OllamaClient:
    """Create and return an Ollama client instance"""
    return OllamaClient(host=host)


def quick_chat(model: str, prompt: str, host: Optional[str] = None) -> str:
    """
    Quick one-shot chat with Ollama
    
    Args:
        model: Model to use
        prompt: User prompt
        host: Optional Ollama host
        
    Returns:
        Model response as string
    """
    client = OllamaClient(host=host)
    messages = [{"role": "user", "content": prompt}]
    response = client.chat(model=model, messages=messages)
    
    if 'error' in response:
        return f"Error: {response['error']}"
    
    return response.get('message', {}).get('content', '')