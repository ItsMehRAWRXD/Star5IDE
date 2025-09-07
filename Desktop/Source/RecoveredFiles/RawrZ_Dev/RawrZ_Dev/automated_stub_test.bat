@echo off
chcp 65001 >nul
echo ========================================
echo    RawrZ Automated Stub Testing
echo ========================================
echo.

REM Allow user to choose executable
echo Available executables for testing:
echo 1. calc.exe (Calculator)
echo 2. notepad.exe (Notepad)
echo 3. mspaint.exe (Paint)
echo 4. wordpad.exe (WordPad)
echo 5. Custom path
echo.
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" (
    set target_exe=C:\Windows\System32\calc.exe
    set exe_name=calc
) else if "%choice%"=="2" (
    set target_exe=C:\Windows\System32\notepad.exe
    set exe_name=notepad
) else if "%choice%"=="3" (
    set target_exe=C:\Windows\System32\mspaint.exe
    set exe_name=mspaint
) else if "%choice%"=="4" (
    set target_exe=C:\Windows\System32\wordpad.exe
    set exe_name=wordpad
) else if "%choice%"=="5" (
    set /p target_exe="Enter custom executable path: "
    for %%f in ("%target_exe%") do set exe_name=%%~nf
) else (
    echo Invalid choice, using calc.exe as default
    set target_exe=C:\Windows\System32\calc.exe
    set exe_name=calc
)

REM Check if chosen executable exists
if not exist "%target_exe%" (
    echo [ERROR] %target_exe% not found!
    echo Please ensure the executable is available for testing.
    pause
    exit /b 1
)

echo [INFO] Using %target_exe% for testing
echo [INFO] Starting automated stub generation and comparison...
echo.

REM Create test directories
if not exist "test_stubs" mkdir test_stubs
if not exist "test_results" mkdir test_results
if not exist "test_executables" mkdir test_executables

REM Copy target executable to test directory
copy "%target_exe%" "test_executables\%exe_name%_original.exe" >nul
echo [INFO] Copied %exe_name%.exe to test_executables\%exe_name%_original.exe

echo ========================================
echo    Phase 1: OpenSSL Stub Generation
echo ========================================
echo.

REM Generate 5 OpenSSL stubs
for /l %%i in (1,1,5) do (
    echo [INFO] Generating OpenSSL stub %%i/5...
    echo 2 > temp_input.txt
    echo test_executables\%exe_name%_original.exe >> temp_input.txt
    echo 1 >> temp_input.txt
    echo 0 >> temp_input.txt
    
    RawrZ_OpenSSL.exe < temp_input.txt > test_results\openssl_stub_%%i.log 2>&1
    
    REM Wait a moment between generations
    timeout /t 2 /nobreak >nul
    
    REM Rename the generated stub to random name
    if exist "test_executables\%exe_name%_original.exe.stub.cs" (
        set /a random_num=%%random%% %% 9999
        set random_name=random_openssl_%%i_!random_num!.cs
        ren "test_executables\%exe_name%_original.exe.stub.cs" "!random_name!"
        move "test_executables\!random_name!" "test_stubs\"
        echo [INFO] Renamed OpenSSL stub %%i to !random_name!
    )
)

echo.
echo ========================================
echo    Phase 2: Non-OpenSSL Stub Generation
echo ========================================
echo.

REM Generate 5 Non-OpenSSL stubs
for /l %%i in (1,1,5) do (
    echo [INFO] Generating Non-OpenSSL stub %%i/5...
    echo 6 > temp_input.txt
    echo 1 >> temp_input.txt
    echo 0 >> temp_input.txt
    echo 2 >> temp_input.txt
    echo 0 >> temp_input.txt
    echo 0 >> temp_input.txt
    echo 2 >> temp_input.txt
    echo test_executables\%exe_name%_original.exe >> temp_input.txt
    echo 1 >> temp_input.txt
    echo 0 >> temp_input.txt
    echo 0 >> temp_input.txt
    
    RawrZ_OpenSSL.exe < temp_input.txt > test_results\non_openssl_stub_%%i.log 2>&1
    
    REM Wait a moment between generations
    timeout /t 2 /nobreak >nul
    
    REM Rename the generated stub to random name
    if exist "test_executables\%exe_name%_original.exe.stub.cs" (
        set /a random_num=%%random%% %% 9999
        set random_name=random_non_openssl_%%i_!random_num!.cs
        ren "test_executables\%exe_name%_original.exe.stub.cs" "!random_name!"
        move "test_executables\!random_name!" "test_stubs\"
        echo [INFO] Renamed Non-OpenSSL stub %%i to !random_name!
    )
)

echo.
echo ========================================
echo    Phase 3: Compile Stubs to EXEs
echo ========================================
echo.

REM Compile all stubs to executables
echo [INFO] Compiling stubs to executables...
for %%f in (test_stubs\*.cs) do (
    echo [INFO] Compiling %%f...
    csc /target:exe /out:"test_executables\%%~nf.exe" "%%f" >nul 2>&1
    if exist "test_executables\%%~nf.exe" (
        echo [SUCCESS] Compiled %%~nf.exe
    ) else (
        echo [WARNING] Failed to compile %%f - .NET SDK may not be installed
    )
)

echo.
echo ========================================
echo    Phase 4: Running Comparisons
echo ========================================
echo.

REM Create comparison script
echo Creating comparison script...
(
echo @echo off
echo echo ========================================
echo echo    RawrZ Stub Comparison Results
echo echo ========================================
echo echo.
echo echo OpenSSL vs OpenSSL Comparisons:
echo echo ================================
echo for /l %%%%i in ^(1,1,4^) do ^(
echo     for /l %%%%j in ^(%%%%i+1,1,5^) do ^(
echo         echo Comparing OpenSSL stub %%%%i vs %%%%j...
echo         echo 4 ^> temp_comp.txt
echo         echo test_stubs\random_openssl_%%%%i_*.cs ^>^> temp_comp.txt
echo         echo test_stubs\random_openssl_%%%%j_*.cs ^>^> temp_comp.txt
echo         echo 0 ^>^> temp_comp.txt
echo         RawrZ_OpenSSL.exe ^< temp_comp.txt ^> test_results\openssl_vs_openssl_%%%%i_vs_%%%%j.log 2^>^&1
echo         timeout /t 1 /nobreak ^>nul
echo     ^)
echo ^)
echo echo.
echo echo Non-OpenSSL vs Non-OpenSSL Comparisons:
echo echo ========================================
echo for /l %%%%i in ^(1,1,4^) do ^(
echo     for /l %%%%j in ^(%%%%i+1,1,5^) do ^(
echo         echo Comparing Non-OpenSSL stub %%%%i vs %%%%j...
echo         echo 4 ^> temp_comp.txt
echo         echo test_stubs\random_non_openssl_%%%%i_*.cs ^>^> temp_comp.txt
echo         echo test_stubs\random_non_openssl_%%%%j_*.cs ^>^> temp_comp.txt
echo         echo 0 ^>^> temp_comp.txt
echo         RawrZ_OpenSSL.exe ^< temp_comp.txt ^> test_results\non_openssl_vs_non_openssl_%%%%i_vs_%%%%j.log 2^>^&1
echo         timeout /t 1 /nobreak ^>nul
echo     ^)
echo ^)
echo echo.
echo echo Cross-Comparison ^(OpenSSL vs Non-OpenSSL^):
echo echo ==========================================
echo for /l %%%%i in ^(1,1,5^) do ^(
echo     for /l %%%%j in ^(1,1,5^) do ^(
echo         echo Comparing OpenSSL stub %%%%i vs Non-OpenSSL stub %%%%j...
echo         echo 4 ^> temp_comp.txt
echo         echo test_stubs\random_openssl_%%%%i_*.cs ^>^> temp_comp.txt
echo         echo test_stubs\random_non_openssl_%%%%j_*.cs ^>^> temp_comp.txt
echo         echo 0 ^>^> temp_comp.txt
echo         RawrZ_OpenSSL.exe ^< temp_comp.txt ^> test_results\openssl_vs_non_openssl_%%%%i_vs_%%%%j.log 2^>^&1
echo         timeout /t 1 /nobreak ^>nul
echo     ^)
echo ^)
echo echo.
echo echo ========================================
echo echo    Testing Complete!
echo echo ========================================
echo echo Results saved in test_results\ directory
echo pause
) > run_comparisons.bat

echo [INFO] Comparison script created: run_comparisons.bat
echo.

REM Clean up temp files
if exist temp_input.txt del temp_input.txt
if exist temp_comp.txt del temp_comp.txt

echo ========================================
echo    Automated Testing Complete!
echo ========================================
echo.
echo Generated files:
echo - test_stubs\ - Contains all .cs stub files with random names
echo - test_executables\ - Contains compiled .exe files and original %exe_name%.exe
echo - test_results\ - Contains all test logs
echo.
echo Next steps:
echo 1. Review the generated stubs in test_stubs\ directory
echo 2. Check compiled executables in test_executables\ directory
echo 3. Run: run_comparisons.bat
echo 4. Check results in test_results\ directory
echo 5. Upload results for analysis
echo.
echo Press any key to exit...
pause >nul
