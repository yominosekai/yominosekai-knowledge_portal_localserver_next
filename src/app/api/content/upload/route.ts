import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // 基本情報を取得
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const type = formData.get('type') as string;
    const category_id = formData.get('category_id') as string;
    const difficulty = formData.get('difficulty') as string;
    const estimated_hours = parseFloat(formData.get('estimated_hours') as string) || 1;
    const tags = formData.get('tags') as string;
    const content = formData.get('content') as string;
    
    // バリデーション
    if (!title || !description || !type || !category_id || !difficulty) {
      return NextResponse.json(
        { success: false, message: '必須フィールドが不足しています' },
        { status: 400 }
      );
    }
    
    // 新しいコンテンツIDを生成
    const contentId = Date.now().toString();
    const directoryName = `content_${contentId}`;
    
    // ファイル保存用ディレクトリを作成
    const uploadDir = join(process.cwd(), 'data', 'materials', directoryName);
    await mkdir(uploadDir, { recursive: true });
    
    // アップロードされたファイルを処理
    const files = formData.getAll('files') as File[];
    const fileList: any[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 0) {
        // ファイル名を安全にする
        const safeFileName = `file_${String(i + 1).padStart(2, '0')}_${file.name}`;
        const filePath = join(uploadDir, safeFileName);
        
        // ファイルを保存
        const bytes = await file.arrayBuffer();
        await writeFile(filePath, Buffer.from(bytes));
        
        fileList.push({
          original_name: file.name,
          safe_name: safeFileName,
          size: file.size,
          path: `materials/${directoryName}/${safeFileName}`
        });
      }
    }
    
    // コンテンツファイルを作成（Markdown）
    if (content && content.trim()) {
      const contentPath = join(uploadDir, 'content.md');
      await writeFile(contentPath, content, 'utf-8');
    }
    
    // メタデータを作成
    const metadata = {
      id: contentId,
      title,
      description,
      type,
      category_id,
      difficulty,
      estimated_hours,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      attachments: fileList,
      content_path: content ? `materials/${directoryName}/content.md` : null,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
      created_by: 'system', // 実際の実装では認証されたユーザーIDを使用
      is_active: true
    };
    
    // メタデータファイルを保存
    const metadataPath = join(uploadDir, 'metadata.json');
    await writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
    
    // materials.csvに追加
    const materialsPath = join(process.cwd(), 'data', 'materials', 'materials.csv');
    const csvEntry = {
      id: contentId,
      title,
      description,
      type,
      category_id,
      difficulty,
      estimated_hours: estimated_hours.toString(),
      tags: tags,
      created_date: metadata.created_date,
      updated_date: metadata.updated_date,
      created_by: metadata.created_by,
      is_active: 'true'
    };
    
    // CSVファイルに追加（簡易実装）
    const csvLine = Object.values(csvEntry).map(value => `"${value}"`).join(',') + '\n';
    await writeFile(materialsPath, csvLine, { flag: 'a' });
    
    return NextResponse.json({
      success: true,
      message: 'コンテンツが正常にアップロードされました',
      content: metadata
    });
    
  } catch (error) {
    console.error('コンテンツアップロードエラー:', error);
    return NextResponse.json(
      { success: false, message: 'アップロードに失敗しました' },
      { status: 500 }
    );
  }
}



