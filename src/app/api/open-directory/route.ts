import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { path } = await request.json();
    
    if (!path) {
      return NextResponse.json({ success: false, error: 'パスが指定されていません' }, { status: 400 });
    }

    // Windows環境でエクスプローラーを開く
    const command = `powershell -Command "Start-Process explorer '${path}'"`;
    
    try {
      await execAsync(command);
      return NextResponse.json({ 
        success: true, 
        message: 'ディレクトリを開きました',
        path: path
      });
    } catch (execError) {
      console.error('PowerShellコマンド実行エラー:', execError);
      
      // フォールバック: explorerコマンドを試行
      const fallbackCommand = `explorer "${path}"`;
      try {
        await execAsync(fallbackCommand);
        return NextResponse.json({ 
          success: true, 
          message: 'ディレクトリを開きました（フォールバック）',
          path: path
        });
      } catch (fallbackError) {
        console.error('フォールバックコマンド実行エラー:', fallbackError);
        return NextResponse.json({ 
          success: false, 
          error: 'ディレクトリを開けませんでした',
          details: fallbackError instanceof Error ? fallbackError.message : 'Unknown error'
        }, { status: 500 });
      }
    }
  } catch (error) {
    console.error('Open directory error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'ディレクトリを開くリクエストの処理に失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
