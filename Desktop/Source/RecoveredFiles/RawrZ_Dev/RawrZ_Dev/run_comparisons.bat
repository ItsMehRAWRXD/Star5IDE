@echo off
echo ========================================
echo    RawrZ Stub Comparison Results
echo ========================================
echo.
echo OpenSSL vs OpenSSL Comparisons:
echo ================================
for /l %%i in (1,1,4) do (
    for /l %%j in (%%i+1,1,5) do (
        echo Comparing OpenSSL stub %%i vs %%j...
        echo 4 > temp_comp.txt
        echo test_stubs\random_openssl_%%i_*.cs >> temp_comp.txt
        echo test_stubs\random_openssl_%%j_*.cs >> temp_comp.txt
        echo 0 >> temp_comp.txt
        RawrZ_OpenSSL.exe < temp_comp.txt > test_results\openssl_vs_openssl_%%i_vs_%%j.log 2>&1
        timeout /t 1 /nobreak >nul
    )
)
echo.
echo Non-OpenSSL vs Non-OpenSSL Comparisons:
echo ========================================
for /l %%i in (1,1,4) do (
    for /l %%j in (%%i+1,1,5) do (
        echo Comparing Non-OpenSSL stub %%i vs %%j...
        echo 4 > temp_comp.txt
        echo test_stubs\random_non_openssl_%%i_*.cs >> temp_comp.txt
        echo test_stubs\random_non_openssl_%%j_*.cs >> temp_comp.txt
        echo 0 >> temp_comp.txt
        RawrZ_OpenSSL.exe < temp_comp.txt > test_results\non_openssl_vs_non_openssl_%%i_vs_%%j.log 2>&1
        timeout /t 1 /nobreak >nul
    )
)
echo.
echo Cross-Comparison (OpenSSL vs Non-OpenSSL):
echo ==========================================
for /l %%i in (1,1,5) do (
    for /l %%j in (1,1,5) do (
        echo Comparing OpenSSL stub %%i vs Non-OpenSSL stub %%j...
        echo 4 > temp_comp.txt
        echo test_stubs\random_openssl_%%i_*.cs >> temp_comp.txt
        echo test_stubs\random_non_openssl_%%j_*.cs >> temp_comp.txt
        echo 0 >> temp_comp.txt
        RawrZ_OpenSSL.exe < temp_comp.txt > test_results\openssl_vs_non_openssl_%%i_vs_%%j.log 2>&1
        timeout /t 1 /nobreak >nul
    )
)
echo.
echo ========================================
echo    Testing Complete!
echo ========================================
echo Results saved in test_results\ directory
pause
