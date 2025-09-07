@echo off
echo ========================================
echo RawrZ Native Stub Generator - Full Build
echo ========================================
echo.

REM Check for available compilers
set COMPILER_FOUND=false

REM Check for MinGW
where g++ >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Found MinGW g++ compiler
    set COMPILER=g++
    set COMPILER_FOUND=true
    goto :compile
)

REM Check for Visual Studio cl.exe
where cl >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Found Visual Studio cl compiler
    set COMPILER=cl
    set COMPILER_FOUND=true
    goto :compile
)

REM Check for clang
where clang++ >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Found clang++ compiler
    set COMPILER=clang++
    set COMPILER_FOUND=true
    goto :compile
)

if "%COMPILER_FOUND%"=="false" (
    echo [ERROR] No C++ compiler found!
    echo.
    echo Please install one of the following:
    echo 1. MinGW-w64 (recommended for Windows)
    echo    Download: https://www.mingw-w64.org/downloads/
    echo.
    echo 2. Visual Studio Build Tools
    echo    Download: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022
    echo.
    echo 3. LLVM/Clang
    echo    Download: https://releases.llvm.org/
    echo.
    pause
    exit /b 1
)

:compile
echo.
echo [INFO] Compiling Native Stub Generator Components...
echo.

REM Create output directories
if not exist "native_stubs" mkdir native_stubs
if not exist "stub_templates" mkdir stub_templates
if not exist "test_payloads" mkdir test_payloads

echo ========================================
echo Phase 1: Compiling Core Components
echo ========================================

REM Compile the main stub generator
echo [1/4] Compiling native_stub_generator.cpp...
if "%COMPILER%"=="g++" (
    g++ -std=c++17 -O2 -static -static-libgcc -static-libstdc++ ^
        -o "native_stubs\native_stub_generator.exe" ^
        native_stub_generator.cpp ^
        -ladvapi32 -lversion -lshlwapi -lpsapi -lntdll -lkernel32 -luser32
) else if "%COMPILER%"=="cl" (
    cl /EHsc /std:c++17 /O2 /MT ^
        /Fe:"native_stubs\native_stub_generator.exe" ^
        native_stub_generator.cpp ^
        advapi32.lib version.lib shlwapi.lib psapi.lib ntdll.lib kernel32.lib user32.lib
) else if "%COMPILER%"=="clang++" (
    clang++ -std=c++17 -O2 -static ^
        -o "native_stubs\native_stub_generator.exe" ^
        native_stub_generator.cpp ^
        -ladvapi32 -lversion -lshlwapi -lpsapi -lntdll -lkernel32 -luser32
)

if exist "native_stubs\native_stub_generator.exe" (
    echo [SUCCESS] Native stub generator compiled!
) else (
    echo [ERROR] Native stub generator compilation failed!
    goto :error
)

REM Compile the PE template generator
echo [2/4] Compiling pe_stub_template.cpp...
if "%COMPILER%"=="g++" (
    g++ -std=c++17 -O2 -static -static-libgcc -static-libstdc++ ^
        -o "native_stubs\pe_stub_template.exe" ^
        pe_stub_template.cpp ^
        -lkernel32 -luser32
) else if "%COMPILER%"=="cl" (
    cl /EHsc /std:c++17 /O2 /MT ^
        /Fe:"native_stubs\pe_stub_template.exe" ^
        pe_stub_template.cpp ^
        kernel32.lib user32.lib
) else if "%COMPILER%"=="clang++" (
    clang++ -std=c++17 -O2 -static ^
        -o "native_stubs\pe_stub_template.exe" ^
        pe_stub_template.cpp ^
        -lkernel32 -luser32
)

if exist "native_stubs\pe_stub_template.exe" (
    echo [SUCCESS] PE template generator compiled!
) else (
    echo [WARNING] PE template generator compilation failed!
)

REM Compile the stub runner
echo [3/4] Compiling stub_runner.cpp...
if "%COMPILER%"=="g++" (
    g++ -std=c++17 -O2 -static -static-libgcc -static-libstdc++ ^
        -o "native_stubs\stub_runner.exe" ^
        stub_runner.cpp ^
        -ladvapi32 -lversion -lshlwapi -lpsapi -lntdll -lkernel32 -luser32 -lshell32
) else if "%COMPILER%"=="cl" (
    cl /EHsc /std:c++17 /O2 /MT ^
        /Fe:"native_stubs\stub_runner.exe" ^
        stub_runner.cpp ^
        advapi32.lib version.lib shlwapi.lib psapi.lib ntdll.lib kernel32.lib user32.lib shell32.lib
) else if "%COMPILER%"=="clang++" (
    clang++ -std=c++17 -O2 -static ^
        -o "native_stubs\stub_runner.exe" ^
        stub_runner.cpp ^
        -ladvapi32 -lversion -lshlwapi -lpsapi -lntdll -lkernel32 -luser32 -lshell32
)

if exist "native_stubs\stub_runner.exe" (
    echo [SUCCESS] Stub runner compiled!
) else (
    echo [WARNING] Stub runner compilation failed!
)

REM Compile the self-contained executable generator
echo [4/4] Compiling self_contained_executable.cpp...
if "%COMPILER%"=="g++" (
    g++ -std=c++17 -O2 -static -static-libgcc -static-libstdc++ ^
        -o "native_stubs\self_contained_generator.exe" ^
        self_contained_executable.cpp ^
        -ladvapi32 -lversion -lshlwapi -lpsapi -lntdll -lkernel32 -luser32
) else if "%COMPILER%"=="cl" (
    cl /EHsc /std:c++17 /O2 /MT ^
        /Fe:"native_stubs\self_contained_generator.exe" ^
        self_contained_executable.cpp ^
        advapi32.lib version.lib shlwapi.lib psapi.lib ntdll.lib kernel32.lib user32.lib
) else if "%COMPILER%"=="clang++" (
    clang++ -std=c++17 -O2 -static ^
        -o "native_stubs\self_contained_generator.exe" ^
        self_contained_executable.cpp ^
        -ladvapi32 -lversion -lshlwapi -lpsapi -lntdll -lkernel32 -luser32
)

if exist "native_stubs\self_contained_generator.exe" (
    echo [SUCCESS] Self-contained generator compiled!
) else (
    echo [WARNING] Self-contained generator compilation failed!
)

echo.
echo ========================================
echo Phase 2: Generating Stub Templates
echo ========================================

REM Generate stub templates
echo [INFO] Generating stub templates...
if exist "native_stubs\pe_stub_template.exe" (
    cd stub_templates
    ..\native_stubs\pe_stub_template.exe
    cd ..
    echo [SUCCESS] Stub templates generated!
) else (
    echo [WARNING] Skipping template generation (PE template generator not available)
)

echo.
echo ========================================
echo Phase 3: Creating Test Payloads
echo ========================================

REM Create test payloads
echo [INFO] Creating test payloads...

REM JavaScript test payload
echo console.log('Hello from embedded JavaScript!'); > test_payloads\test.js

REM Python test payload
echo print('Hello from embedded Python!') > test_payloads\test.py

REM Batch test payload
echo @echo off > test_payloads\test.bat
echo echo Hello from embedded batch file! >> test_payloads\test.bat
echo pause >> test_payloads\test.bat

REM PowerShell test payload
echo Write-Host "Hello from embedded PowerShell!" > test_payloads\test.ps1

echo [SUCCESS] Test payloads created!

echo.
echo ========================================
echo COMPILATION COMPLETE
echo ========================================
echo.
echo Generated executables in 'native_stubs' directory:
echo.
dir /b native_stubs\*.exe 2>nul
echo.
echo Generated templates in 'stub_templates' directory:
echo.
dir /b stub_templates\*.exe 2>nul
echo.
echo Test payloads in 'test_payloads' directory:
echo.
dir /b test_payloads\*.* 2>nul
echo.
echo ========================================
echo USAGE EXAMPLES
echo ========================================
echo.
echo 1. Generate a basic stub:
echo    native_stubs\native_stub_generator.exe -o test.exe
echo.
echo 2. Generate stub with JavaScript payload:
echo    native_stubs\native_stub_generator.exe -o js_stub.exe -p test_payloads\test.js
echo.
echo 3. Generate stub with Python payload:
echo    native_stubs\native_stub_generator.exe -o py_stub.exe -p test_payloads\test.py
echo.
echo 4. Generate stub with batch payload:
echo    native_stubs\native_stub_generator.exe -o bat_stub.exe -p test_payloads\test.bat
echo.
echo 5. Generate stub with PowerShell payload:
echo    native_stubs\native_stub_generator.exe -o ps1_stub.exe -p test_payloads\test.ps1
echo.
echo 6. Generate stub with custom properties:
echo    native_stub_generator.exe -o app.exe -p script.js -i icon.ico -v 1.0.0 -c "Company" -n "Product"
echo.
echo 7. Generate PE template:
echo    native_stubs\pe_stub_template.exe
echo.
echo 8. Test stub execution:
echo    Run any generated .exe file to test payload execution
echo.
echo ========================================
echo FEATURES
echo ========================================
echo.
echo ✓ Native C++ implementation (no .NET required)
echo ✓ Anti-analysis detection (debugger, VM, sandbox)
echo ✓ Payload encryption with random keys
echo ✓ Multiple payload format support (JS, Python, Batch, PS1, EXE)
echo ✓ PE stub template generation
echo ✓ Resource-based payload embedding
echo ✓ Temporary file cleanup
echo ✓ Random delays and obfuscation
echo.
echo Press any key to exit...
pause >nul
exit /b 0

:error
echo.
echo [ERROR] Compilation failed! Check the error messages above.
echo.
echo Common issues:
echo - Missing Windows SDK headers
echo - Incorrect compiler installation
echo - Missing required libraries
echo - Insufficient disk space
echo.
echo Troubleshooting:
echo 1. Ensure you have a C++ compiler installed
echo 2. Check that Windows SDK is properly installed
echo 3. Verify PATH environment variables
echo 4. Try running as Administrator
echo.
pause
exit /b 1
