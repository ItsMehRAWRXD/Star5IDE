@echo off
setlocal

set NODE=node
where %NODE% >nul 2>nul
if errorlevel 1 (
  echo Node.js not found in PATH
  exit /b 1
)

set SCRIPT_DIR=%~dp0
set TOOL=%SCRIPT_DIR%camellia-cli.js
if not exist "%TOOL%" (
  echo CLI not found: %TOOL%
  exit /b 1
)

rem Usage: camellia-encrypt.bat input pass [out] [cipher] [hint]
set IN=%~1
set PASS=%~2
set OUT=%~3
set CIPHER=%~4
set HINT=%~5

if "%IN%"=="" (
  echo Usage: camellia-encrypt.bat input pass [out] [cipher] [hint]
  exit /b 1
)
if "%PASS%"=="" (
  echo Usage: camellia-encrypt.bat input pass [out] [cipher] [hint]
  exit /b 1
)

if "%OUT%"=="" set OUT=%IN%.pkg.b64
if "%CIPHER%"=="" set CIPHER=camellia-256-cbc

set CMD_ARGS=encrypt --pass "%PASS%" --cipher "%CIPHER%" --in "%IN%" --out "%OUT%"
if not "%HINT%"=="" set CMD_ARGS=%CMD_ARGS% --hint "%HINT%"

"%NODE%" "%TOOL%" %CMD_ARGS%
exit /b %ERRORLEVEL%

