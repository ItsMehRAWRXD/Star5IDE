@echo off
echo ========================================
echo RawrZ Calc Stub Generator
echo ========================================
echo.

REM Create output directory
if not exist "calc_test_stubs" mkdir calc_test_stubs

echo [INFO] Generating calc.exe stubs with different types...
echo.

REM Generate stub 1 - Basic AES
echo [INFO] Generating stub 1: Basic AES...
echo calc.exe > temp_input.txt
echo 1 >> temp_input.txt
echo y >> temp_input.txt
echo n >> temp_input.txt

cmd /c "RawrZ_OpenSSL.exe --interactive < temp_input.txt"
if exist "calc.exe.stub.cs" (
    copy "calc.exe.stub.cs" "calc_test_stubs\calc_stub_1_basic.cs"
    echo [SUCCESS] Basic stub generated
    del "calc.exe.stub.cs"
) else (
    echo [FAILED] Basic stub generation
)
echo.

REM Generate stub 2 - Anti-Analysis
echo [INFO] Generating stub 2: Anti-Analysis...
echo calc.exe > temp_input.txt
echo 7 >> temp_input.txt
echo y >> temp_input.txt
echo n >> temp_input.txt

cmd /c "RawrZ_OpenSSL.exe --interactive < temp_input.txt"
if exist "calc.exe.stub.cs" (
    copy "calc.exe.stub.cs" "calc_test_stubs\calc_stub_2_antianalysis.cs"
    echo [SUCCESS] Anti-Analysis stub generated
    del "calc.exe.stub.cs"
) else (
    echo [FAILED] Anti-Analysis stub generation
)
echo.

REM Generate stub 3 - Polymorphic
echo [INFO] Generating stub 3: Polymorphic...
echo calc.exe > temp_input.txt
echo 8 >> temp_input.txt
echo y >> temp_input.txt
echo n >> temp_input.txt

cmd /c "RawrZ_OpenSSL.exe --interactive < temp_input.txt"
if exist "calc.exe.stub.cs" (
    copy "calc.exe.stub.cs" "calc_test_stubs\calc_stub_3_polymorphic.cs"
    echo [SUCCESS] Polymorphic stub generated
    del "calc.exe.stub.cs"
) else (
    echo [FAILED] Polymorphic stub generation
)
echo.

REM Generate stub 4 - Reflection Loader
echo [INFO] Generating stub 4: Reflection Loader...
echo calc.exe > temp_input.txt
echo 11 >> temp_input.txt
echo y >> temp_input.txt
echo n >> temp_input.txt

cmd /c "RawrZ_OpenSSL.exe --interactive < temp_input.txt"
if exist "calc.exe.stub.cs" (
    copy "calc.exe.stub.cs" "calc_test_stubs\calc_stub_4_reflection.cs"
    echo [SUCCESS] Reflection Loader stub generated
    del "calc.exe.stub.cs"
) else (
    echo [FAILED] Reflection Loader stub generation
)
echo.

REM Clean up
if exist "temp_input.txt" del "temp_input.txt"

echo ========================================
echo STUB GENERATION COMPLETE
echo ========================================
echo.
echo Generated stubs in 'calc_test_stubs' directory:
echo.
dir /b calc_test_stubs\*.cs
echo.
echo Next steps:
echo 1. Upload these .cs files to VirusTotal
echo 2. Test with WebSec malware scanner
echo 3. Compare detection rates between stub types
echo.
echo Press any key to continue...
pause >nul
