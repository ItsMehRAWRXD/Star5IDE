@echo off
echo Building JSON-Driven Stub Generator...
echo.

REM Check if Visual Studio is available
where cl >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Visual Studio compiler (cl.exe) not found in PATH
    echo Please run this from a Visual Studio Developer Command Prompt
    echo or set up the environment variables manually
    pause
    exit /b 1
)

REM Create output directories
if not exist "protected" mkdir protected
if not exist "backups" mkdir backups
if not exist "logs" mkdir logs

REM Download nlohmann/json if not present
if not exist "nlohmann" (
    echo Downloading nlohmann/json library...
    mkdir nlohmann
    powershell -Command "Invoke-WebRequest -Uri 'https://github.com/nlohmann/json/releases/download/v3.11.3/json.hpp' -OutFile 'nlohmann/json.hpp'"
    if %errorlevel% neq 0 (
        echo Error: Failed to download nlohmann/json library
        pause
        exit /b 1
    )
)

REM Compile the JSON stub generator
echo Compiling json_stub_generator.cpp...
cl /EHsc /std:c++17 /O2 /MT ^
   /I"." ^
   /I"nlohmann" ^
   json_stub_generator.cpp ^
   /Fe:json_stub_generator.exe ^
   /link ^
   advapi32.lib ^
   version.lib ^
   shlwapi.lib ^
   psapi.lib ^
   ntdll.lib ^
   imagehlp.lib

if %errorlevel% neq 0 (
    echo Error: Compilation failed!
    pause
    exit /b 1
)

echo.
echo ✅ Compilation successful!
echo.
echo Files created:
echo   - json_stub_generator.exe
echo   - protected/ (output directory)
echo   - backups/ (backup directory)
echo   - logs/ (log directory)
echo.
echo Usage:
echo   json_stub_generator.exe stub_config.json
echo.
echo The generator will:
echo   1. Load configuration from stub_config.json
echo   2. Process all target executables
echo   3. Generate and inject stubs based on configuration
echo   4. Create protected versions in the protected/ directory
echo   5. Backup originals in the backups/ directory
echo.
pause
