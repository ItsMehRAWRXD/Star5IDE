@echo off
echo ========================================
echo RawrZ Stub Compiler - CS to EXE
echo ========================================
echo.

REM Check if .NET SDK is available
where csc >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] C# compiler (csc) not found!
    echo Please install .NET SDK first.
    echo Download from: https://dotnet.microsoft.com/download
    echo.
    pause
    exit /b 1
)

echo [INFO] C# compiler found. Proceeding with compilation...
echo.

REM Create output directory for executables
if not exist "scannable_exes" mkdir scannable_exes

REM Check if test_stubs directory exists
if not exist "test_stubs" (
    echo [ERROR] test_stubs directory not found!
    echo Please generate some stubs first using the main application.
    echo.
    pause
    exit /b 1
)

echo [INFO] Found test_stubs directory. Compiling all .cs files...
echo.

REM Compile all .cs files in test_stubs directory
for %%f in (test_stubs\*.cs) do (
    echo Compiling: %%~nxf
    
    REM Compile the C# file
    csc /target:exe /out:"scannable_exes\%%~nf.exe" "%%f"
    
    if exist "scannable_exes\%%~nf.exe" (
        echo [SUCCESS] Compiled: %%~nf.exe
    ) else (
        echo [FAILED] Compilation failed for: %%~nxf
    )
    echo.
)

echo ========================================
echo COMPILATION COMPLETE
echo ========================================
echo.
echo Generated executables in 'scannable_exes' directory:
echo.
dir /b scannable_exes\*.exe 2>nul
echo.
echo Next steps:
echo 1. Upload these .exe files to VirusTotal
echo 2. Test with WebSec malware scanner
echo 3. Compare detection rates between stubs
echo.
echo Press any key to exit...
pause >nul
