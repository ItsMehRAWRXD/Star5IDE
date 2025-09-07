@echo off
echo ========================================
echo    RawrZ Test Suite Builder
echo ========================================
echo.

echo Checking for required tools...

REM Check for CMake
where cmake >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] CMake not found! Please install CMake first.
    echo Download from: https://cmake.org/download/
    pause
    exit /b 1
)

REM Check for compiler
where g++ >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] g++ compiler not found! Please install MinGW or another C++ compiler.
    pause
    exit /b 1
)

echo [SUCCESS] Required tools found!
echo.

echo Creating build directory...
if not exist "build" mkdir build
cd build

echo.
echo Configuring with CMake...
cmake .. -G "MinGW Makefiles"
if %errorlevel% neq 0 (
    echo [ERROR] CMake configuration failed!
    pause
    exit /b 1
)

echo.
echo Building test suite...
cmake --build . --config Release
if %errorlevel% neq 0 (
    echo [ERROR] Build failed!
    pause
    exit /b 1
)

echo.
echo [SUCCESS] Build completed successfully!
echo.
echo Test suite location: build\bin\rawrz_test.exe
echo.
echo To run the tests:
echo 1. cd build\bin
echo 2. rawrz_test.exe
echo.
echo Or use the comprehensive test runner:
echo run_comprehensive_tests.bat
echo.
pause
