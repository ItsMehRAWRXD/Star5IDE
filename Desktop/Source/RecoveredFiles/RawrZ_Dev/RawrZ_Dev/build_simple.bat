
@echo off
echo Building RawrZ Simple Framework...
echo.

REM Set compiler and flags
set COMPILER=g++
set CFLAGS=-std=c++17 -O2

echo Compiling RawrZ Simple Framework...

%COMPILER% %CFLAGS% RawrZ_Simple.cpp -o RawrZ_Simple.exe

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Build successful! RawrZ_Simple.exe created.
    echo.
    echo Available features:
    echo - Advanced Encryption Methods (Hybrid, Triple, Enhanced, Cross-Platform)
    echo - Stub Generation
    echo - File Operations
    echo - Plugin System (17 Advanced Plugins)
    echo - Drag & Drop Interface
    echo - Anti-Analysis Features
    echo.
    echo Run: RawrZ_Simple.exe
) else (
    echo.
    echo Build failed! Error code: %ERRORLEVEL%
    echo.
    echo Troubleshooting:
    echo 1. Ensure g++ is installed and in PATH
    echo 2. Ensure C++17 support is available
    echo 3. Try running as Administrator
    echo 4. Check that source file exists
)

pause
