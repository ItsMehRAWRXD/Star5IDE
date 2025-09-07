@echo off
chcp 65001 >nul
echo ========================================
echo    RawrZ Test Stub Generator
echo ========================================
echo.

REM Create stubs directory
if not exist "test_stubs" mkdir test_stubs

echo [INFO] Generating test stubs for malware scanner testing...
echo.

REM Generate OpenSSL stub 1
echo [INFO] Generating OpenSSL stub 1...
echo 2 > temp_input.txt
echo test_executables\notepad_original.exe >> temp_input.txt
echo 1 >> temp_input.txt
echo 1 >> temp_input.txt
echo 0 >> temp_input.txt
cmd /c "RawrZ_OpenSSL.exe < temp_input.txt > test_results\openssl_stub_1_gen.log 2>&1"
timeout /t 2 /nobreak >nul

REM Generate OpenSSL stub 2
echo [INFO] Generating OpenSSL stub 2...
echo 2 > temp_input.txt
echo test_executables\notepad_original.exe >> temp_input.txt
echo 1 >> temp_input.txt
echo 1 >> temp_input.txt
echo 0 >> temp_input.txt
cmd /c "RawrZ_OpenSSL.exe < temp_input.txt > test_results\openssl_stub_2_gen.log 2>&1"
timeout /t 2 /nobreak >nul

REM Generate Non-OpenSSL stub 1
echo [INFO] Generating Non-OpenSSL stub 1...
echo 6 > temp_input.txt
echo 1 >> temp_input.txt
echo 0 >> temp_input.txt
echo 2 >> temp_input.txt
echo 0 >> temp_input.txt
echo 0 >> temp_input.txt
echo 2 >> temp_input.txt
echo test_executables\notepad_original.exe >> temp_input.txt
echo 2 >> temp_input.txt
echo 1 >> temp_input.txt
echo 0 >> temp_input.txt
cmd /c "RawrZ_OpenSSL.exe < temp_input.txt > test_results\non_openssl_stub_1_gen.log 2>&1"
timeout /t 2 /nobreak >nul

REM Generate Non-OpenSSL stub 2
echo [INFO] Generating Non-OpenSSL stub 2...
echo 6 > temp_input.txt
echo 1 >> temp_input.txt
echo 0 >> temp_input.txt
echo 2 >> temp_input.txt
echo 0 >> temp_input.txt
echo 0 >> temp_input.txt
echo 2 >> temp_input.txt
echo test_executables\notepad_original.exe >> temp_input.txt
echo 3 >> temp_input.txt
echo 1 >> temp_input.txt
echo 0 >> temp_input.txt
cmd /c "RawrZ_OpenSSL.exe < temp_input.txt > test_results\non_openssl_stub_2_gen.log 2>&1"
timeout /t 2 /nobreak >nul

REM Move all generated stubs to test_stubs directory
echo [INFO] Moving generated stubs...
if exist "test_executables\*.cs" (
    move "test_executables\*.cs" "test_stubs\"
    echo [SUCCESS] Moved stubs to test_stubs\ directory
)

REM Clean up
if exist temp_input.txt del temp_input.txt

echo.
echo ========================================
echo    Stub Generation Complete!
echo ========================================
echo.
echo Generated stubs in test_stubs\ directory:
dir test_stubs\*.cs
echo.
echo Next steps:
echo 1. Review the generated stubs
echo 2. Upload them to malware scanner
echo 3. Test detection rates
echo.
echo Press any key to exit...
pause >nul
