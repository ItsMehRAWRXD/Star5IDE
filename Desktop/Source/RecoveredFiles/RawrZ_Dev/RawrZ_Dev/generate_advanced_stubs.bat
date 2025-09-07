@echo off
chcp 65001 >nul
echo ========================================
echo RawrZ Advanced Stub Generator
echo ========================================
echo.

REM Check if calc.exe exists
if not exist "C:\Windows\System32\calc.exe" (
    echo [ERROR] calc.exe not found!
    echo Please ensure calc.exe is available.
    pause
    exit /b 1
)

echo [INFO] Found calc.exe. Generating advanced stubs...
echo.

REM Create output directory
if not exist "advanced_stubs" mkdir advanced_stubs

REM Generate FileDownloader stub
echo [INFO] Generating FileDownloader stub...
echo FileDownloader > temp_input.txt
echo C:\Windows\System32\calc.exe >> temp_input.txt
echo 1 >> temp_input.txt
echo 1 >> temp_input.txt
echo 1 >> temp_input.txt
echo 0 >> temp_input.txt

cmd /c "RawrZ_OpenSSL.exe < temp_input.txt"
if exist "C:\Windows\System32\calc.exe.FileDownloader.stub.cs" (
    copy "C:\Windows\System32\calc.exe.FileDownloader.stub.cs" "advanced_stubs\calc_filedownloader.stub.cs"
    echo [SUCCESS] FileDownloader stub generated
) else (
    echo [FAILED] FileDownloader stub generation
)
echo.

REM Generate NetworkScanner stub
echo [INFO] Generating NetworkScanner stub...
echo NetworkScanner > temp_input.txt
echo C:\Windows\System32\calc.exe >> temp_input.txt
echo 1 >> temp_input.txt
echo 1 >> temp_input.txt
echo 1 >> temp_input.txt
echo 0 >> temp_input.txt

cmd /c "RawrZ_OpenSSL.exe < temp_input.txt"
if exist "C:\Windows\System32\calc.exe.NetworkScanner.stub.cs" (
    copy "C:\Windows\System32\calc.exe.NetworkScanner.stub.cs" "advanced_stubs\calc_networkscanner.stub.cs"
    echo [SUCCESS] NetworkScanner stub generated
) else (
    echo [FAILED] NetworkScanner stub generation
)
echo.

REM Generate ProcessInjection stub
echo [INFO] Generating ProcessInjection stub...
echo ProcessInjection > temp_input.txt
echo C:\Windows\System32\calc.exe >> temp_input.txt
echo 1 >> temp_input.txt
echo 1 >> temp_input.txt
echo 1 >> temp_input.txt
echo 0 >> temp_input.txt

cmd /c "RawrZ_OpenSSL.exe < temp_input.txt"
if exist "C:\Windows\System32\calc.exe.ProcessInjection.stub.cs" (
    copy "C:\Windows\System32\calc.exe.ProcessInjection.stub.cs" "advanced_stubs\calc_processinjection.stub.cs"
    echo [SUCCESS] ProcessInjection stub generated
) else (
    echo [FAILED] ProcessInjection stub generation
)
echo.

REM Generate standard OpenSSL stub
echo [INFO] Generating standard OpenSSL stub...
echo OpenSSL > temp_input.txt
echo C:\Windows\System32\calc.exe >> temp_input.txt
echo 1 >> temp_input.txt
echo 1 >> temp_input.txt
echo 1 >> temp_input.txt
echo 0 >> temp_input.txt

cmd /c "RawrZ_OpenSSL.exe < temp_input.txt"
if exist "C:\Windows\System32\calc.exe.OpenSSL.stub.cs" (
    copy "C:\Windows\System32\calc.exe.OpenSSL.stub.cs" "advanced_stubs\calc_openssl.stub.cs"
    echo [SUCCESS] Standard OpenSSL stub generated
) else (
    echo [FAILED] Standard OpenSSL stub generation
)
echo.

REM Clean up temp files
if exist "temp_input.txt" del "temp_input.txt"
if exist "C:\Windows\System32\calc.exe.*.stub.cs" del "C:\Windows\System32\calc.exe.*.stub.cs"

echo ========================================
echo ADVANCED STUB GENERATION COMPLETE
echo ========================================
echo.
echo Generated stubs in 'advanced_stubs' directory:
echo.
dir /b advanced_stubs\*.cs
echo.
echo Next steps:
echo 1. Compile these stubs to .exe files
echo 2. Test on VirusTotal
echo 3. Test on WebSec scanner
echo 4. Compare detection rates
echo.
echo Press any key to continue...
pause >nul
