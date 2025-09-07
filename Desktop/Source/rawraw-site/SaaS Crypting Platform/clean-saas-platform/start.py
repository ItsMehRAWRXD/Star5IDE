#!/usr/bin/env python3
"""
Simple startup script for the SaaS Crypting Platform
"""

import os
import sys

def main():
    print("Starting SaaS Crypting Platform...")
    
    # Check if required packages are installed
    try:
        import flask
        import flask_sqlalchemy
        import flask_jwt_extended
        import flask_cors
        print("All required packages are installed")
    except ImportError as e:
        print(f"Missing package: {e}")
        print("Please run: pip install -r requirements.txt")
        return 1
    
    # Check if main.py exists
    if not os.path.exists("main.py"):
        print("main.py not found")
        return 1
    
    # Import and run the main application
    try:
        from main import app
        print("Application loaded successfully")
        print("API will be available at: http://localhost:5000")
        print("First user to register will become admin")
        print("Press Ctrl+C to stop")
        
        app.run(host="0.0.0.0", port=5000, debug=True)
        
    except Exception as e:
        print(f"Error starting application: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
