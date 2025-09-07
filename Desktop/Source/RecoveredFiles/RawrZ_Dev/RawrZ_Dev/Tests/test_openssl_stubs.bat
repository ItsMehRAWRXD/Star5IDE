@echo off
echo ========================================
echo    RawrZ OpenSSL Stub Generation Test
echo ========================================
echo.
echo [1/4] Compiling OpenSSL Stub Generator...
g++ -std=c++17 -O2 test_openssl_stubs.cpp -o test_openssl_stubs.exe -I"C:\Program Files\OpenSSL-Win64\include" -L"C:\Program Files\OpenSSL-Win64\lib" -llibcrypto -llibssl
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Compilation failed!
    echo Make sure OpenSSL is installed at C:\Program Files\OpenSSL-Win64
    pause
    exit /b 1
)
echo ✓ Compilation successful with OpenSSL!
echo.

echo [2/4] Running OpenSSL Stub Generation Test...
echo.
test_openssl_stubs.exe
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Test execution failed!
    pause
    exit /b 1
)
echo.

echo [3/4] Checking Generated Files...
echo.
if exist "test_payload.AES-256-GCM.encrypted" ( echo ✓ AES-256-GCM encrypted payload & for %%A in ("test_payload.AES-256-GCM.encrypted") do echo   Size: %%~zA bytes ) else ( echo ✗ Missing: test_payload.AES-256-GCM.encrypted )
if exist "test_payload.AES-256-CBC.encrypted" ( echo ✓ AES-256-CBC encrypted payload & for %%A in ("test_payload.AES-256-CBC.encrypted") do echo   Size: %%~zA bytes ) else ( echo ✗ Missing: test_payload.AES-256-CBC.encrypted )
if exist "test_payload.ChaCha20.encrypted" ( echo ✓ ChaCha20 encrypted payload & for %%A in ("test_payload.ChaCha20.encrypted") do echo   Size: %%~zA bytes ) else ( echo ✗ Missing: test_payload.ChaCha20.encrypted )
echo.

if exist "stub_AES-256-GCM.cpp" ( echo ✓ C++ Stub: stub_AES-256-GCM.cpp ) else ( echo ✗ Missing: stub_AES-256-GCM.cpp )
if exist "stub_AES-256-CBC.cpp" ( echo ✓ C++ Stub: stub_AES-256-CBC.cpp ) else ( echo ✗ Missing: stub_AES-256-CBC.cpp )
if exist "stub_ChaCha20.cpp" ( echo ✓ C++ Stub: stub_ChaCha20.cpp ) else ( echo ✗ Missing: stub_ChaCha20.cpp )
echo.

if exist "stub_AES-256-GCM.asm" ( echo ✓ ASM Stub: stub_AES-256-GCM.asm ) else ( echo ✗ Missing: stub_AES-256-GCM.asm )
if exist "stub_AES-256-CBC.asm" ( echo ✓ ASM Stub: stub_AES-256-CBC.asm ) else ( echo ✗ Missing: stub_AES-256-CBC.asm )
if exist "stub_ChaCha20.asm" ( echo ✓ ASM Stub: stub_Chacha20.asm ) else ( echo ✗ Missing: stub_Chacha20.asm )
echo.

echo [4/4] OpenSSL Stub Generation Summary:
echo ========================================
echo.
echo ENCRYPTION METHODS TESTED:
echo 1. AES-256-GCM: Authenticated encryption with Galois/Counter Mode
echo 2. AES-256-CBC: Cipher Block Chaining mode
echo 3. ChaCha20: High-performance stream cipher
echo.
echo STUB TYPES GENERATED:
echo 1. C++ Stubs (.cpp): Full OpenSSL integration with decryption
echo 2. ASM Stubs (.asm): Low-level assembly with OpenSSL library linking
echo.
echo FEATURES:
echo - Pure OpenSSL (no XOR fallbacks)
echo - Anti-debugging checks
echo - Memory execution
echo - Professional-grade encryption
echo.
echo ========================================
echo OpenSSL Stub Generation Test Complete!
echo Check the generated .encrypted, .cpp, and .asm files.
echo ========================================
pause
