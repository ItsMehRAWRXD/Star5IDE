@echo off
echo Building Python stub: python_simple
echo ========================================

echo Executing: python generated_stubs/python_simple_1756778290629707900.py
python generated_stubs/python_simple_1756778290629707900.py
if %ERRORLEVEL% NEQ 0 (
    echo Build failed!
    pause
    exit /b 1
)
echo Build successful!

echo ========================================
echo Stub build completed!
pause
