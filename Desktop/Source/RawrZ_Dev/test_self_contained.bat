@echo off
chcp 65001 >nul
echo ========================================
echo Self-Contained Executable Generator Test
echo ========================================
echo.

REM Create test directory
if not exist "test_output" mkdir test_output

REM Generate test payload (simple calc.exe stub)
echo [INFO] Creating test payload...
echo #include ^<iostream^> > test_output\test_payload.cpp
echo int main() { std::cout ^<^< "Hello from test payload!"; return 0; } >> test_output\test_payload.cpp

REM Compile test payload
echo [INFO] Compiling test payload...
g++ -o test_output\test_payload.exe test_output\test_payload.cpp

if exist "test_output\test_payload.exe" (
    echo [SUCCESS] Test payload created: test_output\test_payload.exe
    
    REM Generate self-contained executable
    echo [INFO] Generating self-contained executable...
    
    REM Create test script
    echo #include ^<iostream^> > test_output\test_generator.cpp
    echo #include "self_contained_executable.h" >> test_output\test_generator.cpp
    echo #include ^<vector^> >> test_output\test_generator.cpp
    echo #include ^<string^> >> test_output\test_generator.cpp
    echo. >> test_output\test_generator.cpp
    echo int main() { >> test_output\test_generator.cpp
    echo     std::vector^<uint8_t^> key(32, 0x42); >> test_output\test_generator.cpp
    echo     std::vector^<uint8_t^> iv(16, 0x24); >> test_output\test_generator.cpp
    echo     std::string error; >> test_output\test_generator.cpp
    echo     bool success = SelfContainedExecutable::GenerateFromFile( >> test_output\test_generator.cpp
    echo         "test_output\\test_payload.exe", >> test_output\test_generator.cpp
    echo         "test_output\\self_contained_test.exe", >> test_output\test_generator.cpp
    echo         key, iv, true, true, false, ^&error); >> test_output\test_generator.cpp
    echo     if (success) { >> test_output\test_generator.cpp
    echo         std::cout ^<^< "Self-contained executable generated successfully!"; >> test_output\test_generator.cpp
    echo     } else { >> test_output\test_generator.cpp
    echo         std::cout ^<^< "Failed: " ^<^< error; >> test_output\test_generator.cpp
    echo     } >> test_output\test_generator.cpp
    echo     return 0; >> test_output\test_generator.cpp
    echo } >> test_output\test_generator.cpp
    
    REM Compile test generator
    echo [INFO] Compiling test generator...
    g++ -o test_output\test_generator.exe test_output\test_generator.cpp self_contained_executable.cpp -static-libgcc -static-libstdc++
    
    if exist "test_output\test_generator.exe" (
        echo [SUCCESS] Test generator compiled!
        echo [INFO] Running test generator...
        cd test_output
        test_generator.exe
        cd ..
        
        if exist "test_output\self_contained_test.exe" (
            echo [SUCCESS] Self-contained executable generated!
            echo [INFO] Files created:
            echo   - test_output\test_payload.exe (original)
            echo   - test_output\self_contained_test.exe (self-contained)
            echo.
            echo [READY] Upload these to VirusTotal/WebSec for scanning!
        ) else (
            echo [WARNING] Self-contained executable not found
        )
    ) else (
        echo [ERROR] Failed to compile test generator
    )
) else (
    echo [ERROR] Failed to create test payload
)

echo.
echo ========================================
echo Test Complete!
echo ========================================
pause
