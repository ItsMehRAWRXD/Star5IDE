@echo off
echo Building C++ stub: cpp_simple
echo ========================================

echo Executing: g++ -std=c++17 -O2 -o generated_stubs/cpp_simple_1756778309916777500.exe generated_stubs/cpp_simple_1756778309916777500.cpp
g++ -std=c++17 -O2 -o generated_stubs/cpp_simple_1756778309916777500.exe generated_stubs/cpp_simple_1756778309916777500.cpp
if %ERRORLEVEL% NEQ 0 (
    echo Build failed!
    pause
    exit /b 1
)
echo Build successful!

echo ========================================
echo Stub build completed!
pause
