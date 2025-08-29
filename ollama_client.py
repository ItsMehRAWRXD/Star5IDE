#!/usr/bin/env python3
"""
Ollama Client Module
===================

This module provides integration with local Ollama instances for AI-powered
security analysis and report generation.

Author: Modern Security Tools
Version: 1.0
"""

import asyncio
import json
import logging
import requests
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from urllib.parse import urljoin

logger = logging.getLogger(__name__)

@dataclass
class OllamaConfig:
    """Configuration for Ollama connection"""
    base_url: str = "http://localhost:11434"
    model: str = "llama2"
    timeout: int = 30
    max_retries: int = 3

@dataclass
class OllamaResponse:
    """Response from Ollama API"""
    content: str
    model: str
    response_time: float
    tokens_used: Optional[int] = None
    error: Optional[str] = None

class OllamaClient:
    """Client for interacting with local Ollama instance"""
    
    def __init__(self, config: Optional[OllamaConfig] = None):
        self.config = config or OllamaConfig()
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'Modern-RFI-Scanner/2.0'
        })
    
    async def check_connection(self) -> bool:
        """Check if Ollama is running and accessible"""
        try:
            response = await asyncio.get_event_loop().run_in_executor(
                None, 
                lambda: self.session.get(
                    urljoin(self.config.base_url, "/api/tags"),
                    timeout=self.config.timeout
                )
            )
            return response.status_code == 200
        except Exception as e:
            logger.warning(f"Ollama connection check failed: {e}")
            return False
    
    async def list_models(self) -> List[Dict[str, Any]]:
        """List available models"""
        try:
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.session.get(
                    urljoin(self.config.base_url, "/api/tags"),
                    timeout=self.config.timeout
                )
            )
            if response.status_code == 200:
                data = response.json()
                return data.get('models', [])
            else:
                logger.error(f"Failed to list models: {response.status_code}")
                return []
        except Exception as e:
            logger.error(f"Error listing models: {e}")
            return []
    
    async def generate_response(
        self, 
        prompt: str, 
        model: Optional[str] = None,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None
    ) -> OllamaResponse:
        """Generate a response from Ollama"""
        start_time = asyncio.get_event_loop().time()
        
        payload = {
            "model": model or self.config.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": temperature
            }
        }
        
        if system_prompt:
            payload["system"] = system_prompt
        
        if max_tokens:
            payload["options"]["num_predict"] = max_tokens
        
        for attempt in range(self.config.max_retries):
            try:
                response = await asyncio.get_event_loop().run_in_executor(
                    None,
                    lambda: self.session.post(
                        urljoin(self.config.base_url, "/api/generate"),
                        json=payload,
                        timeout=self.config.timeout
                    )
                )
                
                if response.status_code == 200:
                    data = response.json()
                    response_time = asyncio.get_event_loop().time() - start_time
                    
                    return OllamaResponse(
                        content=data.get('response', ''),
                        model=data.get('model', model or self.config.model),
                        response_time=response_time,
                        tokens_used=data.get('eval_count')
                    )
                else:
                    logger.error(f"Ollama API error: {response.status_code} - {response.text}")
                    
            except Exception as e:
                logger.error(f"Attempt {attempt + 1} failed: {e}")
                if attempt < self.config.max_retries - 1:
                    await asyncio.sleep(1 * (attempt + 1))  # Exponential backoff
                continue
        
        response_time = asyncio.get_event_loop().time() - start_time
        return OllamaResponse(
            content="",
            model=model or self.config.model,
            response_time=response_time,
            error="All retry attempts failed"
        )
    
    async def analyze_scan_results(self, scan_results: List[Dict[str, Any]]) -> str:
        """Analyze scan results using AI"""
        if not scan_results:
            return "No scan results to analyze."
        
        # Create a summary of scan results
        total_scans = len(scan_results)
        vulnerable_count = sum(1 for result in scan_results if result.get('vulnerable', False))
        vulnerable_percentage = (vulnerable_count / total_scans) * 100 if total_scans > 0 else 0
        
        # Create detailed analysis prompt
        prompt = f"""
        Analyze the following security scan results and provide a comprehensive report:

        SCAN SUMMARY:
        - Total targets scanned: {total_scans}
        - Vulnerable targets found: {vulnerable_count}
        - Vulnerability rate: {vulnerable_percentage:.2f}%

        DETAILED RESULTS:
        {json.dumps(scan_results, indent=2)}

        Please provide:
        1. Executive summary of findings
        2. Risk assessment and severity levels
        3. Recommendations for remediation
        4. Technical details of vulnerabilities found
        5. Best practices for prevention

        Format the response as a professional security report.
        """
        
        system_prompt = """You are a cybersecurity expert analyzing security scan results. 
        Provide clear, actionable insights and professional recommendations."""
        
        response = await self.generate_response(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=0.3  # Lower temperature for more focused analysis
        )
        
        return response.content if not response.error else f"Analysis failed: {response.error}"
    
    async def generate_payload_suggestions(self, target_url: str, scan_context: str) -> str:
        """Generate custom payload suggestions based on target analysis"""
        prompt = f"""
        Analyze the following target and scan context to suggest custom security test payloads:

        TARGET: {target_url}
        CONTEXT: {scan_context}

        Please suggest:
        1. Custom RFI payloads specific to this target
        2. LFI payloads that might work
        3. Additional attack vectors to consider
        4. Evasion techniques to avoid detection

        Provide payloads in a format that can be directly used in security testing.
        """
        
        system_prompt = """You are a security researcher specializing in web application security testing. 
        Provide practical, effective payload suggestions for authorized security testing."""
        
        response = await self.generate_response(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=0.5
        )
        
        return response.content if not response.error else f"Payload generation failed: {response.error}"
    
    async def explain_vulnerability(self, vulnerability_data: Dict[str, Any]) -> str:
        """Explain a specific vulnerability in detail"""
        prompt = f"""
        Explain the following security vulnerability in detail:

        VULNERABILITY DATA:
        {json.dumps(vulnerability_data, indent=2)}

        Please provide:
        1. What this vulnerability is
        2. How it can be exploited
        3. Potential impact and risks
        4. How to fix it
        5. Prevention measures

        Make the explanation suitable for both technical and non-technical audiences.
        """
        
        system_prompt = """You are a cybersecurity educator explaining security vulnerabilities 
        in a clear, educational manner for authorized security testing purposes."""
        
        response = await self.generate_response(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=0.4
        )
        
        return response.content if not response.error else f"Explanation failed: {response.error}"

# Convenience function for quick Ollama usage
async def quick_ollama_query(prompt: str, model: str = "llama2") -> str:
    """Quick function for simple Ollama queries"""
    client = OllamaClient(OllamaConfig(model=model))
    
    # Check connection first
    if not await client.check_connection():
        return "Error: Ollama is not running or not accessible"
    
    response = await client.generate_response(prompt)
    return response.content if not response.error else f"Error: {response.error}"

if __name__ == "__main__":
    # Test the Ollama client
    async def test_ollama():
        client = OllamaClient()
        
        print("Testing Ollama connection...")
        if await client.check_connection():
            print("✓ Ollama is running")
            
            print("\nAvailable models:")
            models = await client.list_models()
            for model in models:
                print(f"  - {model.get('name', 'Unknown')}")
            
            print("\nTesting AI response...")
            response = await client.generate_response("Hello, how are you?")
            print(f"Response: {response.content}")
        else:
            print("✗ Ollama is not running or not accessible")
            print("Please start Ollama with: ollama serve")
    
    asyncio.run(test_ollama())