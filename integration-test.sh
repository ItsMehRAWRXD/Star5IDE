#!/usr/bin/env bash
set -euo pipefail

echo "=== Integration Test Suite ==="
echo "Testing all components of the project..."

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

success_count=0
total_tests=0

test_result() {
    local test_name="$1"
    local result="$2"
    ((total_tests++))
    if [ "$result" = "0" ]; then
        echo -e "${GREEN}✓${NC} $test_name"
        ((success_count++))
    else
        echo -e "${RED}✗${NC} $test_name"
    fi
}

echo -e "\n${YELLOW}1. Testing Carmilla OpenSSL CLI${NC}"
# Test encryption/decryption
echo "Testing encryption..." | node tools/carmilla-openssl.js encrypt --pass testpass > test.pkg 2>/dev/null
test_result "Encrypt with Carmilla CLI" $?

node tools/carmilla-openssl.js decrypt --pass testpass < test.pkg > test.out 2>/dev/null
if [ -f test.out ] && [ "$(cat test.out)" = "Testing encryption..." ]; then
    test_result "Decrypt with Carmilla CLI" 0
else
    test_result "Decrypt with Carmilla CLI" 1
fi

echo -e "\n${YELLOW}2. Testing Carpatcher Tool${NC}"
# Test code patching
echo 'console.log("start"); Car(); console.log("end");' > test-target.js
node tools/carpatcher.js js test-target.js --patch 'console.log("injected");' > patched.js 2>/dev/null
if grep -q "injected" patched.js; then
    test_result "Carpatcher code injection" 0
else
    test_result "Carpatcher code injection" 1
fi

echo -e "\n${YELLOW}3. Testing RFI Scanner${NC}"
# Test scanner help
if python3 modern_rfi_scanner.py --help > /dev/null 2>&1; then
    test_result "RFI Scanner help" 0
else
    test_result "RFI Scanner help" 1
fi

# Test scanner basic functionality
python3 simple_test.py > /dev/null 2>&1
test_result "RFI Scanner basic tests" $?

echo -e "\n${YELLOW}4. Testing VS Code Extension Build${NC}"
# Test TypeScript compilation
npm run build > /dev/null 2>&1
test_result "VS Code extension build" $?

if [ -f out/extension.js ]; then
    test_result "Extension JS output exists" 0
else
    test_result "Extension JS output exists" 1
fi

echo -e "\n${YELLOW}5. Testing Demo Components${NC}"
# Test demo encryption/decryption
cd demo
bash run-demo.sh > demo-output.txt 2>&1
if grep -q "decrypted" demo-output.txt; then
    test_result "Demo encryption/decryption" 0
else
    test_result "Demo encryption/decryption" 1
fi
cd ..

echo -e "\n${YELLOW}6. Testing Web Todo App${NC}"
# Check if web-todo files exist and are valid
if [ -f web-todo/index.html ] && [ -f web-todo/app.js ] && [ -f web-todo/style.css ]; then
    # Basic HTML validation
    if grep -q "To‑Do List" web-todo/index.html; then
        test_result "Web Todo app files" 0
    else
        test_result "Web Todo app files" 1
    fi
else
    test_result "Web Todo app files" 1
fi

echo -e "\n${YELLOW}7. Testing Server Components${NC}"
# Test server startup (brief)
timeout 3s node server/encrypt_server.js > /dev/null 2>&1 &
sleep 1
if curl -s http://localhost:8088/health > /dev/null 2>&1; then
    test_result "Encrypt server startup" 0
else
    test_result "Encrypt server startup" 1
fi
pkill -f encrypt_server.js 2>/dev/null || true

# Cleanup
rm -f test.pkg test.out test-target.js patched.js demo/demo-output.txt

echo -e "\n${YELLOW}=== Test Results ===${NC}"
echo -e "Passed: ${GREEN}$success_count${NC}/$total_tests tests"

if [ "$success_count" -eq "$total_tests" ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed.${NC}"
    exit 1
fi