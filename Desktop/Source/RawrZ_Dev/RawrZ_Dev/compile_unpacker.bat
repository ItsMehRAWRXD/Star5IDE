@echo off
echo ZenCrypto Unpacker Compilation Script
echo =====================================
echo.

echo Compiling with MSVC (cl.exe)...
if exist "C:\Program Files (x86)\Microsoft Visual Studio\2019\Community\VC\Auxiliary\Build\vcvars64.bat" (
    call "C:\Program Files (x86)\Microsoft Visual Studio\2019\Community\VC\Auxiliary\Build\vcvars64.bat"
    cl /O2 /GS- /Fe:unpack_msvc.exe unpack.cpp
    if exist unpack_msvc.exe (
        echo MSVC compilation successful: unpack_msvc.exe
    ) else (
        echo MSVC compilation failed
    )
) else if exist "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars64.bat" (
    call "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars64.bat"
    cl /O2 /GS- /Fe:unpack_msvc.exe unpack.cpp
    if exist unpack_msvc.exe (
        echo MSVC compilation successful: unpack_msvc.exe
    ) else (
        echo MSVC compilation failed
    )
) else (
    echo MSVC not found, skipping...
)

echo.
echo Compiling with MinGW-w64 (g++)...
where g++ >nul 2>&1
if %errorlevel% == 0 (
    g++ -O2 -s -static -o unpack_mingw.exe unpack.cpp
    if exist unpack_mingw.exe (
        echo MinGW compilation successful: unpack_mingw.exe
    ) else (
        echo MinGW compilation failed
    )
) else (
    echo g++ not found, skipping...
)

echo.
echo Compiling with Clang...
where clang++ >nul 2>&1
if %errorlevel% == 0 (
    clang++ -O2 -s -static -o unpack_clang.exe unpack.cpp
    if exist unpack_clang.exe (
        echo Clang compilation successful: unpack_clang.exe
    ) else (
        echo Clang compilation failed
    )
) else (
    echo clang++ not found, skipping...
)

echo.
echo Compilation complete!
echo.
echo Usage examples:
echo   unpack_msvc.exe packed.exe payload.bin
echo   unpack_mingw.exe packed.exe payload.bin
echo   unpack_clang.exe packed.exe payload.bin
echo.
pause
