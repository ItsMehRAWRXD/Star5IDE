@echo off
echo ========================================
echo    RawrZ Framework - Test Runner
echo ========================================
echo.
echo [1/3] Checking Tests folder...
if not exist "Tests" (
    echo ERROR: Tests folder not found!
    echo Please ensure the Tests folder exists.
    pause
    exit /b 1
)
echo ✓ Tests folder found!
echo.

echo [2/3] Available Tests:
echo ========================================
echo 1. SSL Encryption Test
echo 2. OpenSSL Stub Generation Test
echo 3. Run All Tests
echo 4. View Test Documentation
echo 5. Exit
echo ========================================
echo.

set /p choice="Select test to run (1-5): "

if "%choice%"=="1" (
    echo.
    echo Running SSL Encryption Test...
    cd Tests
    call test_ssl_encryption.bat
    cd ..
) else if "%choice%"=="2" (
    echo.
    echo Running OpenSSL Stub Generation Test...
    cd Tests
    call test_openssl_stubs.bat
    cd ..
) else if "%choice%"=="3" (
    echo.
    echo Running All Tests...
    cd Tests
    echo.
    echo === SSL Encryption Test ===
    call test_ssl_encryption.bat
    echo.
    echo === OpenSSL Stub Generation Test ===
    call test_openssl_stubs.bat
    cd ..
) else if "%choice%"=="4" (
    echo.
    echo Opening Test Documentation...
    if exist "Tests\README.md" (
        start Tests\README.md
    ) else (
        echo Documentation file not found!
    )
) else if "%choice%"=="5" (
    echo Exiting...
    exit /b 0
) else (
    echo Invalid choice! Please select 1-5.
    pause
    goto :eof
)

echo.
echo ========================================
echo Test execution complete!
echo Check the Tests folder for results.
echo ========================================
pause
