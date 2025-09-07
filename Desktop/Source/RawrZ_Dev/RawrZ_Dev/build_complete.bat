@echo off
echo Building RawrZ Complete Framework...
echo.

REM Set compiler and flags
set COMPILER=cl
set CFLAGS=/std:c++17 /EHsc /O2 /DUSE_OPENSSL

REM Try to find Visual Studio 2022 Enterprise
if exist "C:\Program Files\Microsoft Visual Studio\2022\Enterprise\VC\Tools\MSVC\14.37.32822\include" (
    set INCLUDE_PATH="C:\Program Files\Microsoft Visual Studio\2022\Enterprise\VC\Tools\MSVC\14.37.32822\include"
    set LIB_PATH="C:\Program Files\Microsoft Visual Studio\2022\Enterprise\VC\Tools\MSVC\14.37.32822\lib\x64"
    echo Found Visual Studio 2022 Enterprise
) else if exist "C:\Program Files\Microsoft Visual Studio\2022\Professional\VC\Tools\MSVC\14.37.32822\include" (
    set INCLUDE_PATH="C:\Program Files\Microsoft Visual Studio\2022\Professional\VC\Tools\MSVC\14.37.32822\include"
    set LIB_PATH="C:\Program Files\Microsoft Visual Studio\2022\Professional\VC\Tools\MSVC\14.37.32822\lib\x64"
    echo Found Visual Studio 2022 Professional
) else if exist "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Tools\MSVC\14.37.32822\include" (
    set INCLUDE_PATH="C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Tools\MSVC\14.37.32822\include"
    set LIB_PATH="C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Tools\MSVC\14.37.32822\lib\x64"
    echo Found Visual Studio 2022 Community
) else (
    echo Visual Studio 2022 not found, trying alternative paths...
    if exist "C:\Program Files (x86)\Microsoft Visual Studio\2019\Enterprise\VC\Tools\MSVC\14.29.30133\include" (
        set INCLUDE_PATH="C:\Program Files (x86)\Microsoft Visual Studio\2019\Enterprise\VC\Tools\MSVC\14.29.30133\include"
        set LIB_PATH="C:\Program Files (x86)\Microsoft Visual Studio\2019\Enterprise\VC\Tools\MSVC\14.29.30133\lib\x64"
        echo Found Visual Studio 2019 Enterprise
    ) else (
        echo Using g++ as fallback...
        set COMPILER=g++
        set CFLAGS=-std=c++17 -O2 -DUSE_OPENSSL
    )
)

REM Try to find Windows SDK
if exist "C:\Program Files (x86)\Windows Kits\10\Include\10.0.22621.0\um" (
    set SDK_INCLUDE="C:\Program Files (x86)\Windows Kits\10\Include\10.0.22621.0\um"
    set SDK_LIB="C:\Program Files (x86)\Windows Kits\10\Lib\10.0.22621.0\um\x64"
    echo Found Windows SDK 10.0.22621.0
) else if exist "C:\Program Files (x86)\Windows Kits\10\Include\10.0.22000.0\um" (
    set SDK_INCLUDE="C:\Program Files (x86)\Windows Kits\10\Include\10.0.22000.0\um"
    set SDK_LIB="C:\Program Files (x86)\Windows Kits\10\Lib\10.0.22000.0\um\x64"
    echo Found Windows SDK 10.0.22000.0
) else (
    echo Windows SDK not found, trying alternative paths...
    if exist "C:\Program Files (x86)\Windows Kits\10\Include\10.0.19041.0\um" (
        set SDK_INCLUDE="C:\Program Files (x86)\Windows Kits\10\Include\10.0.19041.0\um"
        set SDK_LIB="C:\Program Files (x86)\Windows Kits\10\Lib\10.0.19041.0\um\x64"
        echo Found Windows SDK 10.0.19041.0
    )
)

REM Try to find OpenSSL
if exist "C:\vcpkg\installed\x64-windows\include\openssl" (
    set OPENSSL_INCLUDE="C:\vcpkg\installed\x64-windows\include"
    set OPENSSL_LIB="C:\vcpkg\installed\x64-windows\lib"
    echo Found OpenSSL via vcpkg
) else if exist "C:\OpenSSL-Win64\include\openssl" (
    set OPENSSL_INCLUDE="C:\OpenSSL-Win64\include"
    set OPENSSL_LIB="C:\OpenSSL-Win64\lib"
    echo Found OpenSSL in C:\OpenSSL-Win64
) else (
    echo OpenSSL not found, building without OpenSSL support...
    set CFLAGS=%CFLAGS% /DNO_OPENSSL
)

echo.
echo Compiling RawrZ Complete Framework...

if "%COMPILER%"=="cl" (
    REM MSVC compilation
    %COMPILER% %CFLAGS% ^
        /I%INCLUDE_PATH% ^
        /I%SDK_INCLUDE% ^
        /I%OPENSSL_INCLUDE% ^
        /LIBPATH:%LIB_PATH% ^
        /LIBPATH:%SDK_LIB% ^
        /LIBPATH:%OPENSSL_LIB% ^
        RawrZ_Complete.cpp ^
        SimplePluginIntegration.cpp ^
        plugins\ExploitGenerator.cpp ^
        plugins\AVKiller.cpp ^
        plugins\DotNetCrypter.cpp ^
        plugins\BotKiller.cpp ^
        plugins\JavaDriveByGenerator.cpp ^
        plugins\FlashExploitGenerator.cpp ^
        ws2_32.lib ^
        libssl.lib ^
        libcrypto.lib ^
        /Fe:RawrZ_Complete.exe
) else (
    REM GCC compilation
    %COMPILER% %CFLAGS% ^
        -I%OPENSSL_INCLUDE% ^
        RawrZ_Complete.cpp ^
        SimplePluginIntegration.cpp ^
        plugins\ExploitGenerator.cpp ^
        plugins\AVKiller.cpp ^
        plugins\DotNetCrypter.cpp ^
        plugins\BotKiller.cpp ^
        plugins\JavaDriveByGenerator.cpp ^
        plugins\FlashExploitGenerator.cpp ^
        -lws2_32 ^
        -lssl ^
        -lcrypto ^
        -o RawrZ_Complete.exe
)

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Build successful! RawrZ_Complete.exe created.
    echo.
    echo Available features:
    echo - Advanced Encryption Methods
    echo - Stub Generation
    echo - File Operations
    echo - Plugin System (17 Advanced Plugins)
    echo - Drag & Drop Interface
    echo - Anti-Analysis Features
    echo.
    echo Run: RawrZ_Complete.exe
) else (
    echo.
    echo Build failed! Error code: %ERRORLEVEL%
    echo.
    echo Troubleshooting:
    echo 1. Ensure Visual Studio 2022 or 2019 is installed
    echo 2. Ensure Windows SDK is installed
    echo 3. Ensure OpenSSL is installed (optional)
    echo 4. Try running as Administrator
    echo 5. Check that all source files exist
)

pause
