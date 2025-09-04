#!/bin/bash

# Carmilla Todo System Quick Start Script

echo "╔════════════════════════════════════════════════╗"
echo "║     Carmilla Encrypted Todo System Setup      ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

# Check Node.js
echo "Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi
NODE_VERSION=$(node -v)
echo "✅ Node.js installed: $NODE_VERSION"

# Check npm
echo "Checking npm..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi
NPM_VERSION=$(npm -v)
echo "✅ npm installed: $NPM_VERSION"

# Check OpenSSL
echo "Checking OpenSSL..."
if ! command -v openssl &> /dev/null; then
    echo "⚠️  Warning: OpenSSL is not installed."
    echo "   Encryption features will not work without OpenSSL."
    echo "   Install OpenSSL with:"
    echo "   - Ubuntu/Debian: sudo apt-get install openssl"
    echo "   - macOS: brew install openssl"
    echo "   - Windows: Download from https://www.openssl.org/"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    OPENSSL_VERSION=$(openssl version)
    echo "✅ OpenSSL installed: $OPENSSL_VERSION"
fi

echo ""
echo "Installing dependencies..."
npm install

echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║            Setup Complete! 🎉                 ║"
echo "╠════════════════════════════════════════════════╣"
echo "║  Start development:                            ║"
echo "║    npm run dev                                 ║"
echo "║                                                ║"
echo "║  Build for production:                        ║"
echo "║    npm run build                              ║"
echo "║    npm start                                   ║"
echo "║                                                ║"
echo "║  Frontend: http://localhost:3000              ║"
echo "║  Backend:  http://localhost:3001/api          ║"
echo "╚════════════════════════════════════════════════╝"
echo ""
echo "Starting development servers..."
npm run dev