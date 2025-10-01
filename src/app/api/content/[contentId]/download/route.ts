import { NextRequest, NextResponse } from 'next/server';
import { getContentById } from '../../../../../lib/data';
import fs from 'fs';
import path from 'path';

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
    
    if (filePath.startsWith('shared/content_')) {
      // Zドライブのファイルパスの場合
      fullPath = path.join('Z:\\knowledge_portal', filePath);
      console.log(`[Download] Z drive path: ${fullPath}`);
    } else {
      // ローカルファイルの場合
      fullPath = path.resolve(filePath);
      const contentDir = path.resolve(process.cwd(), 'data', 'materials');
      
      if (!fullPath.startsWith(contentDir)) {
        console.log(`[Download] Invalid local file path: ${fullPath}`);
        return NextResponse.json(
          { success: false, error: 'Invalid file path' },
          { status: 403 }
        );
      }
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
    
    console.log(`[Download] File found, proceeding with download`);

    // ファイルを読み込み
    const fileBuffer = fs.readFileSync(fullPath);
    const fileName = path.basename(fullPath);

    // レスポンスヘッダーを設定
    const headers = new Headers();
    headers.set('Content-Type', 'application/octet-stream');
    headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
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
