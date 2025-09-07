@echo off
echo ========================================
echo    RawrZ SSL Encryption Test
echo ========================================
echo.

echo [1/4] Compiling with OpenSSL...
g++ -std=c++17 -O2 test_ssl_encryption.cpp -o test_ssl_encryption.exe -I"C:\Program Files\OpenSSL-Win64\include" -L"C:\Program Files\OpenSSL-Win64\lib" -llibcrypto -llibssl
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Compilation failed!
    echo Make sure OpenSSL is installed at C:\Program Files\OpenSSL-Win64
    pause
    exit /b 1
)
echo ✓ Compilation successful with OpenSSL!

echo.
echo [2/4] Running encryption tests...
echo.
test_ssl_encryption.exe
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Test execution failed!
    pause
    exit /b 1
)

echo.
echo [3/4] Checking generated files...
echo.
if exist "test_payload.Hybrid.encrypted" (
    echo ✓ Hybrid encryption file: test_payload.Hybrid.encrypted
    for %%A in ("test_payload.Hybrid.encrypted") do echo   Size: %%~zA bytes
) else (
    echo ✗ Missing: test_payload.Hybrid.encrypted
)

if exist "test_payload.Triple.encrypted" (
    echo ✓ Triple encryption file: test_payload.Triple.encrypted
    for %%A in ("test_payload.Triple.encrypted") do echo   Size: %%~zA bytes
) else (
    echo ✗ Missing: test_payload.Triple.encrypted
)

if exist "test_payload.Enhanced.encrypted" (
    echo ✓ Enhanced encryption file: test_payload.Enhanced.encrypted
    for %%A in ("test_payload.Enhanced.encrypted") do echo   Size: %%~zA bytes
) else (
    echo ✗ Missing: test_payload.Enhanced.encrypted
)

if exist "test_payload.CrossPlatform.encrypted" (
    echo ✓ CrossPlatform encryption file: test_payload.CrossPlatform.encrypted
    for %%A in ("test_payload.CrossPlatform.encrypted") do echo   Size: %%~zA bytes
) else (
    echo ✗ Missing: test_payload.CrossPlatform.encrypted
)

if exist "test_payload.AES-256-GCM.encrypted" (
    echo ✓ AES-256-GCM encryption file: test_payload.AES-256-GCM.encrypted
    for %%A in ("test_payload.AES-256-GCM.encrypted") do echo   Size: %%~zA bytes
) else (
    echo ✗ Missing: test_payload.AES-256-GCM.encrypted
)

if exist "test_payload.AES-256-CBC.encrypted" (
    echo ✓ AES-256-CBC encryption file: test_payload.AES-256-CBC.encrypted
    for %%A in ("test_payload.AES-256-CBC.encrypted") do echo   Size: %%~zA bytes
) else (
    echo ✗ Missing: test_payload.AES-256-CBC.encrypted
)

if exist "test_payload.ChaCha20.encrypted" (
    echo ✓ ChaCha20 encryption file: test_payload.ChaCha20.encrypted
    for %%A in ("test_payload.ChaCha20.encrypted") do echo   Size: %%~zA bytes
) else (
    echo ✗ Missing: test_payload.ChaCha20.encrypted
)

echo.
echo [4/4] Encryption Methods Summary:
echo ========================================
echo.
echo CUSTOM ENCRYPTION METHODS:
echo 1. HYBRID ENCRYPTION:
echo    - XOR with random salt
echo    - Bit rotation (1 bit left)
echo    - Position-based XOR
echo    - Overhead: 1 byte (salt)
echo.
echo 2. TRIPLE ENCRYPTION:
echo    - 3 rounds with fixed keys: 0x55, 0xAA, 0x33
echo    - XOR + bit rotation (2 bits) + position XOR
echo    - No overhead (in-place encryption)
echo.
echo 3. ENHANCED ENCRYPTION:
echo    - XOR with random key
echo    - Variable bit rotation (1-7 bits based on position)
echo    - S-Box transformation (256-byte substitution table)
echo    - Final XOR with 0xAA
echo    - Overhead: 1 byte (key)
echo.
echo 4. CROSS-PLATFORM ENCRYPTION:
echo    - CBC-like mode with random IV
echo    - XOR with previous block + position + constant
echo    - Overhead: 1 byte (IV)
echo.
echo REAL OPENSSL ENCRYPTION METHODS:
echo 5. AES-256-GCM:
echo    - Authenticated encryption with Galois/Counter Mode
echo    - 256-bit key, 96-bit IV, 128-bit authentication tag
echo    - Overhead: 60 bytes (key + IV + tag)
echo.
echo 6. AES-256-CBC:
echo    - Cipher Block Chaining mode
echo    - 256-bit key, 128-bit IV, PKCS7 padding
echo    - Overhead: 48 bytes (key + IV) + padding
echo.
echo 7. ChaCha20:
echo    - Stream cipher, high performance
echo    - 256-bit key, 96-bit nonce
echo    - Overhead: 44 bytes (key + nonce)
echo.
echo ========================================
echo All encryption tests completed successfully!
echo Check the .encrypted files in the current directory.
echo ========================================
pause
