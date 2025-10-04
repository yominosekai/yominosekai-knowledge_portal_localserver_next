import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { CONFIG } from '../../../../config/drive';

export async function GET() {
  try {
    // Zドライブの接続確認（Windows環境）
    const zDrivePath = CONFIG.DRIVE_PATH;
    const isConnected = fs.existsSync(zDrivePath);
    
    let lastSync = null;
    let syncedCount = 0;
    let localCount = 0; // ローカルコンテンツ数を初期化
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
                     // UTC時刻を日本時間に変換
                     const utcTime = new Date(match[1]);
                     lastSync = utcTime.toLocaleString('ja-JP', {
                       timeZone: 'Asia/Tokyo',
                       year: 'numeric',
                       month: '2-digit',
                       day: '2-digit',
                       hour: '2-digit',
                       minute: '2-digit',
                       second: '2-digit'
                     });
                   }
                 }
               }

               // Zドライブのmaterials.csvからコンテンツ数を取得
               const zDriveMaterialsPath = path.join(zDrivePath, 'shared', 'materials', 'materials.csv');
               if (fs.existsSync(zDriveMaterialsPath)) {
                 const csvContent = fs.readFileSync(zDriveMaterialsPath, 'utf-8');
                 const lines = csvContent.split('\n').filter(line => line.trim());
                 syncedCount = Math.max(0, lines.length - 1); // ヘッダー行を除く
               }

               // ローカルのmaterials.csvと比較して同期状況を判定
               const localMaterialsPath = path.join(CONFIG.DATA_DIR, 'materials', 'materials.csv');
               if (fs.existsSync(localMaterialsPath)) {
                 const csvContent = fs.readFileSync(localMaterialsPath, 'utf-8');
                 const lines = csvContent.split('\n').filter(line => line.trim());
                 localCount = Math.max(0, lines.length - 1); // ヘッダー行を除く
               }

               // 同期済みコンテンツディレクトリの総サイズを計算
               const materialsPath = path.join(zDrivePath, 'shared', 'materials');
               console.log(`[SyncStatus] Calculating total size from: ${materialsPath}`);
               if (fs.existsSync(materialsPath)) {
                 const contentDirs = fs.readdirSync(materialsPath)
                   .filter(dir => dir.startsWith('content_'));
                 console.log(`[SyncStatus] Found ${contentDirs.length} content directories: ${contentDirs.join(', ')}`);
                 
                 for (const dir of contentDirs) {
                   const dirPath = path.join(materialsPath, dir);
                   if (fs.statSync(dirPath).isDirectory()) {
                     const files = fs.readdirSync(dirPath, { recursive: true });
                     console.log(`[SyncStatus] Directory ${dir} has ${files.length} files: ${files.join(', ')}`);
                     for (const file of files) {
                       const filePath = path.join(dirPath, file);
                       if (fs.statSync(filePath).isFile()) {
                         const fileSize = fs.statSync(filePath).size;
                         totalSize += fileSize;
                         console.log(`[SyncStatus] File ${file}: ${fileSize} bytes`);
                       }
                     }
                   }
                 }
                 console.log(`[SyncStatus] Total size calculated: ${totalSize} bytes`);
               } else {
                 console.log(`[SyncStatus] Materials path does not exist: ${materialsPath}`);
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
        localCount,
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
          localCount: 0,
          totalSize: 0,
          errors: ['システムエラーが発生しました']
        }
      },
      { status: 500 }
    );
  }
}



