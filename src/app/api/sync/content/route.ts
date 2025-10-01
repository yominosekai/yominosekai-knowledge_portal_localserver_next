import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { syncAll, selectedContent, forceSync } = await request.json();
    
    const zDrivePath = 'Z:\\knowledge_portal';
    const localDataPath = path.join(process.cwd(), 'data');
    
    // Zドライブの接続確認
    if (!fs.existsSync(zDrivePath)) {
      return NextResponse.json({
        success: false,
        message: 'Zドライブに接続できません',
        errors: ['Zドライブが見つかりません']
      });
    }

    const errors: string[] = [];
    let syncedCount = 0;

    try {
      // 同期対象のコンテンツを決定
      let contentToSync: string[] = [];
      
      if (syncAll) {
        // すべてのコンテンツを同期
        const materialsPath = path.join(localDataPath, 'materials');
        if (fs.existsSync(materialsPath)) {
          const files = fs.readdirSync(materialsPath);
          contentToSync = files.filter(file => file.endsWith('.csv'));
        }
      } else {
        // 選択されたコンテンツのみ同期
        contentToSync = selectedContent || [];
      }

      // 各コンテンツを同期
      for (const contentFile of contentToSync) {
        try {
          const localFilePath = path.join(localDataPath, 'materials', contentFile);
          const remoteFilePath = path.join(zDrivePath, 'shared', 'materials', contentFile);
          
          if (fs.existsSync(localFilePath)) {
            // ローカルからリモートにコピー
            fs.copyFileSync(localFilePath, remoteFilePath);
            syncedCount++;
          }
        } catch (error) {
          errors.push(`コンテンツ ${contentFile} の同期に失敗: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // 同期ログを更新
      const syncLogPath = path.join(zDrivePath, 'shared', 'logs', 'sync.log');
      const logDir = path.dirname(syncLogPath);
      
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      
      const logEntry = `[${new Date().toISOString()}] 同期完了: ${syncedCount}件のコンテンツを同期しました\n`;
      fs.appendFileSync(syncLogPath, logEntry);

      return NextResponse.json({
        success: true,
        message: `${syncedCount}件のコンテンツを同期しました`,
        syncedCount,
        errors: errors.length > 0 ? errors : undefined
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


