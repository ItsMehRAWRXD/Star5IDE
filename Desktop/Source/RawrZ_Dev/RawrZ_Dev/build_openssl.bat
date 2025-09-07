@echo off
chcp 65001 >nul
echo Building RawrZ OpenSSL Version...
echo.

echo Checking for OpenSSL...
where openssl >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: OpenSSL not found in PATH
    echo Please install OpenSSL development libraries first
    echo.
    echo For Windows, you can:
    echo 1. Download from https://slproweb.com/products/Win32OpenSSL.html
    echo 2. Or use vcpkg: vcpkg install openssl
    echo 3. Or use chocolatey: choco install openssl
    pause
    exit /b 1
)

echo OpenSSL found, proceeding with build...
echo.

echo Compiling RawrZ_Simple_OpenSSL.cpp...
echo Using OpenSSL from: C:\Program Files\OpenSSL
echo.

g++ -std=c++17 -O2 -Wall -Wextra ^
    -I"C:\Program Files\OpenSSL\include" ^
    -L"C:\Program Files\OpenSSL\lib" ^
    RawrZ_Simple_OpenSSL.cpp ^
    -lssl -lcrypto -lws2_32 ^
    -o RawrZ_OpenSSL.exe

if %errorlevel% equ 0 (
    echo.
    echo [SUCCESS] RawrZ OpenSSL build completed!
    echo Executable: RawrZ_OpenSSL.exe
    echo.
    echo Features enabled:
    echo - Real OpenSSL AES-256-CBC encryption
    echo - Cryptographically secure random generation
    echo - Enhanced stub analysis with statistical tests
    echo - Advanced stub comparison algorithms
    echo.
    echo Testing the build...
    echo.
    RawrZ_OpenSSL.exe
) else (
    echo.
    echo [ERROR] Build failed!
    echo.
    echo Common issues:
    echo 1. OpenSSL not installed or wrong path
    echo 2. Missing development libraries
    echo 3. Wrong include/lib paths
    echo.
    echo Current paths being used:
    echo Include: C:\Program Files\OpenSSL\include
    echo Library: C:\Program Files\OpenSSL\lib
    echo.
    echo If these paths are incorrect, please update the script
    echo.
    echo Detailed error information:
    echo.
    g++ -std=c++17 -O2 -Wall -Wextra ^
        -I"C:\Program Files\OpenSSL\include" ^
        -L"C:\Program Files\OpenSSL\lib" ^
        RawrZ_Simple_OpenSSL.cpp ^
        -lssl -lcrypto -lws2_32 ^
        -o RawrZ_OpenSSL.exe
)

pause
