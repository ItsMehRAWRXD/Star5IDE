@echo off
echo ========================================
echo RawrZ Calc Stub Compiler
echo ========================================
echo.

echo [INFO] Compiling calc.exe.stub.cs to executable...
echo.

REM Try to use dotnet if available
where dotnet >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Using .NET SDK to compile...
    
    REM Create a simple project file
    echo ^<Project Sdk="Microsoft.NET.Sdk"^> > temp_project.csproj
    echo   ^<PropertyGroup^> >> temp_project.csproj
    echo     ^<OutputType^>Exe^</OutputType^> >> temp_project.csproj
    echo     ^<TargetFramework^>net6.0^</TargetFramework^> >> temp_project.csproj
    echo     ^<ImplicitUsings^>disable^</ImplicitUsings^> >> temp_project.csproj
    echo   ^</PropertyGroup^> >> temp_project.csproj
    echo ^</Project^> >> temp_project.csproj
    
    REM Copy our stub to Program.cs
    copy calc.exe.stub.cs Program.cs >nul
    
    REM Build the project
    dotnet build -c Release -o . >nul 2>&1
    
    if exist "RawrZ_Dev.exe" (
        echo [SUCCESS] Compiled: calc_stub_openssl.exe
        ren RawrZ_Dev.exe calc_stub_openssl.exe
        echo [INFO] File size: 
        dir calc_stub_openssl.exe | find "calc_stub_openssl.exe"
        
        REM Clean up
        del temp_project.csproj >nul 2>&1
        del Program.cs >nul 2>&1
        rmdir bin >nul 2>&1
        rmdir obj >nul 2>&1
        
        echo.
        echo [SUCCESS] calc_stub_openssl.exe is ready for scanning!
    ) else (
        echo [FAILED] Compilation failed!
        echo [INFO] Check the source code for errors.
    )
) else (
    echo [ERROR] .NET SDK not found!
    echo Please install .NET SDK from: https://dotnet.microsoft.com/download
)

echo.
echo Press any key to exit...
pause >nul
