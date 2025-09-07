@echo off
echo === RawrZ Plugin Live Testing ===
echo.

echo Compiling fake bot process...
g++ -std=c++17 -o fake_bot.exe test_fake_bot.cpp -lws2_32
if %errorlevel% neq 0 (
    echo Failed to compile fake bot!
    pause
    exit /b 1
)

echo Compiling fake AV process...
g++ -std=c++17 -o fake_av.exe test_fake_av.cpp -lws2_32
if %errorlevel% neq 0 (
    echo Failed to compile fake AV!
    pause
    exit /b 1
)

echo.
echo === Starting Test Processes ===
echo.

echo Starting fake bot in background...
start "Fake Bot" fake_bot.exe

echo Starting fake AV in background...
start "Fake AV" fake_av.exe

echo.
echo Waiting 5 seconds for processes to start...
timeout /t 5 /nobreak >nul

echo.
echo === Current Running Processes ===
tasklist | findstr "fake_bot\|fake_av"

echo.
echo === Testing BotKiller Plugin ===
echo Now run the BotKiller plugin from RawrZ to kill the fake bot process
echo Look for processes named "fake_bot.exe" or "TestBot_v1.0"
echo.

echo === Testing AVKiller Plugin ===
echo Now run the AVKiller plugin from RawrZ to kill the fake AV process
echo Look for processes named "fake_av.exe" or "TestAV_Pro_v2.1"
echo.

echo Press any key to continue and check if processes were killed...
pause >nul

echo.
echo === Checking Process Status ===
echo.

echo Checking for fake bot processes...
tasklist | findstr "fake_bot"
if %errorlevel% equ 0 (
    echo [WARNING] Fake bot process still running!
) else (
    echo [SUCCESS] Fake bot process was killed!
)

echo.
echo Checking for fake AV processes...
tasklist | findstr "fake_av"
if %errorlevel% equ 0 (
    echo [WARNING] Fake AV process still running!
) else (
    echo [SUCCESS] Fake AV process was killed!
)

echo.
echo === Cleanup ===
echo Cleaning up test files...
del /q suspicious_*.tmp 2>nul
del /q av_log_*.log 2>nul

echo.
echo === Test Complete ===
echo Check the results above to see if the plugins worked correctly.
echo.
pause
