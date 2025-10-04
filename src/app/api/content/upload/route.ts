import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { KNOWLEDGE_PORTAL_DRIVE_PATH, CONFIG } from '../../../../config/drive';
import { readCSV, writeCSV } from '../../../../lib/data';
import fs from 'fs';

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
    
    // ファイル保存用ディレクトリを作成（Zドライブとローカルの両方）
    const zDriveDir = join(KNOWLEDGE_PORTAL_DRIVE_PATH, 'shared', 'materials', directoryName);
    const localDir = join(CONFIG.DATA_DIR, 'materials', directoryName);
    
    // Zドライブにフォルダ作成
    if (fs.existsSync(KNOWLEDGE_PORTAL_DRIVE_PATH)) {
      await mkdir(zDriveDir, { recursive: true });
      console.log(`[content/upload] Created Z drive directory: ${zDriveDir}`);
    }
    
    // ローカルにもフォルダ作成
    await mkdir(localDir, { recursive: true });
    console.log(`[content/upload] Created local directory: ${localDir}`);
    
    // メインの作業ディレクトリを設定
    const uploadDir = fs.existsSync(KNOWLEDGE_PORTAL_DRIVE_PATH) ? zDriveDir : localDir;
    
    // アップロードされたファイルを処理（Zドライブとローカルの両方に保存）
    const files = formData.getAll('files') as File[];
    const fileList: any[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 0) {
        // ファイル名を安全にする
        const safeFileName = `file_${String(i + 1).padStart(2, '0')}_${file.name}`;
        
        // ファイルのバイトデータを一度だけ取得
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Zドライブに保存
        if (fs.existsSync(KNOWLEDGE_PORTAL_DRIVE_PATH)) {
          const zFilePath = join(zDriveDir, safeFileName);
          await writeFile(zFilePath, buffer);
          console.log(`[content/upload] Saved file to Z drive: ${zFilePath}`);
        }
        
        // ローカルにも保存
        const localFilePath = join(localDir, safeFileName);
        await writeFile(localFilePath, buffer);
        console.log(`[content/upload] Saved file to local: ${localFilePath}`);
        
        fileList.push({
          original_name: file.name,
          safe_name: safeFileName,
          size: file.size,
          path: `materials/${directoryName}/${safeFileName}`
        });
      }
    }
    
    // コンテンツファイルを作成（Markdown）- Zドライブとローカルの両方に作成
    if (content && content.trim()) {
      // Zドライブに作成
      if (fs.existsSync(KNOWLEDGE_PORTAL_DRIVE_PATH)) {
        const zContentPath = join(zDriveDir, 'content.md');
        await writeFile(zContentPath, content, 'utf-8');
        console.log(`[content/upload] Created Z drive content file: ${zContentPath}`);
      }
      
      // ローカルにも作成
      const localContentPath = join(localDir, 'content.md');
      await writeFile(localContentPath, content, 'utf-8');
      console.log(`[content/upload] Created local content file: ${localContentPath}`);
    }
    
    // ユーザー情報を取得
    const authHeader = request.headers.get('authorization');
    const userSid = request.headers.get('x-user-sid');
    
    let author_name = 'Unknown Author';
    let author_sid = '';
    let author_role = 'user';
    
    try {
      if (userSid) {
        // ユーザー情報を取得（簡易実装）
        author_name = 'User 1001'; // 実際の実装ではユーザー情報を取得
        author_sid = userSid;
        author_role = 'admin'; // 実際の実装ではユーザーロールを取得
        console.log(`[content/upload] User info: ${author_name} (${author_sid}, ${author_role})`);
      } else {
        console.log(`[content/upload] No user info provided, using defaults`);
      }
    } catch (error) {
      console.log(`[content/upload] Could not get user info, using default:`, error);
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
      files: fileList, // フロントエンドで使用するためにfilesも追加
      content_path: content ? `materials/${directoryName}/content.md` : null,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
      created_by: 'system',
      author_name: author_name,
      author_sid: author_sid,
      author_role: author_role,
      is_active: true
    };
    
    // メタデータファイルを保存 - Zドライブとローカルの両方に保存
    // Zドライブに保存
    if (fs.existsSync(KNOWLEDGE_PORTAL_DRIVE_PATH)) {
      const zMetadataPath = join(zDriveDir, 'metadata.json');
      await writeFile(zMetadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
      console.log(`[content/upload] Created Z drive metadata file: ${zMetadataPath}`);
    }
    
    // ローカルにも保存
    const localMetadataPath = join(localDir, 'metadata.json');
    await writeFile(localMetadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
    console.log(`[content/upload] Created local metadata file: ${localMetadataPath}`);
    
    // materials.csvに追加 - Zドライブとローカルの両方に追加
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
    
    // CSVファイルに追加（writeCSV関数を使用）
    let materials: any[] = [];
    try {
      materials = await readCSV('materials/materials.csv');
    } catch (error) {
      console.log(`[content/upload] CSV file not found or empty, creating new one`);
      // CSVファイルが存在しないか空の場合、デフォルトのヘッダーで作成
      materials = [];
    }
    
    materials.push(csvEntry);
    
    // Zドライブに保存
    if (fs.existsSync(KNOWLEDGE_PORTAL_DRIVE_PATH)) {
      const zMaterialsPath = join(KNOWLEDGE_PORTAL_DRIVE_PATH, 'shared', 'materials', 'materials.csv');
      await writeCSV(zMaterialsPath, materials);
      console.log(`[content/upload] Added to Z drive materials.csv: ${zMaterialsPath}`);
    }
    
    // ローカルにも保存
    const localMaterialsPath = join(CONFIG.DATA_DIR, 'materials', 'materials.csv');
    await writeCSV('materials/materials.csv', materials);
    console.log(`[content/upload] Added to local materials.csv: ${localMaterialsPath}`);
    
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



