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
                     lastSync = match[1];
                   }
                 }
               }

               // Zドライブのmaterials.csvからコンテンツ数を取得
               const zDriveMaterialsPath = path.join(zDrivePath, 'shared', 'materials', 'materials.csv');
               if (fs.existsSync(zDriveMaterialsPath)) {
                 const csvContent = fs.readFileSync(zDriveMaterialsPath, 'utf16le');
                 const lines = csvContent.split('\n').filter(line => line.trim());
                 syncedCount = Math.max(0, lines.length - 1); // ヘッダー行を除く
               }

               // ローカルのmaterials.csvと比較して同期状況を判定
               const localMaterialsPath = path.join(process.cwd(), 'data', 'materials', 'materials.csv');
               if (fs.existsSync(localMaterialsPath)) {
                 const csvContent = fs.readFileSync(localMaterialsPath, 'utf16le');
                 const lines = csvContent.split('\n').filter(line => line.trim());
                 localCount = Math.max(0, lines.length - 1); // ヘッダー行を除く
               }

               // 同期済みコンテンツディレクトリの総サイズを計算
               const sharedPath = path.join(zDrivePath, 'shared');
               if (fs.existsSync(sharedPath)) {
                 const contentDirs = fs.readdirSync(sharedPath)
                   .filter(dir => dir.startsWith('content_'));
                 
                 for (const dir of contentDirs) {
                   const dirPath = path.join(sharedPath, dir);
                   if (fs.statSync(dirPath).isDirectory()) {
                     const files = fs.readdirSync(dirPath, { recursive: true });
                     for (const file of files) {
                       const filePath = path.join(dirPath, file);
                       if (fs.statSync(filePath).isFile()) {
                         totalSize += fs.statSync(filePath).size;
                       }
                     }
                   }
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



