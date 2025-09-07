@echo off
echo ========================================
echo    RawrZ Encryption Methods Test
echo ========================================
echo.

echo [1/4] Compiling encryption test...
g++ -std=c++17 -O2 test_encryption.cpp -o test_encryption.exe
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Compilation failed!
    pause
    exit /b 1
)
echo ✓ Compilation successful!

echo.
echo [2/4] Running encryption tests...
echo.
test_encryption.exe
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

echo.
echo [4/4] Encryption Methods Summary:
echo ========================================
echo.
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
echo ========================================
echo All encryption tests completed successfully!
echo Check the .encrypted files in the current directory.
echo ========================================
pause
