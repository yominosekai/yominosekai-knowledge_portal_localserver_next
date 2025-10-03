# Knowledge Portal サーバー再起動スクリプト
# キャッシュクリアとプロセス管理を自動化

Write-Host "🔄 Knowledge Portal サーバー再起動中..." -ForegroundColor Cyan

# 現在のポートを確認
$currentPorts = @(4000, 4001, 4002, 4003, 4004, 4005)
$nextPort = 4000

foreach ($port in $currentPorts) {
    $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($process) {
        Write-Host "📍 ポート $port でプロセス実行中 (PID: $($process.OwningProcess))" -ForegroundColor Yellow
        $nextPort = $port + 1
    } else {
        Write-Host "✅ ポート $port は空いています" -ForegroundColor Green
        $nextPort = $port
        break
    }
}

Write-Host "🚀 新しいポート: $nextPort" -ForegroundColor Magenta

# 既存のプロセスを終了
Write-Host "🛑 既存のNode.jsプロセスを終了中..." -ForegroundColor Red
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# キャッシュクリア
Write-Host "🧹 Next.jsキャッシュをクリア中..." -ForegroundColor Blue
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
    Write-Host "✅ .next フォルダを削除しました" -ForegroundColor Green
} else {
    Write-Host "ℹ️  .next フォルダは存在しません" -ForegroundColor Gray
}

# node_modules/.cache もクリア
if (Test-Path "node_modules/.cache") {
    Remove-Item -Recurse -Force "node_modules/.cache" -ErrorAction SilentlyContinue
    Write-Host "✅ node_modules/.cache を削除しました" -ForegroundColor Green
}

# サーバー起動
Write-Host "🚀 サーバーを起動中... (ポート: $nextPort)" -ForegroundColor Green
Start-Process -FilePath "npm" -ArgumentList "run", "dev", "--", "--port", $nextPort -NoNewWindow -PassThru

# 起動待機
Write-Host "⏳ サーバー起動を待機中..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# 起動確認
$maxWait = 30
$waited = 0
do {
    $connection = Get-NetTCPConnection -LocalPort $nextPort -ErrorAction SilentlyContinue
    if ($connection) {
        Write-Host "✅ サーバーが正常に起動しました！" -ForegroundColor Green
        Write-Host "🌐 URL: http://localhost:$nextPort" -ForegroundColor Cyan
        break
    }
    Start-Sleep -Seconds 1
    $waited++
    Write-Host "⏳ 起動待機中... ($waited/$maxWait 秒)" -ForegroundColor Yellow
} while ($waited -lt $maxWait)

if ($waited -ge $maxWait) {
    Write-Host "❌ サーバー起動に失敗しました" -ForegroundColor Red
    exit 1
}

# ブラウザ起動
Write-Host "🌐 ブラウザを起動中..." -ForegroundColor Magenta
Start-Process "http://localhost:$nextPort"

Write-Host "🎉 サーバー再起動完了！" -ForegroundColor Green
