@echo off
echo ========================================
echo Native Stub Generator Compiler
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
echo [INFO] Compiling Native Stub Generator...
echo.

REM Create output directory
if not exist "native_stubs" mkdir native_stubs

REM Compile the main stub generator
echo Compiling native_stub_generator.cpp...
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
    echo [SUCCESS] Native stub generator compiled successfully!
) else (
    echo [ERROR] Compilation failed!
    goto :error
)

REM Compile the PE template generator
echo.
echo Compiling pe_stub_template.cpp...
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
    echo [SUCCESS] PE template generator compiled successfully!
) else (
    echo [WARNING] PE template generator compilation failed!
)

echo.
echo ========================================
echo COMPILATION COMPLETE
echo ========================================
echo.
echo Generated executables in 'native_stubs' directory:
echo.
dir /b native_stubs\*.exe 2>nul
echo.
echo Usage examples:
echo.
echo 1. Generate a basic stub:
echo    native_stubs\native_stub_generator.exe -o test.exe
echo.
echo 2. Generate stub with payload:
echo    native_stub_generator.exe -o payload.exe -p your_file.bin
echo.
echo 3. Generate stub with custom properties:
echo    native_stub_generator.exe -o app.exe -p script.js -i icon.ico -v 1.0.0
echo.
echo 4. Generate PE template:
echo    native_stubs\pe_stub_template.exe
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
echo.
pause
exit /b 1
