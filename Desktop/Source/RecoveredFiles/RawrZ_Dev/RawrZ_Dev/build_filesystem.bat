@echo off
echo Building FileSystemGenerator...

REM Try to build with C++17 filesystem support
g++ -std=c++17 -c FileSystemGenerator.cpp -o FileSystemGenerator.o

if %ERRORLEVEL% EQU 0 (
    echo Compilation successful!
    echo Creating executable...
    g++ -std=c++17 FileSystemGenerator.o -o FileSystemGenerator.exe -lstdc++fs
    if %ERRORLEVEL% EQU 0 (
        echo Build completed successfully!
        echo Executable: FileSystemGenerator.exe
    ) else (
        echo Failed to create executable
    )
) else (
    echo Compilation failed!
    echo Trying alternative approach...
    
    REM Try with experimental filesystem
    g++ -std=c++14 -c FileSystemGenerator.cpp -o FileSystemGenerator.o -D_GLIBCXX_USE_CXX11_ABI=0
    if %ERRORLEVEL% EQU 0 (
        echo Compilation with experimental filesystem successful!
        echo Creating executable...
        g++ -std=c++14 FileSystemGenerator.o -o FileSystemGenerator.exe -lstdc++fs
        echo Build completed successfully!
        echo Executable: FileSystemGenerator.exe
    ) else (
        echo All compilation attempts failed!
    )
)

pause
