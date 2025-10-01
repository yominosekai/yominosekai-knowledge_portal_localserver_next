import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string || 'general';
    
    if (!file) {
      return NextResponse.json({ error: 'ファイルが選択されていません' }, { status: 400 });
    }

    // ファイルサイズチェック（10MB制限）
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'ファイルサイズが大きすぎます（最大10MB）' }, { status: 400 });
    }

    // ファイルタイプチェック
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/ogg',
      'application/pdf', 'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'サポートされていないファイル形式です' }, { status: 400 });
    }

    // ファイル名を安全にする
    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${safeFileName}`;
    
    // アップロードディレクトリを作成
    const uploadDir = join(process.cwd(), 'public', 'uploads', type);
    await mkdir(uploadDir, { recursive: true });

    // ファイルを保存
    const filePath = join(uploadDir, fileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // ファイル情報を返す
    const fileInfo = {
      originalName: file.name,
      fileName: fileName,
      filePath: `/uploads/${type}/${fileName}`,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString()
    };

    return NextResponse.json({ 
      success: true, 
      file: fileInfo 
    });

  } catch (error) {
    console.error('ファイルアップロードエラー:', error);
    return NextResponse.json(
      { error: 'ファイルアップロードに失敗しました' },
      { status: 500 }
    );
  }
}
