import { NextRequest, NextResponse } from 'next/server';
import { getContentById } from '../../../../../lib/data';
import fs from 'fs';
import path from 'path';
import { CONFIG } from '../../../../../config/drive';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  try {
    const { contentId } = await params;
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('file');

    if (!filePath) {
      return NextResponse.json(
        { success: false, error: 'File path is required' },
        { status: 400 }
      );
    }

    // コンテンツ情報を取得
    const content = await getContentById(contentId);
    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Content not found' },
        { status: 404 }
      );
    }
    
    // ファイルパスの検証（セキュリティ）
    let fullPath: string;
    
    console.log(`[Download] Processing file path: ${filePath}`);
    
    if (filePath.startsWith('materials/content_')) {
      // materials/content_XXX/file_XX_xxx.txt 形式の場合
      const localPath = path.join(process.cwd(), 'data', filePath);
      const zDrivePath = path.join(CONFIG.DRIVE_PATH, 'shared', filePath);
      
      // Zドライブを優先、フォールバックでローカル
      if (fs.existsSync(zDrivePath)) {
        fullPath = zDrivePath;
        console.log(`[Download] Using Z drive path: ${fullPath}`);
      } else if (fs.existsSync(localPath)) {
        fullPath = localPath;
        console.log(`[Download] Using local path: ${fullPath}`);
      } else {
        console.log(`[Download] File not found in both locations: ${filePath}`);
        return NextResponse.json(
          { success: false, error: 'File not found' },
          { status: 404 }
        );
      }
    } else {
      console.log(`[Download] Invalid file path format: ${filePath}`);
      return NextResponse.json(
        { success: false, error: 'Invalid file path' },
        { status: 403 }
      );
    }

    // ファイルの存在確認
    console.log(`[Download] Checking if file exists: ${fullPath}`);
    if (!fs.existsSync(fullPath)) {
      console.log(`[Download] File not found: ${fullPath}`);
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }
    
    console.log(`[Download] File found: ${fullPath}`);

    // ファイルを読み込み
    const fileBuffer = fs.readFileSync(fullPath);
    const fileName = path.basename(fullPath);
    
    // 日本語ファイル名を安全にエンコード
    const safeFileName = encodeURIComponent(fileName);

    // レスポンスヘッダーを設定
    const headers = new Headers();
    headers.set('Content-Type', 'application/octet-stream');
    headers.set('Content-Disposition', `attachment; filename*=UTF-8''${safeFileName}`);
    headers.set('Content-Length', fileBuffer.length.toString());

    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { success: false, error: 'Download failed' },
      { status: 500 }
    );
  }
}
