import sys
import json
import struct
import logging
import os
import requests
from typing import Dict, Any, Optional

# Configure logging to stderr for debugging, as stdout is used for communication
logging.basicConfig(stream=sys.stderr, level=logging.DEBUG)

# Helper function to read a message from stdin
def get_message():
    raw_length = sys.stdin.buffer.read(4)
    if not raw_length:
        return None
    length = struct.unpack('@I', raw_length)[0]
    message_bytes = sys.stdin.buffer.read(length)
    message_string = message_bytes.decode('utf-8')
    return json.loads(message_string)

# Helper function to send a message to stdout
def send_message(message):
    message_string = json.dumps(message)
    message_bytes = message_string.encode('utf-8')
    sys.stdout.buffer.write(struct.pack('@I', len(message_bytes)))
    sys.stdout.buffer.write(message_bytes)
    sys.stdout.buffer.flush()

# Get API key from environment variable or config file
def get_gemini_api_key() -> Optional[str]:
    # First try environment variable
    api_key = os.getenv('GEMINI_API_KEY')
    if api_key:
        return api_key
    
    # Then try config file
    config_path = os.path.join(os.path.dirname(__file__), 'gemini_config.json')
    try:
        if os.path.exists(config_path):
            with open(config_path, 'r') as f:
                config = json.load(f)
                return config.get('api_key')
    except Exception as e:
        logging.error(f"Error reading config file: {e}")
    
    return None

# Call Google Gemini API
def call_gemini_api(message: str, api_key: str) -> Dict[str, Any]:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={api_key}"
    
    payload = {
        "contents": [{
            "parts": [{
                "text": message
            }]
        }],
        "generationConfig": {
            "temperature": 0.7,
            "topK": 40,
            "topP": 0.95,
            "maxOutputTokens": 1024,
        }
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        logging.error(f"API request failed: {e}")
        raise

# Process an incoming message with enhanced functionality
def process_message(message):
    action = message.get("action")
    
    if action == "sayHello":
        return {"response": "Hello from the Private AI Co Pilot native host!"}
    
    elif action == "echo":
        return {"response": message.get("payload")}
    
    elif action == "chatMessage":
        # Handle AI chat messages
        user_message = message.get("message")
        if not user_message:
            return {"error": "No message provided"}
        
        api_key = get_gemini_api_key()
        if not api_key:
            return {"error": "Gemini API key not configured. Please set GEMINI_API_KEY environment variable or create gemini_config.json"}
        
        try:
            api_response = call_gemini_api(user_message, api_key)
            
            if api_response.get("candidates") and api_response["candidates"][0].get("content"):
                ai_response = api_response["candidates"][0]["content"]["parts"][0]["text"]
                return {"response": ai_response}
            else:
                return {"error": "Invalid response format from Gemini API"}
                
        except Exception as e:
            logging.error(f"Error calling Gemini API: {e}")
            return {"error": f"API call failed: {str(e)}"}
    
    elif action == "getApiKey":
        # Return API key status (without exposing the actual key)
        api_key = get_gemini_api_key()
        return {"hasApiKey": bool(api_key)}
    
    else:
        # Reject invalid or unauthorized commands
        logging.error(f"Received invalid action: {action}")
        return {"error": "Invalid or unauthorized command."}

def main():
    while True:
        try:
            message = get_message()
            if message is None:
                break
            
            logging.info(f"Received message: {message}")
            response = process_message(message)
            send_message(response)
            
        except Exception as ex:
            logging.error(f"Error occurred: {ex}")
            break

if __name__ == '__main__':
    # On Windows, the first argument is the extension ID
    # In a production app, you would validate this against your extension's ID
    if len(sys.argv) > 1:
        logging.info(f"Connected from extension: {sys.argv[1]}")
    
    # Run the main communication loop
    main()

