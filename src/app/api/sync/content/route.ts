import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { CONFIG } from '../../../../config/drive';

export async function POST(request: NextRequest) {
  try {
    const { syncAll, selectedContent, forceSync, totalContent } = await request.json();
    
    const zDrivePath = CONFIG.DRIVE_PATH;
    const localDataPath = path.join(process.cwd(), 'data');
    
    // Zドライブの接続確認
    if (!fs.existsSync(zDrivePath)) {
      return NextResponse.json({
        success: false,
        message: 'Zドライブに接続できません',
        errors: ['Zドライブが見つかりません']
      });
    }

    const startTime = Date.now();
    let syncedCount = 0;
    let skippedCount = 0;

    try {
      if (forceSync) {
        // 強制同期（既存の処理）
        const result = await forceSyncAll(zDrivePath, localDataPath);
        syncedCount = result.syncedCount;
        skippedCount = 0;
      } else {
        // スマート同期（新しい処理）
        const result = await smartSyncWithProgress(zDrivePath, localDataPath, totalContent);
        syncedCount = result.syncedCount;
        skippedCount = result.skippedCount;
      }

      const duration = Date.now() - startTime;

      return NextResponse.json({
        success: true,
        message: `同期完了: ${syncedCount}件同期, ${skippedCount}件スキップ`,
        syncedCount,
        skippedCount,
        duration: `${duration}ms`,
        totalContent: totalContent || 0
      });

    } catch (error) {
      console.error('Content sync error:', error);
      return NextResponse.json({
        success: false,
        message: '同期中にエラーが発生しました',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    }
  } catch (error) {
    console.error('Sync content error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: '同期リクエストの処理に失敗しました',
        errors: ['システムエラーが発生しました']
      },
      { status: 500 }
    );
  }
}

// プログレス付きスマート同期
async function smartSyncWithProgress(
  zDrivePath: string, 
  localDataPath: string, 
  totalContent: number
) {
  const zDriveSharedPath = path.join(zDrivePath, 'shared');
  const localSharedPath = path.join(localDataPath, 'shared');
  
  // ローカルディレクトリの作成
  if (!fs.existsSync(localSharedPath)) {
    fs.mkdirSync(localSharedPath, { recursive: true });
  }

  let syncedCount = 0;
  let skippedCount = 0;

  // 1. materials.csvの同期
  console.log('[SmartSync] Syncing materials.csv...');
  const materialsResult = await syncMaterialsCSV(zDriveSharedPath, localSharedPath);
  syncedCount += materialsResult.syncedCount;
  skippedCount += materialsResult.skippedCount;

  // 2. categories.csvの同期
  console.log('[SmartSync] Syncing categories.csv...');
  const categoriesResult = await syncCategoriesCSV(zDriveSharedPath, localSharedPath);
  syncedCount += categoriesResult.syncedCount;
  skippedCount += categoriesResult.skippedCount;

  // 3. コンテンツディレクトリの同期
  console.log('[SmartSync] Scanning content directories...');
  const contentDirs = fs.readdirSync(zDriveSharedPath)
    .filter(dir => dir.startsWith('content_'))
    .sort();

  const totalDirs = contentDirs.length;
  console.log(`[SmartSync] Found ${totalDirs} content directories`);
  
  for (let i = 0; i < contentDirs.length; i++) {
    const contentDir = contentDirs[i];
    console.log(`[SmartSync] Processing ${i + 1}/${totalDirs}: ${contentDir}`);

    const result = await syncContentDirectory(
      contentDir, 
      zDriveSharedPath, 
      localSharedPath
    );
    
    syncedCount += result.syncedCount;
    skippedCount += result.skippedCount;
  }

  console.log(`[SmartSync] Completed: ${syncedCount} synced, ${skippedCount} skipped`);
  return { syncedCount, skippedCount };
}

// コンテンツディレクトリの同期
async function syncContentDirectory(
  contentDir: string, 
  sourceBase: string, 
  destBase: string
) {
  const sourcePath = path.join(sourceBase, contentDir);
  const destPath = path.join(destBase, contentDir);
  
  if (!fs.existsSync(sourcePath)) {
    return { syncedCount: 0, skippedCount: 0 };
  }

  let syncedCount = 0;
  let skippedCount = 0;

  // ディレクトリ全体の同期
  if (!fs.existsSync(destPath)) {
    console.log(`[SmartSync] New directory ${contentDir}`);
    fs.cpSync(sourcePath, destPath, { recursive: true });
    syncedCount++;
    return { syncedCount, skippedCount };
  }

  // ファイル単位での比較
  const sourceFiles = getAllFiles(sourcePath);
  
  for (const file of sourceFiles) {
    const sourceFile = path.join(sourcePath, file);
    const destFile = path.join(destPath, file);
    
    if (!fs.existsSync(destFile)) {
      // 新規ファイル
      fs.copyFileSync(sourceFile, destFile);
      syncedCount++;
    } else {
      // 既存ファイルのタイムスタンプ比較
      const sourceStats = fs.statSync(sourceFile);
      const destStats = fs.statSync(destFile);
      
      if (sourceStats.mtime > destStats.mtime) {
        fs.copyFileSync(sourceFile, destFile);
        syncedCount++;
      } else {
        skippedCount++;
      }
    }
  }

  return { syncedCount, skippedCount };
}

// ディレクトリ内の全ファイルを取得
function getAllFiles(dirPath: string): string[] {
  const files: string[] = [];
  
  function traverse(currentPath: string, relativePath: string = '') {
    const items = fs.readdirSync(currentPath);
    
    for (const item of items) {
      const itemPath = path.join(currentPath, item);
      const relativeItemPath = path.join(relativePath, item);
      
      if (fs.statSync(itemPath).isDirectory()) {
        traverse(itemPath, relativeItemPath);
      } else {
        files.push(relativeItemPath);
      }
    }
  }
  
  traverse(dirPath);
  return files;
}

// materials.csvの同期
async function syncMaterialsCSV(sourceBase: string, destBase: string) {
  const sourceFile = path.join(sourceBase, 'materials', 'materials.csv');
  const destFile = path.join(destBase, 'materials', 'materials.csv');
  
  if (!fs.existsSync(sourceFile)) {
    return { syncedCount: 0, skippedCount: 0 };
  }

  // ローカルディレクトリの作成
  const destDir = path.dirname(destFile);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  if (!fs.existsSync(destFile)) {
    fs.copyFileSync(sourceFile, destFile);
    console.log('[SmartSync] New download materials.csv');
    return { syncedCount: 1, skippedCount: 0 };
  }

  // タイムスタンプ比較
  const sourceStats = fs.statSync(sourceFile);
  const destStats = fs.statSync(destFile);
  
  if (sourceStats.mtime > destStats.mtime) {
    fs.copyFileSync(sourceFile, destFile);
    console.log('[SmartSync] Updated materials.csv (newer on server)');
    return { syncedCount: 1, skippedCount: 0 };
  } else {
    console.log('[SmartSync] Skipped materials.csv (up to date)');
    return { syncedCount: 0, skippedCount: 1 };
  }
}

// categories.csvの同期
async function syncCategoriesCSV(sourceBase: string, destBase: string) {
  const sourceFile = path.join(sourceBase, 'categories', 'categories.csv');
  const destFile = path.join(destBase, 'categories', 'categories.csv');
  
  if (!fs.existsSync(sourceFile)) {
    return { syncedCount: 0, skippedCount: 0 };
  }

  // ローカルディレクトリの作成
  const destDir = path.dirname(destFile);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  if (!fs.existsSync(destFile)) {
    fs.copyFileSync(sourceFile, destFile);
    console.log('[SmartSync] New download categories.csv');
    return { syncedCount: 1, skippedCount: 0 };
  }

  // タイムスタンプ比較
  const sourceStats = fs.statSync(sourceFile);
  const destStats = fs.statSync(destFile);
  
  if (sourceStats.mtime > destStats.mtime) {
    fs.copyFileSync(sourceFile, destFile);
    console.log('[SmartSync] Updated categories.csv (newer on server)');
    return { syncedCount: 1, skippedCount: 0 };
  } else {
    console.log('[SmartSync] Skipped categories.csv (up to date)');
    return { syncedCount: 0, skippedCount: 1 };
  }
}

// 強制同期（既存の処理）
async function forceSyncAll(zDrivePath: string, localDataPath: string) {
  const zDriveSharedPath = path.join(zDrivePath, 'shared');
  const localSharedPath = path.join(localDataPath, 'shared');
  
  // ローカルディレクトリの作成
  if (!fs.existsSync(localSharedPath)) {
    fs.mkdirSync(localSharedPath, { recursive: true });
  }

  let syncedCount = 0;

  // 強制的に全ファイルをコピー
  if (fs.existsSync(zDriveSharedPath)) {
    fs.cpSync(zDriveSharedPath, localSharedPath, { recursive: true, force: true });
    
    // 同期されたファイル数をカウント
    const allFiles = getAllFiles(localSharedPath);
    syncedCount = allFiles.length;
    
    console.log(`[ForceSync] Force synced ${syncedCount} files`);
  }

  return { syncedCount, skippedCount: 0 };
}



