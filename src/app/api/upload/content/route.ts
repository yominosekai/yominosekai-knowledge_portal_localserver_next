import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const contentId = formData.get('contentId') as string;
    const fileType = formData.get('fileType') as string || 'attachment';
    
    if (!file) {
      return NextResponse.json({ error: 'ファイルが選択されていません' }, { status: 400 });
    }

    if (!contentId) {
      return NextResponse.json({ error: 'コンテンツIDが指定されていません' }, { status: 400 });
    }

    // ファイルサイズチェック（50MB制限）
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'ファイルサイズが大きすぎます（最大50MB）' }, { status: 400 });
    }

    // ファイルタイプチェック
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov',
      'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a',
      'application/pdf', 'text/plain', 'text/markdown', 'text/html',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/zip', 'application/x-rar-compressed',
      'application/json', 'application/xml'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'サポートされていないファイル形式です' }, { status: 400 });
    }

    // ファイル名を安全にする
    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${contentId}_${fileType}_${timestamp}_${safeFileName}`;
    
    // アップロードディレクトリを作成
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'content', contentId);
    await mkdir(uploadDir, { recursive: true });

    // ファイルを保存
    const filePath = join(uploadDir, fileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // ファイル情報を返す
    const fileInfo = {
      id: `${contentId}_${timestamp}`,
      contentId: contentId,
      originalName: file.name,
      fileName: fileName,
      filePath: `/uploads/content/${contentId}/${fileName}`,
      size: file.size,
      type: file.type,
      fileType: fileType,
      uploadedAt: new Date().toISOString()
    };

    return NextResponse.json({ 
      success: true, 
      file: fileInfo 
    });

  } catch (error) {
    console.error('コンテンツファイルアップロードエラー:', error);
    return NextResponse.json(
      { error: 'ファイルアップロードに失敗しました' },
      { status: 500 }
    );
  }
}


