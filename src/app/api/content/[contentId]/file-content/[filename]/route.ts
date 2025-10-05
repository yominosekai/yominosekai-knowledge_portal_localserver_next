import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { KNOWLEDGE_PORTAL_DRIVE_PATH } from '@/config/drive';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string; filename: string }> }
) {
  try {
    const { contentId, filename } = await params;
    
    // URLエンコードされたファイル名をデコード
    const decodedFilename = decodeURIComponent(filename);
    
    console.log(`[Content File Content API] Getting file content: ${decodedFilename} for content: ${contentId}`);
    
    // Zドライブのsharedフォルダからファイルを取得
    const zDriveFilePath = join(KNOWLEDGE_PORTAL_DRIVE_PATH, 'shared', 'materials', `content_${contentId}`, decodedFilename);
    
    if (!zDriveFilePath.includes(KNOWLEDGE_PORTAL_DRIVE_PATH)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file path' },
        { status: 400 }
      );
    }
    
    try {
      const fileContent = await readFile(zDriveFilePath, 'utf-8');
      const fileExtension = decodedFilename.toLowerCase().split('.').pop();
      
      return NextResponse.json({
        success: true,
        content: fileContent,
        filename: decodedFilename,
        type: fileExtension
      });
      
    } catch (fileError) {
      console.error(`[Content File Content API] Z drive file not found: ${zDriveFilePath}`);
      console.error(`[Content File Content API] File error:`, fileError);
      
      // ローカルフォールバック
      const localFilePath = join(process.cwd(), 'data', 'materials', `content_${contentId}`, decodedFilename);
      
      try {
        const localFileContent = await readFile(localFilePath, 'utf-8');
        const fileExtension = decodedFilename.toLowerCase().split('.').pop();
        
        return NextResponse.json({
          success: true,
          content: localFileContent,
          filename: decodedFilename,
          type: fileExtension
        });
        
      } catch (localFileError) {
        console.error(`[Content File Content API] Local file not found: ${localFilePath}`);
        console.error(`[Content File Content API] Local file error:`, localFileError);
        
        return NextResponse.json(
          { success: false, error: 'File not found' },
          { status: 404 }
        );
      }
    }
    
  } catch (error) {
    console.error('[Content File Content API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
