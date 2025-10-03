@echo off
echo ========================================
echo   Knowledge Portal - ポータブル版
echo ========================================
echo サーバーを起動中...

cd /d "%~dp0"

if not exist "portable-node\node.exe" (
    echo エラー: portable-node\node.exe が見つかりません
    echo エラーが発生しました。ログを確認してください。
    pause
    exit /b 1
)

if not exist "server.js" (
    echo エラー: server.js が見つかりません
    echo エラーが発生しました。ログを確認してください。
    pause
    exit /b 1
)

echo Node.js バージョン:
.\portable-node\node.exe --version

echo.
echo サーバーを起動中...
.\portable-node\node.exe server.js

if %ERRORLEVEL% neq 0 (
    echo.
    echo エラーが発生しました。ログを確認してください。
    pause
    exit /b %ERRORLEVEL%
)