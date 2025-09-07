@echo off
setlocal enabledelayedexpansion

:MAIN_MENU
cls
echo ========================================
echo       RawrZ Plugin Testing Suite
echo ========================================
echo.
echo 1. Compile all test programs
echo 2. Test individual fake bot
echo 3. Test individual fake AV
echo 4. Test multiple threats scenario
echo 5. Run comprehensive plugin test
echo 6. Clean up test files
echo 7. Exit
echo.
set /p choice="Enter your choice (1-7): "

if "%choice%"=="1" goto COMPILE_ALL
if "%choice%"=="2" goto TEST_BOT
if "%choice%"=="3" goto TEST_AV
if "%choice%"=="4" goto TEST_MULTIPLE
if "%choice%"=="5" goto COMPREHENSIVE_TEST
if "%choice%"=="6" goto CLEANUP
if "%choice%"=="7" goto EXIT
goto MAIN_MENU

:COMPILE_ALL
cls
echo ========================================
echo        Compiling Test Programs
echo ========================================
echo.

echo Compiling fake bot...
g++ -std=c++17 -o fake_bot.exe test_fake_bot.cpp -lws2_32
if %errorlevel% equ 0 (
    echo [SUCCESS] Fake bot compiled successfully
) else (
    echo [ERROR] Failed to compile fake bot
)

echo.
echo Compiling fake AV...
g++ -std=c++17 -o fake_av.exe test_fake_av.cpp -lws2_32
if %errorlevel% equ 0 (
    echo [SUCCESS] Fake AV compiled successfully
) else (
    echo [ERROR] Failed to compile fake AV
)

echo.
echo Compiling multiple threats simulator...
g++ -std=c++17 -o multiple_threats.exe test_multiple_threats.cpp -lws2_32
if %errorlevel% equ 0 (
    echo [SUCCESS] Multiple threats simulator compiled successfully
) else (
    echo [ERROR] Failed to compile multiple threats simulator
)

echo.
echo Compiling test suite...
g++ -std=c++17 -o test_suite.exe test_suite.cpp -lws2_32
if %errorlevel% equ 0 (
    echo [SUCCESS] Test suite compiled successfully
) else (
    echo [ERROR] Failed to compile test suite
)

echo.
echo All compilation tasks completed!
pause
goto MAIN_MENU

:TEST_BOT
cls
echo ========================================
echo         Testing Fake Bot
echo ========================================
echo.
echo This will start a fake bot process that you can test
echo with the BotKiller plugin from RawrZ.
echo.
echo Press any key to start the fake bot...
pause >nul

echo Starting fake bot...
start "Fake Bot Test" fake_bot.exe

echo.
echo Fake bot started! Now:
echo 1. Open RawrZ
echo 2. Go to BotKiller plugin
echo 3. Try to kill the fake bot process
echo 4. Come back here and press any key to check status
echo.
pause >nul

echo Checking if fake bot is still running...
tasklist | findstr "fake_bot" >nul
if %errorlevel% equ 0 (
    echo [WARNING] Fake bot process still running!
    echo The BotKiller plugin may not have worked correctly.
) else (
    echo [SUCCESS] Fake bot process was killed!
    echo The BotKiller plugin worked correctly!
)

echo.
pause
goto MAIN_MENU

:TEST_AV
cls
echo ========================================
echo         Testing Fake AV
echo ========================================
echo.
echo This will start a fake AV process that you can test
echo with the AVKiller plugin from RawrZ.
echo.
echo Press any key to start the fake AV...
pause >nul

echo Starting fake AV...
start "Fake AV Test" fake_av.exe

echo.
echo Fake AV started! Now:
echo 1. Open RawrZ
echo 2. Go to AVKiller plugin
echo 3. Try to kill the fake AV process
echo 4. Come back here and press any key to check status
echo.
pause >nul

echo Checking if fake AV is still running...
tasklist | findstr "fake_av" >nul
if %errorlevel% equ 0 (
    echo [WARNING] Fake AV process still running!
    echo The AVKiller plugin may not have worked correctly.
) else (
    echo [SUCCESS] Fake AV process was killed!
    echo The AVKiller plugin worked correctly!
)

echo.
pause
goto MAIN_MENU

:TEST_MULTIPLE
cls
echo ========================================
echo      Testing Multiple Threats
echo ========================================
echo.
echo This will start multiple fake threat processes:
echo - 2 bot processes
echo - 2 AV processes  
echo - 1 keylogger process
echo - 1 ransomware process
echo.
echo Press any key to start multiple threats...
pause >nul

echo Starting multiple threats...
start "Multiple Threats Test" multiple_threats.exe

echo.
echo Multiple threats started! Now:
echo 1. Open RawrZ
echo 2. Test various plugins:
echo    - BotKiller for bot processes
echo    - AVKiller for AV processes
echo    - Other plugins as needed
echo 3. Come back here and press any key to check status
echo.
pause >nul

echo Checking running threat processes...
echo.
echo Bot processes:
tasklist | findstr "multiple_threats"
echo.
echo Check the multiple threats console window for detailed status.
echo.
pause
goto MAIN_MENU

:COMPREHENSIVE_TEST
cls
echo ========================================
echo      Comprehensive Plugin Test
echo ========================================
echo.
echo This will run the full test suite to verify all plugins.
echo.
echo Press any key to start comprehensive testing...
pause >nul

echo Running comprehensive test suite...
test_suite.exe

echo.
echo Comprehensive test completed!
echo Check test_results.log for detailed results.
echo.
pause
goto MAIN_MENU

:CLEANUP
cls
echo ========================================
echo           Cleanup
echo ========================================
echo.
echo Cleaning up test files...

echo Removing test executables...
del /q fake_bot.exe 2>nul
del /q fake_av.exe 2>nul
del /q multiple_threats.exe 2>nul
del /q test_suite.exe 2>nul

echo Removing temporary files...
del /q suspicious_*.tmp 2>nul
del /q av_log_*.log 2>nul

echo Removing test output...
rmdir /s /q test_output 2>nul
del /q test_results.log 2>nul

echo Cleanup completed!
pause
goto MAIN_MENU

:EXIT
echo Exiting RawrZ Plugin Testing Suite...
exit /b 0
