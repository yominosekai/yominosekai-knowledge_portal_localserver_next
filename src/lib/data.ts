import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

// データディレクトリのパス（Zドライブを優先）
const Z_DRIVE_PATH = 'Z:\\knowledge_portal';
const DATA_DIR = path.join(process.cwd(), 'data');

// データディレクトリを確実に作成
async function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
}

// CSVファイルを読み込んでオブジェクト配列に変換
export async function readCSV(filePath: string): Promise<any[]> {
  try {
    // Zドライブを優先して読み込み
    let fullPath = path.join(Z_DRIVE_PATH, 'shared', filePath);
    
    if (!fs.existsSync(fullPath)) {
      // Zドライブにない場合はローカルデータディレクトリを使用
      await ensureDataDir();
      fullPath = path.join(DATA_DIR, filePath);
      
      if (!fs.existsSync(fullPath)) {
        return [];
      }
    }
    
    const content = await readFile(fullPath, 'utf-8');
    // 改行文字を正しく処理（\r\n, \n, \r すべてに対応）
    const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(line => line.trim() !== '');
    
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // 空行をスキップ
      
      // CSVの値を正しく分割（カンマ区切り、ダブルクォート対応）
      const values = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim()); // 最後の値を追加
      
      // ヘッダー数と値の数が一致しない場合はスキップ
      if (values.length !== headers.length) {
        console.warn(`Skipping malformed CSV line ${i + 1}: expected ${headers.length} columns, got ${values.length}`);
        continue;
      }
      
      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      data.push(row);
    }
    
    console.log(`[readCSV] Successfully parsed ${data.length} rows from ${filePath}`);
    return data;
  } catch (error) {
    console.error(`Error reading CSV file ${filePath}:`, error);
    return [];
  }
}

// オブジェクト配列をCSVファイルに書き込み
export async function writeCSV(filePath: string, data: any[]): Promise<void> {
  try {
    await ensureDataDir();
    const fullPath = path.join(DATA_DIR, filePath);
    
    if (data.length === 0) {
      await writeFile(fullPath, '', 'utf-8');
      return;
    }
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.map(h => `"${h}"`).join(','),
      ...data.map(row => 
        headers.map(header => `"${row[header] || ''}"`).join(',')
      )
    ].join('\n');
    
    await writeFile(fullPath, csvContent, 'utf-8');
  } catch (error) {
    console.error(`Error writing CSV file ${filePath}:`, error);
    throw error;
  }
}

// JSONファイルを読み込み
export async function readJSON(filePath: string): Promise<any> {
  try {
    await ensureDataDir();
    const fullPath = path.join(DATA_DIR, filePath);
    
    if (!fs.existsSync(fullPath)) {
      return null;
    }
    
    const content = await readFile(fullPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading JSON file ${filePath}:`, error);
    return null;
  }
}

// JSONファイルに書き込み
export async function writeJSON(filePath: string, data: any): Promise<void> {
  try {
    await ensureDataDir();
    const fullPath = path.join(DATA_DIR, filePath);
    
    await writeFile(fullPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error writing JSON file ${filePath}:`, error);
    throw error;
  }
}

// ユーザーデータの取得（Zドライブ優先、存在しない場合は新規作成）
export async function getUserData(userId: string) {
  try {
    console.log(`[getUserData] Getting user data for SID: ${userId}`);
    
    // Zドライブからユーザーデータを取得
    const zUsersPath = path.join(Z_DRIVE_PATH, 'shared', 'users.csv');
    console.log(`[getUserData] Z drive users path: ${zUsersPath}`);
    
    let users = [];
    let userFound = false;
    
    if (fs.existsSync(zUsersPath)) {
      console.log(`[getUserData] Found Z drive users file`);
      users = await readCSV('users.csv');
      const user = users.find(u => u.sid === userId);
      if (user) {
        console.log(`[getUserData] Found user on Z drive: ${user.username}`);
        userFound = true;
        return user;
      }
    }
    
    // Zドライブにユーザーがいない場合は新規作成
    if (!userFound) {
      console.log(`[getUserData] User not found on Z drive, creating new user`);
      const newUser = await createNewUser(userId);
      return newUser;
    }
    
    return null;
  } catch (error) {
    console.error(`[getUserData] Error getting user data:`, error);
    return null;
  }
}

// 新規ユーザー作成（元のPowerShellプログラムの動作に合わせる）
async function createNewUser(userId: string) {
  try {
    console.log(`[createNewUser] Creating new user for SID: ${userId}`);
    
    // ユーザー名を生成（SIDの最後の部分を使用）
    const sidParts = userId.split('-');
    const userNumber = sidParts[sidParts.length - 1];
    const username = `user_${userNumber}`;
    const displayName = `User ${userNumber}`;
    
    const newUser = {
      sid: userId,
      username: username,
      display_name: displayName,
      email: `${username}@company.com`,
      role: 'user',
      department: 'General',
      created_date: new Date().toISOString(),
      last_login: new Date().toISOString(),
      is_active: 'true'
    };
    
    // Zドライブにユーザーを追加
    await addUserToZDrive(newUser);
    
    // ローカルにもコピー（フォールバック用）
    await addUserToLocal(newUser);
    
    console.log(`[createNewUser] Created new user: ${username}`);
    return newUser;
  } catch (error) {
    console.error(`[createNewUser] Error creating new user:`, error);
    throw error;
  }
}

// Zドライブにユーザーを追加
async function addUserToZDrive(user: any) {
  try {
    const zUsersPath = path.join(Z_DRIVE_PATH, 'shared', 'users.csv');
    const zUsersDir = path.dirname(zUsersPath);
    
    // Zドライブのディレクトリを作成
    if (!fs.existsSync(zUsersDir)) {
      await mkdir(zUsersDir, { recursive: true });
    }
    
    let users = [];
    if (fs.existsSync(zUsersPath)) {
      const content = await readFile(zUsersPath, 'utf-8');
      const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(line => line.trim() !== '');
      
      if (lines.length > 1) {
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const values = [];
          let current = '';
          let inQuotes = false;
          
          for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              values.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          values.push(current.trim());
          
          if (values.length === headers.length) {
            const row: any = {};
            headers.forEach((header, index) => {
              row[header] = values[index] || '';
            });
            users.push(row);
          }
        }
      }
    }
    
    // 新規ユーザーを追加
    users.push(user);
    
    // CSV形式で保存
    const headers = Object.keys(user);
    const csvContent = [
      headers.map(h => `"${h}"`).join(','),
      ...users.map(row => 
        headers.map(header => `"${row[header] || ''}"`).join(',')
      )
    ].join('\n');
    
    await writeFile(zUsersPath, csvContent, 'utf-8');
    console.log(`[addUserToZDrive] Added user to Z drive: ${zUsersPath}`);
  } catch (error) {
    console.error(`[addUserToZDrive] Error adding user to Z drive:`, error);
    throw error;
  }
}

// ローカルにユーザーを追加（フォールバック用）
async function addUserToLocal(user: any) {
  try {
    const localUsersPath = path.join(DATA_DIR, 'users', 'users.csv');
    const localUsersDir = path.dirname(localUsersPath);
    
    if (!fs.existsSync(localUsersDir)) {
      await mkdir(localUsersDir, { recursive: true });
    }
    
    let users = [];
    if (fs.existsSync(localUsersPath)) {
      users = await readCSV('users/users.csv');
    }
    
    users.push(user);
    await writeCSV('users/users.csv', users);
    console.log(`[addUserToLocal] Added user to local: ${localUsersPath}`);
  } catch (error) {
    console.error(`[addUserToLocal] Error adding user to local:`, error);
    // ローカルエラーは無視（Zドライブが優先）
  }
}

// ユーザーデータの更新
export async function updateUserData(userId: string, data: any) {
  try {
    // Zドライブからユーザーデータを取得
    const zUsersPath = path.join(Z_DRIVE_PATH, 'shared', 'users.csv');
    let users = [];
    
    if (fs.existsSync(zUsersPath)) {
      users = await readCSV('users.csv');
    } else {
      // Zドライブにない場合はローカルから取得
      users = await readCSV('users/users.csv');
    }
    
    const userIndex = users.findIndex(user => user.sid === userId);
    
    if (userIndex >= 0) {
      users[userIndex] = { ...users[userIndex], ...data };
      
      // Zドライブに保存
      if (fs.existsSync(path.dirname(zUsersPath))) {
        await writeCSV('users.csv', users);
      }
      
      // ローカルにも保存（フォールバック用）
      await writeCSV('users/users.csv', users);
      
      return { success: true, user: users[userIndex] };
    } else {
      // ユーザーが見つからない場合は新規作成
      const newUser = await createNewUser(userId);
      return { success: true, user: newUser };
    }
  } catch (error) {
    console.error(`[updateUserData] Error updating user data:`, error);
    return { success: false, error: error.message };
  }
}

// ユーザー活動データの取得
export async function getUserActivities(userId: string) {
  const activitiesPath = `users/${userId}/activities.json`;
  const activities = await readJSON(activitiesPath);
  
  if (!activities) {
    return { success: true, activities: [] };
  }
  
  return { success: true, activities: activities.activities || [] };
}

// ユーザー活動データの更新
export async function updateUserActivities(userId: string, activityData: any) {
  const activitiesPath = `users/${userId}/activities.json`;
  const userDir = path.join(DATA_DIR, 'users', userId);
  
  // ユーザーディレクトリを作成
  if (!fs.existsSync(userDir)) {
    await mkdir(userDir, { recursive: true });
  }
  
  let activities = await readJSON(activitiesPath);
  
  if (!activities) {
    activities = {
      user_sid: userId,
      username: '',
      display_name: '',
      activities: [],
      last_updated: new Date().toISOString()
    };
  }
  
  // 新しい活動を追加
  const newActivity = {
    id: Date.now(),
    material_id: activityData.material_id,
    activity_type: activityData.activity_type || 'study',
    status: activityData.status,
    start_date: new Date().toISOString().split('T')[0],
    completion_date: activityData.status === 'completed' ? new Date().toISOString().split('T')[0] : '',
    score: activityData.score || 0,
    notes: activityData.notes || '',
    timestamp: new Date().toISOString()
  };
  
  activities.activities.push(newActivity);
  activities.last_updated = new Date().toISOString();
  
  await writeJSON(activitiesPath, activities);
  return { success: true, activity: newActivity };
}

// 全コンテンツの取得（Zドライブの実際のデータを使用）
export async function getAllContent() {
  return await readCSV('materials.csv');
}

// 全カテゴリの取得（Zドライブ優先、ローカルにコピー）
export async function getAllCategories() {
  try {
    console.log(`[getAllCategories] Getting categories from Z drive`);
    
    // Zドライブからカテゴリを取得
    const zCategoriesPath = path.join(Z_DRIVE_PATH, 'shared', 'categories', 'categories.csv');
    console.log(`[getAllCategories] Z drive categories path: ${zCategoriesPath}`);
    
    if (fs.existsSync(zCategoriesPath)) {
      console.log(`[getAllCategories] Found categories file on Z drive`);
      const categories = await parseCategoriesFromFile(zCategoriesPath);
      
      if (categories.length > 0) {
        // Zドライブから取得したカテゴリをローカルにコピー
        await syncCategoriesToLocal(categories);
        console.log(`[getAllCategories] Synced ${categories.length} categories to local`);
        return categories;
      }
    }
    
    // Zドライブにない場合はローカルから取得
    console.log(`[getAllCategories] Z drive categories not found, trying local`);
    const localCategoriesPath = path.join(DATA_DIR, 'categories', 'categories.csv');
    
    if (fs.existsSync(localCategoriesPath)) {
      console.log(`[getAllCategories] Found local categories file`);
      const categories = await parseCategoriesFromFile(localCategoriesPath);
      console.log(`[getAllCategories] Found ${categories.length} categories locally`);
      return categories;
    }
    
    console.log(`[getAllCategories] No categories file found anywhere`);
    return [];
  } catch (error) {
    console.error(`[getAllCategories] Error getting categories:`, error);
    return [];
  }
}

// カテゴリファイルを解析
async function parseCategoriesFromFile(filePath: string) {
  try {
    const content = await readFile(filePath, 'utf-8');
    console.log(`[parseCategoriesFromFile] Raw content: ${content.substring(0, 200)}...`);
    
    const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(line => line.trim() !== '');
    console.log(`[parseCategoriesFromFile] Lines count: ${lines.length}`);
    
    if (lines.length < 2) {
      console.log(`[parseCategoriesFromFile] Categories file is empty`);
      return [];
    }
    
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    console.log(`[parseCategoriesFromFile] Headers: ${headers.join(', ')}`);
    
    const categories = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // CSVの値を正しく分割（カンマ区切り、ダブルクォート対応）
      const values = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim()); // 最後の値を追加
      
      // ヘッダー数と値の数が一致しない場合はスキップ
      if (values.length !== headers.length) {
        console.warn(`Skipping malformed CSV line ${i + 1}: expected ${headers.length} columns, got ${values.length}`);
        continue;
      }
      
      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      categories.push(row);
      console.log(`[parseCategoriesFromFile] Category ${i}: ${JSON.stringify(row)}`);
    }
    
    console.log(`[parseCategoriesFromFile] Parsed ${categories.length} categories`);
    return categories;
  } catch (error) {
    console.error(`[parseCategoriesFromFile] Error parsing categories file:`, error);
    return [];
  }
}

// カテゴリをローカルに同期
async function syncCategoriesToLocal(categories: any[]) {
  try {
    const localCategoriesPath = path.join(DATA_DIR, 'categories', 'categories.csv');
    const localCategoriesDir = path.dirname(localCategoriesPath);
    
    // ローカルカテゴリディレクトリを作成
    if (!fs.existsSync(localCategoriesDir)) {
      await mkdir(localCategoriesDir, { recursive: true });
    }
    
    // CSV形式で保存
    if (categories.length > 0) {
      const headers = Object.keys(categories[0]);
      const csvContent = [
        headers.map(h => `"${h}"`).join(','),
        ...categories.map(row => 
          headers.map(header => `"${row[header] || ''}"`).join(',')
        )
      ].join('\n');
      
      await writeFile(localCategoriesPath, csvContent, 'utf-8');
      console.log(`[syncCategoriesToLocal] Synced ${categories.length} categories to local: ${localCategoriesPath}`);
    }
  } catch (error) {
    console.error(`[syncCategoriesToLocal] Error syncing categories to local:`, error);
    // ローカル同期エラーは無視（Zドライブが優先）
  }
}

// 全ユーザーの取得（Zドライブの実際のデータを使用）
export async function getAllUsers() {
  return await readCSV('users.csv');
}

// コンテンツの検索
export async function searchContent(query: string, category?: string, difficulty?: string, type?: string, limit: number = 50) {
  const materials = await getAllContent();
  
  let filtered = materials.filter(material => {
    const matchesQuery = !query || 
      material.title.toLowerCase().includes(query.toLowerCase()) ||
      material.description.toLowerCase().includes(query.toLowerCase());
    
    const matchesCategory = !category || material.category_id === category;
    const matchesDifficulty = !difficulty || material.difficulty === difficulty;
    const matchesType = !type || material.type === type;
    
    return matchesQuery && matchesCategory && matchesDifficulty && matchesType;
  });
  
  return filtered.slice(0, limit);
}

// コンテンツの作成
export async function createContent(data: any) {
  const materials = await getAllContent();
  const newId = (Math.max(...materials.map(m => parseInt(m.id) || 0)) + 1).toString();
  
  const newMaterial = {
    id: newId,
    title: data.title,
    description: data.description,
    category_id: data.category_id,
    type: data.type,
    file_path: data.file_path || '',
    difficulty: data.difficulty,
    estimated_hours: data.estimated_hours || 1,
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString()
  };
  
  materials.push(newMaterial);
  await writeCSV('materials/materials.csv', materials);
  
  return { success: true, material: newMaterial };
}

// コンテンツの更新
export async function updateContent(contentId: string, data: any) {
  const materials = await getAllContent();
  const materialIndex = materials.findIndex(m => m.id === contentId);
  
  if (materialIndex >= 0) {
    materials[materialIndex] = { 
      ...materials[materialIndex], 
      ...data, 
      updated_date: new Date().toISOString() 
    };
    await writeCSV('materials/materials.csv', materials);
    return { success: true, material: materials[materialIndex] };
  }
  
  return { success: false, error: 'Content not found' };
}

// コンテンツの削除
export async function deleteContent(contentId: string) {
  const materials = await getAllContent();
  const filteredMaterials = materials.filter(m => m.id !== contentId);
  
  if (filteredMaterials.length < materials.length) {
    await writeCSV('materials/materials.csv', filteredMaterials);
    return { success: true };
  }
  
  return { success: false, error: 'Content not found' };
}

// コンテンツ詳細取得
export async function getContentById(contentId: string) {
  try {
    console.log(`[getContentById] Getting content for ID: ${contentId}`);
    
    // 基本情報をmaterials.csvから取得
    const materials = await readCSV('materials.csv');
    console.log(`[getContentById] Found ${materials.length} materials`);
    
    const material = materials.find(m => m.id === contentId);
    console.log(`[getContentById] Found material:`, material);
    
    if (!material) {
      console.log(`[getContentById] Material not found for ID: ${contentId}`);
      return null;
    }
    
    // 詳細情報をmetadata.jsonから取得
    const contentDir = `content_${contentId.padStart(3, '0')}`;
    const metadataPath = path.join(Z_DRIVE_PATH, 'shared', contentDir, 'metadata.json');
    console.log(`[getContentById] Metadata path: ${metadataPath}`);
    console.log(`[getContentById] Metadata exists: ${fs.existsSync(metadataPath)}`);
    
    let content = '';
    let attachments: any[] = [];
    let tags: string[] = [];
    let author_name = '';
    let author_sid = '';
    
    if (fs.existsSync(metadataPath)) {
      try {
        const metadataContent = await readFile(metadataPath, 'utf-8');
        console.log(`[getContentById] Raw metadata content: ${metadataContent.substring(0, 200)}...`);
        
        // BOMや不正な文字を除去
        const cleanContent = metadataContent.replace(/^\uFEFF/, '').trim();
        console.log(`[getContentById] Clean metadata content: ${cleanContent.substring(0, 200)}...`);
        
        const metadata = JSON.parse(cleanContent);
        console.log(`[getContentById] Metadata content:`, metadata);
        
        // 本文を取得
        if (metadata.content && metadata.content.trim() !== '') {
          content = metadata.content;
          console.log(`[getContentById] Found content in metadata: ${content.length} chars`);
        } else if (metadata.files && metadata.files.length > 0) {
          // メインコンテンツファイルを探す
          const mainContentFiles = ['index.md', 'content.md', 'main.md', 'readme.md'];
          let mainContentFile = null;
          
          // メインコンテンツファイルを探す
          for (const file of metadata.files) {
            const fileName = file.safe_name.toLowerCase();
            if (mainContentFiles.includes(fileName)) {
              mainContentFile = file;
              break;
            }
          }
          
          // .mdファイルを探す
          if (!mainContentFile) {
            for (const file of metadata.files) {
              if (file.safe_name.toLowerCase().endsWith('.md')) {
                mainContentFile = file;
                break;
              }
            }
          }
          
          if (mainContentFile) {
            const filePath = path.join(Z_DRIVE_PATH, mainContentFile.path);
            console.log(`[getContentById] Reading main content from: ${filePath}`);
            
            if (fs.existsSync(filePath)) {
              try {
                content = await readFile(filePath, 'utf-8');
                console.log(`[getContentById] Main content length: ${content.length} chars`);
              } catch (error) {
                console.error(`[getContentById] Error reading main content file:`, error);
                content = 'Error reading content file';
              }
            } else {
              console.log(`[getContentById] Main content file not found: ${filePath}`);
              content = 'No main content found';
            }
          } else {
            console.log(`[getContentById] No main content file found in metadata`);
            content = 'No main content file found';
          }
        }
        
        // 添付ファイル情報を取得
        if (metadata.files && metadata.files.length > 0) {
          attachments = metadata.files.map((file: any) => ({
            name: file.safe_name,
            original_name: file.original_name,
            size: file.size,
            path: file.path
          }));
          console.log(`[getContentById] Found ${attachments.length} attachments:`, attachments);
        } else {
          console.log(`[getContentById] No files in metadata:`, metadata.files);
        }
        
        // タグを取得
        if (metadata.tags) {
          if (typeof metadata.tags === 'string') {
            tags = metadata.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag);
          } else if (Array.isArray(metadata.tags)) {
            tags = metadata.tags;
          }
          console.log(`[getContentById] Found tags: ${JSON.stringify(tags)}`);
        }
        
        author_name = metadata.author_name || '';
        author_sid = metadata.author_sid || '';
        
      } catch (error) {
        console.error(`Error reading metadata for content ${contentId}:`, error);
      }
    }
    
    // カテゴリ情報を取得
    const categories = await getAllCategories();
    const category = categories.find(cat => cat.id === material.category_id);
    
    // 基本情報と詳細情報をマージ
    const enrichedContent = {
      ...material,
      content: content,
      tags: tags,
      attachments: attachments,
      files: attachments, // フロントエンドで使用するためにfilesも追加
      author_name: author_name,
      author_sid: author_sid,
      category: category ? category.name : 'Unknown Category'
    };
    
    console.log(`[getContentById] Enriched content:`, enrichedContent);
    console.log(`[getContentById] Final attachments:`, enrichedContent.attachments);
    console.log(`[getContentById] Final files:`, enrichedContent.files);
    return enrichedContent;
  } catch (error) {
    console.error(`Error getting content ${contentId}:`, error);
    return null;
  }
}

// 部署管理（サーバー上で管理、元のPowerShellプログラムの動作に合わせる）
export async function getAllDepartments() {
  try {
    console.log(`[getAllDepartments] Getting departments from server`);
    
    // サーバー上の部署ファイルを確認
    const departmentsPath = path.join(DATA_DIR, 'departments', 'departments.csv');
    console.log(`[getAllDepartments] Departments path: ${departmentsPath}`);
    
    // 部署ディレクトリを作成
    const departmentsDir = path.dirname(departmentsPath);
    if (!fs.existsSync(departmentsDir)) {
      await mkdir(departmentsDir, { recursive: true });
    }
    
    // 部署ファイルが存在しない場合はデフォルト部署を作成
    if (!fs.existsSync(departmentsPath)) {
      console.log(`[getAllDepartments] Creating default departments`);
      const defaultDepartments = [
        {
          id: 1,
          name: 'General',
          description: '一般部署',
          created_date: new Date().toISOString(),
          is_active: 'true'
        },
        {
          id: 2,
          name: 'IT',
          description: 'IT部門',
          created_date: new Date().toISOString(),
          is_active: 'true'
        },
        {
          id: 3,
          name: 'HR',
          description: '人事部門',
          created_date: new Date().toISOString(),
          is_active: 'true'
        }
      ];
      
      await writeCSV('departments/departments.csv', defaultDepartments);
      console.log(`[getAllDepartments] Created ${defaultDepartments.length} default departments`);
      return defaultDepartments;
    }
    
    // 既存の部署データを読み込み
    const departments = await readCSV('departments/departments.csv');
    console.log(`[getAllDepartments] Found ${departments.length} departments`);
    return departments;
  } catch (error) {
    console.error(`[getAllDepartments] Error getting departments:`, error);
    return [];
  }
}

export async function getDepartment(departmentId: string) {
  const departments = await getAllDepartments();
  return departments.find(d => d.id === departmentId) || null;
}

export async function createDepartment(data: any) {
  try {
    const departments = await getAllDepartments();
    const newId = (Math.max(...departments.map(d => parseInt(d.id) || 0)) + 1).toString();
    
    const newDepartment = {
      id: newId,
      name: data.name,
      description: data.description || '',
      created_date: new Date().toISOString(),
      is_active: 'true'
    };
    
    departments.push(newDepartment);
    await writeCSV('departments/departments.csv', departments);
    
    console.log(`[createDepartment] Created department: ${newDepartment.name}`);
    return { success: true, department: newDepartment };
  } catch (error) {
    console.error(`[createDepartment] Error creating department:`, error);
    return { success: false, error: error.message };
  }
}

export async function updateDepartment(departmentId: string, data: any) {
  try {
    const departments = await getAllDepartments();
    const departmentIndex = departments.findIndex(d => d.id === departmentId);
    
    if (departmentIndex >= 0) {
      departments[departmentIndex] = { 
        ...departments[departmentIndex], 
        ...data
      };
      await writeCSV('departments/departments.csv', departments);
      
      console.log(`[updateDepartment] Updated department: ${departments[departmentIndex].name}`);
      return { success: true, department: departments[departmentIndex] };
    }
    
    return { success: false, error: 'Department not found' };
  } catch (error) {
    console.error(`[updateDepartment] Error updating department:`, error);
    return { success: false, error: error.message };
  }
}

export async function deleteDepartment(departmentId: string) {
  try {
    const departments = await getAllDepartments();
    const department = departments.find(d => d.id === departmentId);
    
    if (!department) {
      return { success: false, error: 'Department not found' };
    }
    
    // 部署を使用しているユーザーがいないかチェック
    const users = await readCSV('users.csv');
    const usersInDept = users.filter(u => u.department === department.name);
    
    if (usersInDept.length > 0) {
      return { 
        success: false, 
        error: `Cannot delete department: ${usersInDept.length} users are assigned to this department` 
      };
    }
    
    const filteredDepartments = departments.filter(d => d.id !== departmentId);
    await writeCSV('departments/departments.csv', filteredDepartments);
    
    console.log(`[deleteDepartment] Deleted department: ${department.name}`);
    return { success: true };
  } catch (error) {
    console.error(`[deleteDepartment] Error deleting department:`, error);
    return { success: false, error: error.message };
  }
}

// いいね機能
export async function likeContent(contentId: string, userId: string) {
  const likesPath = 'shared/likes.json';
  let likes = await readJSON(likesPath);
  
  if (!likes) {
    likes = {};
  }
  
  if (!likes[contentId]) {
    likes[contentId] = [];
  }
  
  if (!likes[contentId].includes(userId)) {
    likes[contentId].push(userId);
    await writeJSON(likesPath, likes);
  }
  
  return { success: true, likes: likes[contentId] };
}

export async function unlikeContent(contentId: string, userId: string) {
  const likesPath = 'shared/likes.json';
  let likes = await readJSON(likesPath);
  
  if (!likes) {
    likes = {};
  }
  
  if (likes[contentId]) {
    likes[contentId] = likes[contentId].filter((id: string) => id !== userId);
    await writeJSON(likesPath, likes);
  }
  
  return { success: true, likes: likes[contentId] || [] };
}

// コンテンツ統計
export async function getContentStats(contentId: string) {
  const likesPath = 'shared/likes.json';
  const likes = await readJSON(likesPath);
  
  const likeCount = likes?.[contentId]?.length || 0;
  
  // 進捗統計を取得
  const users = await getAllUsers();
  let completedCount = 0;
  let inProgressCount = 0;
  
  for (const user of users) {
    const activities = await getUserActivities(user.sid);
    if (activities.success) {
      const userActivities = activities.activities.filter(a => a.material_id === contentId);
      if (userActivities.length > 0) {
        const latestActivity = userActivities[userActivities.length - 1];
        if (latestActivity.status === 'completed') {
          completedCount++;
        } else if (latestActivity.status === 'in_progress') {
          inProgressCount++;
        }
      }
    }
  }
  
  return {
    likeCount,
    completedCount,
    inProgressCount,
    totalUsers: users.length,
    completionRate: users.length > 0 ? Math.round((completedCount / users.length) * 100) : 0
  };
}

// ===== アサインメント機能 =====

// アサインメントの型定義
export interface Assignment {
  id: string;
  contentId: string;
  assignedTo: string;
  assignedBy: string;
  assignedDate: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  progress: number;
  notes?: string;
  priority: 'low' | 'medium' | 'high';
  created_date: string;
  updated_date: string;
}

// ユーザーのアサインメントディレクトリパスを取得
function getUserAssignmentsPath(userId: string, isZDrive: boolean = true): string {
  if (isZDrive) {
    return path.join(Z_DRIVE_PATH, 'users', userId, 'assignments');
  } else {
    return path.join(DATA_DIR, 'users', userId, 'assignments');
  }
}

// ユーザーのアサインメントファイルパスを取得
function getUserAssignmentsFilePath(userId: string, isZDrive: boolean = true): string {
  return path.join(getUserAssignmentsPath(userId, isZDrive), 'assignments.json');
}

// ユーザーのアサインメントを取得（Zドライブ優先、ローカルフォールバック）
export async function getUserAssignments(userId: string): Promise<Assignment[]> {
  try {
    console.log(`[getUserAssignments] Getting assignments for user: ${userId}`);
    
    // Zドライブから取得を試行
    const zAssignmentsPath = getUserAssignmentsFilePath(userId, true);
    console.log(`[getUserAssignments] Z drive assignments path: ${zAssignmentsPath}`);
    
    let assignments: Assignment[] = [];
    
    if (fs.existsSync(zAssignmentsPath)) {
      console.log(`[getUserAssignments] Found assignments file on Z drive`);
      const content = await readFile(zAssignmentsPath, 'utf-8');
      assignments = JSON.parse(content);
      console.log(`[getUserAssignments] Found ${assignments.length} assignments on Z drive`);
      
      // ローカルにもコピー（フォールバック用）
      await syncAssignmentsToLocal(userId, assignments);
    } else {
      // Zドライブにない場合はローカルから取得
      console.log(`[getUserAssignments] Z drive assignments not found, trying local`);
      const localAssignmentsPath = getUserAssignmentsFilePath(userId, false);
      
      if (fs.existsSync(localAssignmentsPath)) {
        console.log(`[getUserAssignments] Found local assignments file`);
        const content = await readFile(localAssignmentsPath, 'utf-8');
        assignments = JSON.parse(content);
        console.log(`[getUserAssignments] Found ${assignments.length} assignments locally`);
      } else {
        console.log(`[getUserAssignments] No assignments file found anywhere`);
        return [];
      }
    }
    
    // 期限切れチェックと自動更新
    const updatedAssignments = assignments.map(checkOverdueStatus);
    
    // 期限切れになったアサインメントがある場合は保存
    const overdueAssignments = updatedAssignments.filter((assignment, index) => 
      assignment.status === 'overdue' && assignments[index].status !== 'overdue'
    );
    
    if (overdueAssignments.length > 0) {
      console.log(`[getUserAssignments] Found ${overdueAssignments.length} overdue assignments for user ${userId}, updating...`);
      
      // 期限切れアサインメントを更新
      for (const assignment of overdueAssignments) {
        await updateAssignment(userId, assignment.id, { 
          status: 'overdue',
          updated_date: new Date().toISOString()
        });
      }
    }
    
    return updatedAssignments;
  } catch (error) {
    console.error(`[getUserAssignments] Error getting assignments:`, error);
    return [];
  }
}

// アサインメントをローカルに同期
async function syncAssignmentsToLocal(userId: string, assignments: Assignment[]): Promise<void> {
  try {
    const localAssignmentsPath = getUserAssignmentsFilePath(userId, false);
    const localAssignmentsDir = path.dirname(localAssignmentsPath);
    
    // ローカルディレクトリを作成
    if (!fs.existsSync(localAssignmentsDir)) {
      await mkdir(localAssignmentsDir, { recursive: true });
    }
    
    // ローカルに保存
    await writeFile(localAssignmentsPath, JSON.stringify(assignments, null, 2), 'utf-8');
    console.log(`[syncAssignmentsToLocal] Synced ${assignments.length} assignments to local`);
  } catch (error) {
    console.error(`[syncAssignmentsToLocal] Error syncing assignments:`, error);
  }
}

// アサインメントを作成
export async function createAssignment(assignment: Omit<Assignment, 'id' | 'created_date' | 'updated_date'>): Promise<{ success: boolean; assignment?: Assignment; error?: string }> {
  try {
    console.log(`[createAssignment] Creating assignment for user: ${assignment.assignedTo}`);
    
    // 新しいアサインメントIDを生成
    const assignmentId = `assignment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newAssignment: Assignment = {
      ...assignment,
      id: assignmentId,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString()
    };
    
    // 既存のアサインメントを取得
    const existingAssignments = await getUserAssignments(assignment.assignedTo);
    
    // 新しいアサインメントを追加
    const updatedAssignments = [...existingAssignments, newAssignment];
    
    // Zドライブに保存
    const zAssignmentsPath = getUserAssignmentsFilePath(assignment.assignedTo, true);
    const zAssignmentsDir = path.dirname(zAssignmentsPath);
    
    // Zドライブディレクトリを作成
    if (!fs.existsSync(zAssignmentsDir)) {
      await mkdir(zAssignmentsDir, { recursive: true });
    }
    
    await writeFile(zAssignmentsPath, JSON.stringify(updatedAssignments, null, 2), 'utf-8');
    console.log(`[createAssignment] Saved assignment to Z drive: ${zAssignmentsPath}`);
    
    // ローカルにも同期
    await syncAssignmentsToLocal(assignment.assignedTo, updatedAssignments);
    
    console.log(`[createAssignment] Created assignment: ${assignmentId}`);
    return { success: true, assignment: newAssignment };
  } catch (error) {
    console.error(`[createAssignment] Error creating assignment:`, error);
    return { success: false, error: error.message };
  }
}

// アサインメントを更新
export async function updateAssignment(userId: string, assignmentId: string, updates: Partial<Assignment>): Promise<{ success: boolean; assignment?: Assignment; error?: string }> {
  try {
    console.log(`[updateAssignment] Updating assignment: ${assignmentId} for user: ${userId}`);
    
    const assignments = await getUserAssignments(userId);
    const assignmentIndex = assignments.findIndex(a => a.id === assignmentId);
    
    if (assignmentIndex === -1) {
      return { success: false, error: 'Assignment not found' };
    }
    
    // アサインメントを更新
    const updatedAssignment = {
      ...assignments[assignmentIndex],
      ...updates,
      updated_date: new Date().toISOString()
    };
    
    assignments[assignmentIndex] = updatedAssignment;
    
    // Zドライブに保存
    const zAssignmentsPath = getUserAssignmentsFilePath(userId, true);
    await writeFile(zAssignmentsPath, JSON.stringify(assignments, null, 2), 'utf-8');
    
    // ローカルにも同期
    await syncAssignmentsToLocal(userId, assignments);
    
    console.log(`[updateAssignment] Updated assignment: ${assignmentId}`);
    return { success: true, assignment: updatedAssignment };
  } catch (error) {
    console.error(`[updateAssignment] Error updating assignment:`, error);
    return { success: false, error: error.message };
  }
}

// アサインメントを削除
export async function deleteAssignment(userId: string, assignmentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[deleteAssignment] Deleting assignment: ${assignmentId} for user: ${userId}`);
    
    const assignments = await getUserAssignments(userId);
    const filteredAssignments = assignments.filter(a => a.id !== assignmentId);
    
    if (assignments.length === filteredAssignments.length) {
      return { success: false, error: 'Assignment not found' };
    }
    
    // Zドライブに保存
    const zAssignmentsPath = getUserAssignmentsFilePath(userId, true);
    await writeFile(zAssignmentsPath, JSON.stringify(filteredAssignments, null, 2), 'utf-8');
    
    // ローカルにも同期
    await syncAssignmentsToLocal(userId, filteredAssignments);
    
    console.log(`[deleteAssignment] Deleted assignment: ${assignmentId}`);
    return { success: true };
  } catch (error) {
    console.error(`[deleteAssignment] Error deleting assignment:`, error);
    return { success: false, error: error.message };
  }
}

// 期限切れ判定ロジック
function checkOverdueStatus(assignment: Assignment): Assignment {
  const today = new Date();
  const dueDate = new Date(assignment.dueDate);
  
  // 期限切れかつ未完了の場合のみステータスを更新
  if (dueDate < today && assignment.status !== 'completed') {
    return {
      ...assignment,
      status: 'overdue',
      updated_date: new Date().toISOString()
    };
  }
  
  return assignment;
}

// 全ユーザーのアサインメントを取得（管理者用）
export async function getAllAssignments(): Promise<Assignment[]> {
  try {
    console.log(`[getAllAssignments] Getting all assignments`);
    
    const users = await getAllUsers();
    const allAssignments: Assignment[] = [];
    
    for (const user of users) {
      const userAssignments = await getUserAssignments(user.sid);
      allAssignments.push(...userAssignments);
    }
    
    // 期限切れチェックと自動更新
    const updatedAssignments = allAssignments.map(checkOverdueStatus);
    
    // 期限切れになったアサインメントがある場合は保存
    const overdueAssignments = updatedAssignments.filter((assignment, index) => 
      assignment.status === 'overdue' && allAssignments[index].status !== 'overdue'
    );
    
    if (overdueAssignments.length > 0) {
      console.log(`[getAllAssignments] Found ${overdueAssignments.length} overdue assignments, updating...`);
      
      // 各ユーザーの期限切れアサインメントを更新
      for (const assignment of overdueAssignments) {
        await updateAssignment(assignment.assignedTo, assignment.id, { 
          status: 'overdue',
          updated_date: new Date().toISOString()
        });
      }
    }
    
    console.log(`[getAllAssignments] Found ${updatedAssignments.length} total assignments`);
    return updatedAssignments;
  } catch (error) {
    console.error(`[getAllAssignments] Error getting all assignments:`, error);
    return [];
  }
}
