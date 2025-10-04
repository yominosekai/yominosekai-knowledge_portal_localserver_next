# Knowledge Portal サーバー再起動スクリプト
# キャッシュクリアとプロセス管理を自動化

Write-Host "🔄 Knowledge Portal サーバー再起動中..." -ForegroundColor Cyan

# ポート使用履歴ファイル
$portHistoryFile = "port_history.txt"

# 現在のポートを確認（4000-4099の範囲）
$currentPorts = 4000..4099
$nextPort = 4000

# 最後に使用したポートを読み取り
if (Test-Path $portHistoryFile) {
    try {
        $lastPort = [int](Get-Content $portHistoryFile -ErrorAction SilentlyContinue)
        if ($lastPort -ge 4000 -and $lastPort -le 4099) {
            $nextPort = $lastPort + 1
            Write-Host "📝 前回のポート: $lastPort → 次回ポート: $nextPort" -ForegroundColor Cyan
        }
    } catch {
        Write-Host "⚠️ ポート履歴の読み取りに失敗しました。4000から開始します。" -ForegroundColor Yellow
        $nextPort = 4000
    }
} else {
    Write-Host "📝 初回起動: ポート4000から開始します" -ForegroundColor Cyan
}

# 前回のポートをキル（履歴がある場合）
if (Test-Path $portHistoryFile) {
    try {
        $lastPort = [int](Get-Content $portHistoryFile -ErrorAction SilentlyContinue)
        if ($lastPort -ge 4000 -and $lastPort -le 4099) {
            Write-Host "🛑 前回のポート $lastPort をキル中..." -ForegroundColor Red
            $connections = Get-NetTCPConnection -LocalPort $lastPort -ErrorAction SilentlyContinue
            if ($connections) {
                # netstatコマンドでPIDを正確に取得（LISTENING状態のみ）
                $netstatOutput = netstat -ano | Select-String ":$lastPort.*LISTENING"
                if ($netstatOutput) {
                    $pids = $netstatOutput | ForEach-Object { 
                        $parts = $_ -split '\s+'
                        $parts[-1] 
                    } | Where-Object { $_ -match '^\d+$' -and $_ -ne '0' } | Sort-Object -Unique
                    
                    Write-Host "📍 ポート $lastPort でプロセス実行中 (PID: $($pids -join ', '))" -ForegroundColor Yellow
                    
                    foreach ($processId in $pids) {
                        if ($processId -gt 0) {
                            try {
                                Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                                Write-Host "🛑 PID $processId を終了しました" -ForegroundColor Red
                            } catch {
                                Write-Host "⚠️ PID $processId の終了に失敗しました" -ForegroundColor Yellow
                            }
                        }
                    }
                } else {
                    Write-Host "⚠️ ポート $lastPort のPIDを取得できませんでした" -ForegroundColor Yellow
                }
            } else {
                Write-Host "✅ ポート $lastPort は既に空いています" -ForegroundColor Green
            }
        }
    } catch {
        Write-Host "⚠️ 前回ポートのキルに失敗しました" -ForegroundColor Yellow
    }
}

# 指定されたポートから空いているポートを探す
$foundPort = $false
for ($port = $nextPort; $port -le 4099; $port++) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connections) {
        # netstatコマンドでPIDを正確に取得（LISTENING状態のみ）
        $netstatOutput = netstat -ano | Select-String ":$port.*LISTENING"
        if ($netstatOutput) {
            $pids = $netstatOutput | ForEach-Object { 
                $parts = $_ -split '\s+'
                $parts[-1] 
            } | Where-Object { $_ -match '^\d+$' -and $_ -ne '0' } | Sort-Object -Unique
            
            Write-Host "📍 ポート $port でプロセス実行中 (PID: $($pids -join ', '))" -ForegroundColor Yellow
            
            # 該当ポートのプロセスをキル
            foreach ($processId in $pids) {
                if ($processId -gt 0) {
                    try {
                        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                        Write-Host "🛑 PID $processId を終了しました" -ForegroundColor Red
                    } catch {
                        Write-Host "⚠️ PID $processId の終了に失敗しました" -ForegroundColor Yellow
                    }
                }
            }
        } else {
            Write-Host "⚠️ ポート $port のPIDを取得できませんでした" -ForegroundColor Yellow
        }
    } else {
        Write-Host "✅ ポート $port は空いています" -ForegroundColor Green
        $nextPort = $port
        $foundPort = $true
        break
    }
}

# ポートが見つからない場合
if (-not $foundPort) {
    Write-Host "❌ ポート4000-4099の範囲で空いているポートが見つかりません" -ForegroundColor Red
    Write-Host "🔄 ポート履歴をリセットして4000から再開します" -ForegroundColor Yellow
    $nextPort = 4000
    Remove-Item $portHistoryFile -ErrorAction SilentlyContinue
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

# 使用したポートを履歴に記録
Write-Host "📝 ポート $nextPort を履歴に記録中..." -ForegroundColor Cyan
$nextPort | Out-File -FilePath $portHistoryFile -Encoding UTF8 -Force

# サーバー起動
Write-Host "🚀 サーバーを起動中... (ポート: $nextPort)" -ForegroundColor Green
$env:PORT = $nextPort
Start-Process -FilePath "cmd" -ArgumentList "/c", "npm", "run", "dev", "--", "--port", $nextPort -NoNewWindow -PassThru

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
