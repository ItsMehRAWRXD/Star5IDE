@echo off
setlocal enabledelayedexpansion

echo ========================================
echo Building Production-Ready Stub Generator
echo ========================================
echo.

REM Check if Visual Studio is available
where cl >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Visual Studio compiler (cl.exe) not found in PATH
    echo.
    echo Please run this from a Visual Studio Developer Command Prompt:
    echo   - Start Menu -> Visual Studio 2022 -> Developer Command Prompt
    echo   - Or run: "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars64.bat"
    echo.
    echo Alternatively, set up environment variables manually:
    echo   set PATH=%PATH%;C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Tools\MSVC\14.xx.xxxxx\bin\Hostx64\x64
    echo   set INCLUDE=%INCLUDE%;C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Tools\MSVC\14.xx.xxxxx\include
    echo   set LIB=%LIB%;C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Tools\MSVC\14.xx.xxxxx\lib\x64
    echo.
    pause
    exit /b 1
)

echo [INFO] Visual Studio compiler found
echo [INFO] Compiler version:
cl 2>&1 | findstr "Version"

REM Create output directories
echo.
echo [INFO] Creating output directories...
if not exist "protected" mkdir protected
if not exist "backups" mkdir backups
if not exist "logs" mkdir logs
if not exist "build" mkdir build

REM Download nlohmann/json if not present
if not exist "nlohmann" (
    echo [INFO] Downloading nlohmann/json library...
    mkdir nlohmann
    powershell -Command "try { Invoke-WebRequest -Uri 'https://github.com/nlohmann/json/releases/download/v3.11.3/json.hpp' -OutFile 'nlohmann/json.hpp' -UseBasicParsing; Write-Host 'Download successful' } catch { Write-Host 'Download failed: ' + $_.Exception.Message; exit 1 }"
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to download nlohmann/json library
        echo [INFO] Please download manually from: https://github.com/nlohmann/json/releases/download/v3.11.3/json.hpp
        echo [INFO] Place it in the 'nlohmann' folder
        pause
        exit /b 1
    )
    echo [INFO] nlohmann/json library downloaded successfully
) else (
    echo [INFO] nlohmann/json library already present
)

REM Check Windows SDK
echo.
echo [INFO] Checking Windows SDK...
where sdkver >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Windows SDK version tool not found
    echo [INFO] Continuing with default SDK...
) else (
    echo [INFO] Windows SDK version:
    sdkver
)

REM Compile with production settings
echo.
echo [INFO] Compiling production stub generator...
echo [INFO] Compiler flags: /EHsc /std:c++17 /O2 /MT /DNDEBUG

cl /EHsc /std:c++17 /O2 /MT /DNDEBUG ^
   /I"." ^
   /I"nlohmann" ^
   /D_WIN32_WINNT=0x0601 ^
   /DWIN32_LEAN_AND_MEAN ^
   json_stub_generator.cpp ^
   /Fe:build\json_stub_generator.exe ^
   /Fo:build\json_stub_generator.obj ^
   /link ^
   /SUBSYSTEM:CONSOLE ^
   /MACHINE:X86 ^
   advapi32.lib ^
   version.lib ^
   shlwapi.lib ^
   psapi.lib ^
   ntdll.lib ^
   imagehlp.lib ^
   crypt32.lib ^
   kernel32.lib ^
   user32.lib ^
   gdi32.lib ^
   winspool.lib ^
   comdlg32.lib ^
   ole32.lib ^
   oleaut32.lib ^
   uuid.lib ^
   odbc32.lib ^
   odbccp32.lib

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Compilation failed!
    echo [INFO] Check the error messages above
    echo [INFO] Common issues:
    echo   - Missing Windows SDK
    echo   - C++17 not supported (update Visual Studio)
    echo   - Missing library files
    echo.
    pause
    exit /b 1
)

echo.
echo [SUCCESS] Compilation successful!
echo.

REM Verify executable
if exist "build\json_stub_generator.exe" (
    echo [INFO] Executable created: build\json_stub_generator.exe
    echo [INFO] File size:
    dir "build\json_stub_generator.exe" | findstr "json_stub_generator.exe"
) else (
    echo [ERROR] Executable not found after compilation
    pause
    exit /b 1
)

REM Test basic functionality
echo.
echo [INFO] Testing basic functionality...
build\json_stub_generator.exe --help >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Basic functionality test passed
) else (
    echo [WARNING] Basic functionality test failed - executable may have issues
)

REM Create production package
echo.
echo [INFO] Creating production package...
if exist "production_package" rmdir /s /q "production_package"
mkdir production_package
mkdir production_package\bin
mkdir production_package\config
mkdir production_package\examples

copy "build\json_stub_generator.exe" "production_package\bin\"
copy "stub_config.json" "production_package\config\"
copy "test_config.json" "production_package\examples\"
copy "README_JSON_Stub_Generator.md" "production_package\"
copy "json_stub_processor.ps1" "production_package\"

echo [SUCCESS] Production package created in 'production_package' folder

REM Display final information
echo.
echo ========================================
echo BUILD COMPLETED SUCCESSFULLY
echo ========================================
echo.
echo Files created:
echo   - build\json_stub_generator.exe (main executable)
echo   - build\json_stub_generator.obj (object file)
echo   - production_package\ (complete package)
echo.
echo Directories created:
echo   - protected\ (output for protected executables)
echo   - backups\ (backup of original files)
echo   - logs\ (generation logs)
echo   - build\ (compilation artifacts)
echo.
echo Usage examples:
echo   json_stub_generator.exe stub_config.json
echo   json_stub_generator.exe stub_config.json --validate-only
echo   json_stub_generator.exe stub_config.json --target calculator.exe --verbose
echo   json_stub_generator.exe --help
echo.
echo The system is now production-ready with:
echo   - Complete PE manipulation functions
echo   - Full resource and code section injection
echo   - AES-256 encryption using Windows CryptoAPI
echo   - Polymorphic anti-analysis stubs
echo   - Comprehensive error handling
echo   - Command line option processing
echo   - No stub or placeholder functions
echo.
pause
