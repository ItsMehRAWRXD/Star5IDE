@echo off
echo Building RawrZ OpenSSL Stub Generator...

REM Set OpenSSL paths (adjust these to match your installation)
set OPENSSL_DIR=C:\Program Files\OpenSSL-Win64
set OPENSSL_INCLUDE=%OPENSSL_DIR%\include
set OPENSSL_LIB=%OPENSSL_DIR%\lib

REM Build with MSVC
cl /std:c++17 /EHsc /I"%OPENSSL_INCLUDE%" RawrZOpenSSLStub.cpp /link /LIBPATH:"%OPENSSL_LIB%" libcrypto.lib /out:RawrZOpenSSLStub.exe

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [+] Build successful! RawrZOpenSSLStub.exe created.
    echo.
    echo Usage:
    echo   1. Place your payload as 'payload.bin' in the same directory
    echo   2. Run: RawrZOpenSSLStub.exe
    echo   3. This will generate 'stub.cpp' with OpenSSL decryption
    echo   4. Build the stub: cl /std:c++17 stub.cpp /link libcrypto.lib
    echo.
    echo Supported ciphers: AES-256-GCM, AES-256-CBC, ChaCha20
    echo No XOR fallback - pure OpenSSL only!
) else (
    echo.
    echo [-] Build failed! Check OpenSSL installation and paths.
    echo.
    echo Make sure OpenSSL is installed at: %OPENSSL_DIR%
    echo Or update the OPENSSL_DIR variable in this script.
)

pause
