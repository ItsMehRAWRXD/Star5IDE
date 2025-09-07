@echo off
chcp 65001 >nul
echo ========================================
echo RawrZ Calc Stub Compiler
echo ========================================
echo.

REM Check if .NET SDK is available
where dotnet >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] .NET SDK not found!
    echo Please install .NET SDK first.
    echo Download from: https://dotnet.microsoft.com/download
    pause
    exit /b 1
)

echo [INFO] .NET SDK found. Proceeding with compilation...
echo.

REM Create output directory for executables
if not exist "calc_executables" mkdir calc_executables

REM Create a temporary project for compilation
echo [INFO] Creating temporary project...
if not exist "temp_calc_project" mkdir temp_calc_project
cd temp_calc_project

REM Create project file
echo { > calc_stub.csproj
echo   "sdk": "Microsoft.NET.Sdk" >> calc_stub.csproj
echo } >> calc_stub.csproj

REM Copy the stub
copy "..\calc_stubs\calc_stub_1_basic.cs" "Program.cs"

echo [INFO] Compiling calc stub...
dotnet build --configuration Release --output ..\calc_executables

if exist "..\calc_executables\calc_stub.exe" (
    echo [SUCCESS] Compiled: calc_stub.exe
    copy "..\calc_executables\calc_stub.exe" "..\calc_executables\calc_stub_1_basic.exe"
    echo [SUCCESS] Renamed to: calc_stub_1_basic.exe
) else (
    echo [FAILED] Compilation failed
)

REM Clean up
cd ..
rmdir /s /q temp_calc_project

echo.
echo ========================================
echo COMPILATION COMPLETE
echo ========================================
echo.
echo Generated executable in 'calc_executables' directory:
echo.
dir /b calc_executables\*.exe
echo.
echo Next steps:
echo 1. Upload calc_stub_1_basic.exe to VirusTotal
echo 2. Test with WebSec malware scanner
echo 3. Compare detection rates with notepad stub
echo.
echo Press any key to continue...
pause >nul
