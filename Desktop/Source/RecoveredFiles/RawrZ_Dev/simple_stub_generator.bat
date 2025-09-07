@echo off
chcp 65001 >nul
echo ========================================
echo RawrZ Simple Stub Generator
echo ========================================
echo.

REM Check if calc.exe exists
if not exist "C:\Windows\System32\calc.exe" (
    echo [ERROR] calc.exe not found!
    echo Please ensure calc.exe is available.
    pause
    exit /b 1
)

echo [INFO] Found calc.exe. Generating stubs...
echo.

REM Create output directory
if not exist "calc_stubs" mkdir calc_stubs

REM Copy calc.exe to current directory for easier access
copy "C:\Windows\System32\calc.exe" "calc.exe"

echo [INFO] Generating 4 different calc.exe stubs...
echo.

REM Generate stub 1 - Basic OpenSSL
echo [INFO] Generating stub 1: Basic OpenSSL...
echo 2 > temp_input.txt
echo calc.exe >> temp_input.txt
echo 1 >> temp_input.txt
echo 1 >> temp_input.txt
echo 0 >> temp_input.txt

cmd /c "RawrZ_OpenSSL.exe < temp_input.txt"
if exist "calc.exe.stub.cs" (
    copy "calc.exe.stub.cs" "calc_stubs\calc_stub_1_basic.cs"
    echo [SUCCESS] Basic stub generated
    del "calc.exe.stub.cs"
) else (
    echo [FAILED] Basic stub generation
)
echo.

REM Generate stub 2 - Enhanced OpenSSL
echo [INFO] Generating stub 2: Enhanced OpenSSL...
echo 2 > temp_input.txt
echo calc.exe >> temp_input.txt
echo 2 >> temp_input.txt
echo 1 >> temp_input.txt
echo 0 >> temp_input.txt

cmd /c "RawrZ_OpenSSL.exe < temp_input.txt"
if exist "calc.exe.stub.cs" (
    copy "calc.exe.stub.cs" "calc_stubs\calc_stub_2_enhanced.cs"
    echo [SUCCESS] Enhanced stub generated
    del "calc.exe.stub.cs"
) else (
    echo [FAILED] Enhanced stub generation
)
echo.

REM Generate stub 3 - Anti-Analysis
echo [INFO] Generating stub 3: Anti-Analysis...
echo 2 > temp_input.txt
echo calc.exe >> temp_input.txt
echo 3 >> temp_input.txt
echo 1 >> temp_input.txt
echo 0 >> temp_input.txt

cmd /c "RawrZ_OpenSSL.exe < temp_input.txt"
if exist "calc.exe.stub.cs" (
    copy "calc.exe.stub.cs" "calc_stubs\calc_stub_3_antianalysis.cs"
    echo [SUCCESS] Anti-Analysis stub generated
    del "calc.exe.stub.cs"
) else (
    echo [FAILED] Anti-Analysis stub generation
)
echo.

REM Generate stub 4 - Polymorphic
echo [INFO] Generating stub 4: Polymorphic...
echo 2 > temp_input.txt
echo calc.exe >> temp_input.txt
echo 4 >> temp_input.txt
echo 1 >> temp_input.txt
echo 0 >> temp_input.txt

cmd /c "RawrZ_OpenSSL.exe < temp_input.txt"
if exist "calc.exe.stub.cs" (
    copy "calc.exe.stub.cs" "calc_stubs\calc_stub_4_polymorphic.cs"
    echo [SUCCESS] Polymorphic stub generated
    del "calc.exe.stub.cs"
) else (
    echo [FAILED] Polymorphic stub generation
)
echo.

REM Clean up temp files
if exist "temp_input.txt" del "temp_input.txt"
if exist "calc.exe" del "calc.exe"

echo ========================================
echo STUB GENERATION COMPLETE
echo ========================================
echo.
echo Generated stubs in 'calc_stubs' directory:
echo.
dir /b calc_stubs\*.cs
echo.
echo Next steps:
echo 1. Compile these stubs to .exe files
echo 2. Test on VirusTotal
echo 3. Test on WebSec scanner
echo 4. Compare detection rates
echo.
echo Press any key to continue...
pause >nul
