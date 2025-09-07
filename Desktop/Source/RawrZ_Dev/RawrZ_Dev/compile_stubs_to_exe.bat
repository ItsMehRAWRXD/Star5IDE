@echo off
chcp 65001 >nul
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

set compiled_count=0
set failed_count=0

REM Compile all .cs files in test_stubs directory
for %%f in (test_stubs\*.cs) do (
    echo Compiling: %%~nxf
    
    REM Generate output filename
    set output_name=scannable_exes\%%~nf.exe
    
    REM Compile the C# file
    csc /target:exe /out:"!output_name!" "%%f" >nul 2>&1
    
    if exist "!output_name!" (
        echo [SUCCESS] Compiled: !output_name!
        set /a compiled_count+=1
    ) else (
        echo [FAILED] Compilation failed for: %%~nxf
        set /a failed_count+=1
    )
    echo.
)

echo ========================================
echo COMPILATION SUMMARY
echo ========================================
echo Successfully compiled: %compiled_count% files
echo Failed compilations: %failed_count% files
echo.

if %compiled_count% gtr 0 (
    echo [SUCCESS] Executable files ready for scanning!
    echo.
    echo Generated executables in 'scannable_exes' directory:
    echo.
    dir /b scannable_exes\*.exe
    
    echo.
    echo Next steps:
    echo 1. Upload these .exe files to VirusTotal
    echo 2. Test with WebSec malware scanner
    echo 3. Compare detection rates between stubs
    echo.
    
    REM Ask if user wants to open the directory
    set /p open_dir="Open scannable_exes directory? (y/n): "
    if /i "!open_dir!"=="y" (
        explorer scannable_exes
    )
) else (
    echo [WARNING] No executables were generated.
    echo Check your .cs files for compilation errors.
)

echo.
echo Press any key to exit...
pause >nul
