@echo off
echo Testing All Stub Templates...
echo.

REM Create input file with test commands
echo 2 > input.txt
echo. >> input.txt

REM Run smart stub generator with input
smart_stub_generator.exe < input.txt

REM Clean up
del input.txt

echo.
echo Template testing completed!
pause
