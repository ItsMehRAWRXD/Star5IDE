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

rem Usage: camellia-decrypt.bat input pass [out] [cipher]
set IN=%~1
set PASS=%~2
set OUT=%~3
set CIPHER=%~4

if "%IN%"=="" (
  echo Usage: camellia-decrypt.bat input pass [out] [cipher]
  exit /b 1
)
if "%PASS%"=="" (
  echo Usage: camellia-decrypt.bat input pass [out] [cipher]
  exit /b 1
)

if "%OUT%"=="" set OUT=%IN%.bin

set CMD_ARGS=decrypt --pass "%PASS%" --in "%IN%" --out "%OUT%"
if not "%CIPHER%"=="" set CMD_ARGS=%CMD_ARGS% --cipher "%CIPHER%"

"%NODE%" "%TOOL%" %CMD_ARGS%
exit /b %ERRORLEVEL%

