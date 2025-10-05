import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { Z_DRIVE_PATH } from '@/config/drive';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string; filename: string }> }
) {
  try {
    const { contentId, filename } = await params;
    
    console.log(`[Content File API] Getting file: ${filename} for content: ${contentId}`);
    
    // Zドライブのsharedフォルダからファイルを取得
    const zDriveFilePath = join(Z_DRIVE_PATH, 'shared', 'materials', `content_${contentId}`, filename);
    
    if (!zDriveFilePath.includes(Z_DRIVE_PATH)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file path' },
        { status: 400 }
      );
    }
    
    try {
      const fileBuffer = await readFile(zDriveFilePath);
      const fileExtension = filename.toLowerCase().split('.').pop();
      
      // ファイルタイプに応じてContent-Typeを設定
      let contentType = 'application/octet-stream';
      switch (fileExtension) {
        case 'pdf':
          contentType = 'application/pdf';
          break;
        case 'txt':
          contentType = 'text/plain';
          break;
        case 'md':
          contentType = 'text/markdown';
          break;
        case 'jpg':
        case 'jpeg':
          contentType = 'image/jpeg';
          break;
        case 'png':
          contentType = 'image/png';
          break;
        case 'gif':
          contentType = 'image/gif';
          break;
        case 'mp4':
          contentType = 'video/mp4';
          break;
        case 'avi':
          contentType = 'video/x-msvideo';
          break;
        case 'mov':
          contentType = 'video/quicktime';
          break;
        case 'wmv':
          contentType = 'video/x-ms-wmv';
          break;
        case 'pptx':
          contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
          break;
        case 'docx':
          contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;
      }
      
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `inline; filename="${filename}"`,
          'Cache-Control': 'public, max-age=3600',
        },
      });
      
    } catch (fileError) {
      console.error(`[Content File API] Z drive file not found: ${zDriveFilePath}`);
      console.error(`[Content File API] File error:`, fileError);
      
      // ローカルフォールバック
      const localFilePath = join(process.cwd(), 'data', 'materials', `content_${contentId}`, filename);
      
      try {
        const localFileBuffer = await readFile(localFilePath);
        const fileExtension = filename.toLowerCase().split('.').pop();
        
        let contentType = 'application/octet-stream';
        switch (fileExtension) {
          case 'pdf':
            contentType = 'application/pdf';
            break;
          case 'txt':
            contentType = 'text/plain';
            break;
          case 'md':
            contentType = 'text/markdown';
            break;
          case 'jpg':
          case 'jpeg':
            contentType = 'image/jpeg';
            break;
          case 'png':
            contentType = 'image/png';
            break;
          case 'gif':
            contentType = 'image/gif';
            break;
          case 'mp4':
            contentType = 'video/mp4';
            break;
          case 'avi':
            contentType = 'video/x-msvideo';
            break;
          case 'mov':
            contentType = 'video/quicktime';
            break;
          case 'wmv':
            contentType = 'video/x-ms-wmv';
            break;
          case 'pptx':
            contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
            break;
          case 'docx':
            contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            break;
        }
        
        return new NextResponse(localFileBuffer, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': `inline; filename="${filename}"`,
            'Cache-Control': 'public, max-age=3600',
          },
        });
        
      } catch (localFileError) {
        console.error(`[Content File API] Local file not found: ${localFilePath}`);
        console.error(`[Content File API] Local file error:`, localFileError);
        
        return NextResponse.json(
          { success: false, error: 'File not found' },
          { status: 404 }
        );
      }
    }
    
  } catch (error) {
    console.error('[Content File API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
