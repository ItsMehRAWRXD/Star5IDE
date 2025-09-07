@echo off
echo Building Go stub: go_simple
echo ========================================

echo Executing: go build -o generated_stubs/go_simple_1756778224020488300.exe generated_stubs/go_simple_1756778224020488300.go
go build -o generated_stubs/go_simple_1756778224020488300.exe generated_stubs/go_simple_1756778224020488300.go
if %ERRORLEVEL% NEQ 0 (
    echo Build failed!
    pause
    exit /b 1
)
echo Build successful!

echo ========================================
echo Stub build completed!
pause
