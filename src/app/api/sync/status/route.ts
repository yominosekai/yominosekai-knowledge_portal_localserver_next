import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { CONFIG } from '../../../../config/drive';
import { getAllContent, getUserLastSyncTime, getContentComparison } from '../../../../lib/data';

export async function GET(request: Request) {
  try {
    // ユーザーIDを取得（セッションから）
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    // キャッシュ制御ヘッダーを設定（同期モーダル専用）
    const headers = new Headers();
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'ユーザーIDが必要です'
      }, { status: 400 });
    }
    
    // Zドライブの接続確認（Windows環境）
    const zDrivePath = CONFIG.DRIVE_PATH;
    const isConnected = fs.existsSync(zDrivePath);
    
    let lastSync = null;
    let syncedCount = 0;
    let localCount = 0; // ローカルコンテンツ数を初期化
    let serverOnlyCount = 0;
    let localOnlyCount = 0;
    let bothCount = 0;
    let totalSize = 0;
    let details = {
      idMismatch: { server: 0, local: 0, total: 0 },
      timestampMismatch: { server: 0, local: 0, total: 0 }
    };
    const errors: string[] = [];

           if (isConnected) {
             try {
               // ユーザー別sync.logから最終同期時刻を取得
               lastSync = await getUserLastSyncTime(userId);

               // getAllContent()を使用してdataSourceを考慮した正確な件数を取得
               try {
                 console.log('[SyncStatus] Calling getAllContent()...');
                 const allContent = await getAllContent();
                 console.log(`[SyncStatus] getAllContent() returned ${allContent.length} items`);
                 
                 serverOnlyCount = allContent.filter(content => content.dataSource === 'server').length;
                 localOnlyCount = allContent.filter(content => content.dataSource === 'local').length;
                 bothCount = allContent.filter(content => content.dataSource === 'both').length;
                 
                 // サーバーコンテンツ数 = サーバーのみ + 両方
                 syncedCount = serverOnlyCount + bothCount;
                 // ローカルコンテンツ数 = ローカルのみ + 両方
                 localCount = localOnlyCount + bothCount;
                 
                 console.log(`[SyncStatus] Content counts: ServerOnly=${serverOnlyCount}, LocalOnly=${localOnlyCount}, Both=${bothCount}`);
                 console.log(`[SyncStatus] Final counts: syncedCount=${syncedCount}, localCount=${localCount}`);
                 
                 // 詳細な内訳情報を取得
                 try {
                   console.log('[SyncStatus] Getting detailed comparison...');
                   const comparisonResult = await getContentComparison();
                   if (comparisonResult.details) {
                     details = comparisonResult.details;
                     console.log(`[SyncStatus] Details from comparison: ID不一致(サーバー=${details.idMismatch.server}, ローカル=${details.idMismatch.local}), 更新日時不一致(サーバー=${details.timestampMismatch.server}, ローカル=${details.timestampMismatch.local})`);
                   }
                   
                   // getAllContent()の結果と一致させる
                   console.log(`[SyncStatus] Overriding counts with getAllContent() results: ServerOnly=${serverOnlyCount}, LocalOnly=${localOnlyCount}, Both=${bothCount}`);
                   serverOnlyCount = allContent.filter(content => content.dataSource === 'server').length;
                   localOnlyCount = allContent.filter(content => content.dataSource === 'local').length;
                   bothCount = allContent.filter(content => content.dataSource === 'both').length;
                   
                   // サーバーコンテンツ数 = サーバーのみ + 両方
                   syncedCount = serverOnlyCount + bothCount;
                   // ローカルコンテンツ数 = ローカルのみ + 両方
                   localCount = localOnlyCount + bothCount;
                   
                   // getAllContent()の結果に基づいてdetailsを再計算
                   details = {
                     idMismatch: { 
                       server: serverOnlyCount, 
                       local: localOnlyCount, 
                       total: serverOnlyCount + localOnlyCount 
                     },
                     timestampMismatch: { 
                       server: 0, 
                       local: 0, 
                       total: 0 
                     }
                   };
                   
                   console.log(`[SyncStatus] Final corrected counts: syncedCount=${syncedCount}, localCount=${localCount}, serverOnlyCount=${serverOnlyCount}, localOnlyCount=${localOnlyCount}, bothCount=${bothCount}`);
                   console.log(`[SyncStatus] Final details: ID不一致(サーバー=${details.idMismatch.server}, ローカル=${details.idMismatch.local}), 更新日時不一致(サーバー=${details.timestampMismatch.server}, ローカル=${details.timestampMismatch.local})`);
                 } catch (detailError) {
                   console.error('[SyncStatus] Error getting details:', detailError);
                 }
               } catch (contentError) {
                 console.error('[SyncStatus] Error getting content:', contentError);
                 // フォールバック: ローカルのmaterials.csvから件数を取得
                 const localMaterialsPath = path.join(CONFIG.DATA_DIR, 'materials', 'materials.csv');
                 if (fs.existsSync(localMaterialsPath)) {
                   const csvContent = fs.readFileSync(localMaterialsPath, 'utf-8');
                   const lines = csvContent.split('\n').filter(line => line.trim());
                   localCount = Math.max(0, lines.length - 1); // ヘッダー行を除く
                 }
                 syncedCount = 0;
                 serverOnlyCount = 0;
                 localOnlyCount = localCount;
                 bothCount = 0;
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
        serverOnlyCount: serverOnlyCount,
        localOnlyCount: localOnlyCount,
        bothCount: bothCount,
        totalSize: Math.round(totalSize / 1024 / 1024 * 100) / 100, // MB
        details,
        errors
      }
    }, { headers });
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
          serverOnlyCount: 0,
          localOnlyCount: 0,
          bothCount: 0,
          totalSize: 0,
          details: {
            idMismatch: { server: 0, local: 0, total: 0 },
            timestampMismatch: { server: 0, local: 0, total: 0 }
          },
          errors: ['システムエラーが発生しました']
        }
      },
      { status: 500, headers }
    );
  }
}



