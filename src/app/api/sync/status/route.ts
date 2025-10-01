import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Zドライブの接続確認（Windows環境）
    const zDrivePath = 'Z:\\knowledge_portal';
    const isConnected = fs.existsSync(zDrivePath);
    
    let lastSync = null;
    let syncedCount = 0;
    let totalSize = 0;
    const errors: string[] = [];

    if (isConnected) {
      try {
        // 同期ログファイルから最終同期時刻を取得
        const syncLogPath = path.join(zDrivePath, 'shared', 'logs', 'sync.log');
        if (fs.existsSync(syncLogPath)) {
          const logContent = fs.readFileSync(syncLogPath, 'utf-8');
          const lines = logContent.split('\n').filter(line => line.trim());
          if (lines.length > 0) {
            const lastLine = lines[lines.length - 1];
            const match = lastLine.match(/\[(.*?)\]/);
            if (match) {
              lastSync = match[1];
            }
          }
        }

        // 同期済みコンテンツ数をカウント
        const materialsPath = path.join(zDrivePath, 'shared', 'materials');
        if (fs.existsSync(materialsPath)) {
          const files = fs.readdirSync(materialsPath);
          syncedCount = files.length;
          
          // 総サイズを計算
          for (const file of files) {
            const filePath = path.join(materialsPath, file);
            const stats = fs.statSync(filePath);
            totalSize += stats.size;
          }
        }
      } catch (error) {
        errors.push(`Zドライブの読み込みエラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      errors.push('Zドライブに接続できません');
    }

    return NextResponse.json({
      success: true,
      status: {
        isConnected,
        lastSync,
        syncedCount,
        totalSize: Math.round(totalSize / 1024 / 1024 * 100) / 100, // MB
        errors
      }
    });
  } catch (error) {
    console.error('Sync status error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '同期ステータスの取得に失敗しました',
        status: {
          isConnected: false,
          lastSync: null,
          syncedCount: 0,
          totalSize: 0,
          errors: ['システムエラーが発生しました']
        }
      },
      { status: 500 }
    );
  }
}


