import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { path: inputPath } = await request.json();
    
    if (!inputPath) {
      return NextResponse.json({ success: false, error: 'パスが指定されていません' }, { status: 400 });
    }

    // 相対パスの場合は絶対パスに変換
    const absolutePath = path.isAbsolute(inputPath) 
      ? inputPath 
      : path.resolve(process.cwd(), inputPath);

    // Windows環境でエクスプローラーを開く
    const command = `powershell -Command "Start-Process explorer '${absolutePath}'"`;
    
    try {
      await execAsync(command);
      return NextResponse.json({ 
        success: true, 
        message: 'ディレクトリを開きました',
        path: absolutePath
      });
    } catch (execError) {
      console.error('PowerShellコマンド実行エラー:', execError);
      
      // フォールバック: explorerコマンドを試行
      const fallbackCommand = `explorer "${absolutePath}"`;
      try {
        await execAsync(fallbackCommand);
        return NextResponse.json({ 
          success: true, 
          message: 'ディレクトリを開きました（フォールバック）',
          path: absolutePath
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
