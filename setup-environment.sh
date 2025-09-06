#!/usr/bin/env bash
set -euo pipefail

echo "=== Multi-Component Security Toolkit Setup ==="
echo "Setting up all project dependencies..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if running on supported system
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is required but not installed. Please install Node.js first.${NC}"
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Python 3 is required but not installed. Please install Python 3 first.${NC}"
    exit 1
fi

echo -e "${YELLOW}1. Setting up Node.js dependencies...${NC}"
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Node.js dependencies installed${NC}"
else
    echo -e "${RED}✗ Failed to install Node.js dependencies${NC}"
    exit 1
fi

echo -e "${YELLOW}2. Building VS Code extension...${NC}"
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ VS Code extension built successfully${NC}"
else
    echo -e "${RED}✗ Failed to build VS Code extension${NC}"
    exit 1
fi

echo -e "${YELLOW}3. Setting up Python environment...${NC}"

# Check if we can create virtual environment
if python3 -c "import venv" 2>/dev/null; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    echo -e "${GREEN}✓ Python virtual environment created and dependencies installed${NC}"
    echo -e "${YELLOW}Note: To use the RFI scanner, activate the virtual environment first:${NC}"
    echo "source venv/bin/activate"
else
    echo -e "${YELLOW}Virtual environment not available. Attempting system-wide install...${NC}"
    if pip3 install --break-system-packages -r requirements.txt 2>/dev/null; then
        echo -e "${GREEN}✓ Python dependencies installed system-wide${NC}"
    else
        echo -e "${RED}✗ Could not install Python dependencies${NC}"
        echo -e "${YELLOW}Manual installation required:${NC}"
        echo "sudo apt install python3-venv python3-pip"
        echo "python3 -m venv venv"
        echo "source venv/bin/activate"
        echo "pip install -r requirements.txt"
    fi
fi

echo -e "${YELLOW}4. Setting up demo environment...${NC}"
cd demo
if bash run-demo.sh > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Demo environment configured${NC}"
else
    echo -e "${YELLOW}! Demo setup had issues (non-critical)${NC}"
fi
cd ..

echo -e "${YELLOW}5. Making scripts executable...${NC}"
chmod +x setup-environment.sh
chmod +x integration-test.sh
chmod +x quick-test.sh
chmod +x demo/run-demo.sh
chmod +x tools/carmilla-openssl.js
chmod +x tools/carpatcher.js
echo -e "${GREEN}✓ Scripts made executable${NC}"

echo ""
echo -e "${GREEN}=== Setup Complete! ===${NC}"
echo ""
echo "Available components:"
echo "• VS Code Extension: Use Command Palette -> 'Hello:' commands"
echo "• RFI/LFI Scanner: python3 modern_rfi_scanner.py --help"
echo "• Encryption Server: npm start (opens http://localhost:8088)"
echo "• Carmilla CLI: node tools/carmilla-openssl.js --help"
echo "• Code Patcher: node tools/carpatcher.js --help"
echo "• Web Todo App: Open web-todo/index.html in browser"
echo ""
echo "Run './quick-test.sh' to verify all components are working."
echo ""
echo -e "${YELLOW}Important: This toolkit is for educational and authorized testing only!${NC}"