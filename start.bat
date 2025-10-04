@echo off
echo ========================================
echo   Knowledge Portal - Portable Edition
echo ========================================
echo Starting server...

cd /d "%~dp0"

if not exist "portable-node\node.exe" (
    echo ERROR: portable-node\node.exe not found
    echo An error occurred. Please check the logs.
    pause
    exit /b 1
)

if not exist "server.js" (
    echo ERROR: server.js not found
    echo An error occurred. Please check the logs.
    pause
    exit /b 1
)

echo Node.js version:
.\portable-node\node.exe --version

echo.
echo Starting server...
.\portable-node\node.exe server.js

if %ERRORLEVEL% neq 0 (
    echo.
    echo An error occurred. Please check the logs.
    pause
    exit /b %ERRORLEVEL%
)