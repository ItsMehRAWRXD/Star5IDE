@echo off
setlocal enabledelayedexpansion

echo ========================================
echo RawrZ Universal Build System
echo ========================================
echo.

REM Initialize variables
set BUILD_SUCCESS=false
set COMPILER_FOUND=false
set COMPILER_NAME=
set COMPILER_PATH=

echo [INFO] Detecting available compilers...
echo.

REM Check for MSVC (Visual Studio)
echo [INFO] Checking for MSVC...
call :find_msvc
if !COMPILER_FOUND!==true (
    echo [SUCCESS] Found MSVC: !COMPILER_PATH!
    goto :build_msvc
)

REM Check for MinGW-w64
echo [INFO] Checking for MinGW-w64...
call :find_mingw
if !COMPILER_FOUND!==true (
    echo [SUCCESS] Found MinGW-w64: !COMPILER_PATH!
    goto :build_mingw
)

REM Check for GCC
echo [INFO] Checking for GCC...
call :find_gcc
if !COMPILER_FOUND!==true (
    echo [SUCCESS] Found GCC: !COMPILER_PATH!
    goto :build_gcc
)

REM No compiler found
echo [ERROR] No suitable compiler found!
echo.
echo Please install one of the following:
echo 1. Visual Studio Build Tools (recommended)
echo 2. MinGW-w64
echo 3. GCC for Windows
echo.
echo Or ensure one of these is in your PATH.
pause
exit /b 1

:find_msvc
REM Try to find MSVC in common locations
for %%v in (2022 2019 2017) do (
    for %%e in (Enterprise Professional Community BuildTools) do (
        if exist "C:\Program Files\Microsoft Visual Studio\%%v\%%e\VC\Tools\MSVC" (
            for /d %%m in ("C:\Program Files\Microsoft Visual Studio\%%v\%%e\VC\Tools\MSVC\*") do (
                if exist "%%m\bin\Hostx64\x64\cl.exe" (
                    set COMPILER_PATH=%%m\bin\Hostx64\x64\cl.exe
                    set COMPILER_NAME=MSVC
                    set COMPILER_FOUND=true
                    exit /b
                )
            )
        )
        if exist "C:\Program Files (x86)\Microsoft Visual Studio\%%v\%%e\VC\Tools\MSVC" (
            for /d %%m in ("C:\Program Files (x86)\Microsoft Visual Studio\%%v\%%e\VC\Tools\MSVC\*") do (
                if exist "%%m\bin\Hostx64\x64\cl.exe" (
                    set COMPILER_PATH=%%m\bin\Hostx64\x64\cl.exe
                    set COMPILER_NAME=MSVC
                    set COMPILER_FOUND=true
                    exit /b
                )
            )
        )
    )
)
exit /b

:find_mingw
REM Check for MinGW-w64 in PATH and common locations
where g++.exe >nul 2>&1
if !ERRORLEVEL!==0 (
    set COMPILER_PATH=g++.exe
    set COMPILER_NAME=MinGW-w64
    set COMPILER_FOUND=true
    exit /b
)

REM Check common MinGW installation paths
for %%p in (
    "C:\mingw64\bin\g++.exe"
    "C:\msys64\mingw64\bin\g++.exe"
    "C:\Program Files\mingw-w64\x86_64-8.1.0-posix-seh-rt_v6-rev0\mingw64\bin\g++.exe"
) do (
    if exist %%p (
        set COMPILER_PATH=%%p
        set COMPILER_NAME=MinGW-w64
        set COMPILER_FOUND=true
        exit /b
    )
)
exit /b

:find_gcc
REM Check for GCC in PATH
where gcc.exe >nul 2>&1
if !ERRORLEVEL!==0 (
    set COMPILER_PATH=gcc.exe
    set COMPILER_NAME=GCC
    set COMPILER_FOUND=true
    exit /b
)
exit /b

:build_msvc
echo [INFO] Building with MSVC...
echo.

REM Set up MSVC environment
for /f "tokens=*" %%i in ('where cl.exe') do set CL_PATH=%%i
for /f "tokens=*" %%i in ('where link.exe') do set LINK_PATH=%%i

if not defined CL_PATH (
    echo [ERROR] cl.exe not found in PATH
    goto :build_failed
)

echo [INFO] Using MSVC compiler: !CL_PATH!
echo [INFO] Using MSVC linker: !LINK_PATH!

REM Build with MSVC
!CL_PATH! /std:c++17 /EHsc /O2 /D_WIN32_WINNT=0x0601 ^
    RawrZ_Simple.cpp ^
    /Fe:RawrZ_Simple.exe

if !ERRORLEVEL!==0 (
    set BUILD_SUCCESS=true
    echo [SUCCESS] MSVC build completed successfully!
) else (
    echo [ERROR] MSVC build failed!
)
goto :build_end

:build_mingw
echo [INFO] Building with MinGW-w64...
echo.

REM Build with MinGW-w64
!COMPILER_PATH! -std=c++17 -O2 -static-libgcc -static-libstdc++ ^
    -D_WIN32_WINNT=0x0601 ^
    RawrZ_Simple.cpp ^
    -o RawrZ_Simple.exe

if !ERRORLEVEL!==0 (
    set BUILD_SUCCESS=true
    echo [SUCCESS] MinGW-w64 build completed successfully!
) else (
    echo [ERROR] MinGW-w64 build failed!
)
goto :build_end

:build_gcc
echo [INFO] Building with GCC...
echo.

REM Build with GCC
!COMPILER_PATH! -std=c++17 -O2 -static-libgcc -static-libstdc++ ^
    -D_WIN32_WINNT=0x0601 ^
    RawrZ_Simple.cpp ^
    -o RawrZ_Simple.exe

if !ERRORLEVEL!==0 (
    set BUILD_SUCCESS=true
    echo [SUCCESS] GCC build completed successfully!
) else (
    echo [ERROR] GCC build failed!
)
goto :build_end

:build_failed
echo [ERROR] Build system setup failed!
set BUILD_SUCCESS=false
goto :build_end

:build_end
echo.
if !BUILD_SUCCESS!==true (
    echo ========================================
    echo BUILD SUCCESSFUL!
    echo ========================================
    echo.
    echo RawrZ_Simple.exe has been created successfully.
    echo.
    echo Available features:
    echo - Advanced Encryption Methods
    echo - Stub Generation
    echo - File Operations
    echo - Plugin System
    echo - Anti-Analysis Features
    echo.
    echo Run: RawrZ_Simple.exe
    echo.
    
    REM Test if the executable was created
    if exist "RawrZ_Simple.exe" (
        echo [INFO] Executable size: 
        for %%A in (RawrZ_Simple.exe) do echo [INFO] %%~zA bytes
    )
) else (
    echo ========================================
    echo BUILD FAILED!
    echo ========================================
    echo.
    echo Please check the error messages above.
    echo Common issues:
    echo 1. Missing C++17 support
    echo 2. Missing Windows headers
    echo 3. Compiler not properly configured
    echo.
)

echo.
pause
exit /b !ERRORLEVEL!
