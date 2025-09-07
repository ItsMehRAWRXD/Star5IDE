@echo off
echo Building C++ stub: cpp_openssl
echo ========================================

echo Executing: g++ -std=c++17 -O2 -I"C:\Program Files\OpenSSL-Win64\include" -L"C:\Program Files\OpenSSL-Win64\lib" -llibcrypto -llibssl -o generated_stubs/cpp_openssl_1756778304867730700.exe generated_stubs/cpp_openssl_1756778304867730700.cpp
g++ -std=c++17 -O2 -I"C:\Program Files\OpenSSL-Win64\include" -L"C:\Program Files\OpenSSL-Win64\lib" -llibcrypto -llibssl -o generated_stubs/cpp_openssl_1756778304867730700.exe generated_stubs/cpp_openssl_1756778304867730700.cpp
if %ERRORLEVEL% NEQ 0 (
    echo Build failed!
    pause
    exit /b 1
)
echo Build successful!

echo ========================================
echo Stub build completed!
pause
