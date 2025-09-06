#!/usr/bin/env bash
set -euo pipefail

echo "=== Quick Feature Test ==="

# Test 1: Carmilla CLI
echo "Testing Carmilla CLI..."
echo "test data" | node tools/carmilla-openssl.js encrypt --pass demo > test.pkg
if [ -f test.pkg ]; then
    echo "✓ Encryption works"
    node tools/carmilla-openssl.js decrypt --pass demo < test.pkg > decrypted.txt
    if [ "$(cat decrypted.txt)" = "test data" ]; then
        echo "✓ Decryption works"
    else
        echo "✗ Decryption failed"
    fi
else
    echo "✗ Encryption failed"
fi

# Test 2: VS Code Extension Build
echo "Testing VS Code extension build..."
npm run build > /dev/null 2>&1
if [ -f out/extension.js ]; then
    echo "✓ Extension builds successfully"
else
    echo "✗ Extension build failed"
fi

# Test 3: Scanner
echo "Testing RFI Scanner..."
if python3 modern_rfi_scanner.py --help > /dev/null 2>&1; then
    echo "✓ Scanner is functional"
else
    echo "✗ Scanner has issues"
fi

# Test 4: Web Todo
echo "Testing Web Todo app..."
if [ -f web-todo/index.html ] && [ -f web-todo/app.js ] && [ -f web-todo/style.css ]; then
    echo "✓ Web Todo app files present"
else
    echo "✗ Web Todo app incomplete"
fi

# Test 5: Server files
echo "Testing Server components..."
if [ -f server/encrypt_server.js ] && [ -f server/public/index.html ]; then
    echo "✓ Server components present"
else
    echo "✗ Server components missing"
fi

# Cleanup
rm -f test.pkg decrypted.txt

echo "=== Test Complete ==="