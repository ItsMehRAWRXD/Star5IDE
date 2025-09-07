@echo off
echo Building Assembly stub: asm_x86
echo ========================================

echo Executing: ml /c /coff generated_stubs/asm_x86_1756778297157792400.asm && link /subsystem:console {input:.asm}.obj
ml /c /coff generated_stubs/asm_x86_1756778297157792400.asm && link /subsystem:console {input:.asm}.obj
if %ERRORLEVEL% NEQ 0 (
    echo Build failed!
    pause
    exit /b 1
)
echo Build successful!

echo ========================================
echo Stub build completed!
pause
