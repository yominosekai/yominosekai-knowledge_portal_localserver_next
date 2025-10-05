import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { fileLockManager } from './fileLockManager';
import { v4 as uuidv4 } from 'uuid';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

// データディレクトリのパス（設定ファイルから取得）
import { CONFIG } from '../config/drive';
const Z_DRIVE_PATH = CONFIG.DRIVE_PATH;
const DATA_DIR = CONFIG.DATA_DIR;

// データソースの型定義
export type DataSource = 'server' | 'local' | 'both';

// データソースを判定する関数
export function getDataSource(filePath: string): DataSource {
  // file_pathが空の場合は、Zドライブから読み込まれたかどうかで判定
  if (!filePath || filePath.trim() === '') {
    // 現在の実装では、Zドライブから読み込まれた場合は'server'、ローカルから読み込まれた場合は'local'
    // 実際のファイルパスが空の場合は、Zドライブの存在で判定
    return fs.existsSync(Z_DRIVE_PATH) ? 'server' : 'local';
  }
  return filePath.includes(Z_DRIVE_PATH) ? 'server' : 'local';
}

// 通知データの型定義
export interface Notification {
  id: string;
  type: 'assignment' | 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
  assignedBy?: string;
  assignmentId?: string;
  userId?: string; // 通知の受信者ID
}

// データディレクトリを確実に作成
async function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
}

// CSVファイルを読み込んでオブジェクト配列に変換
export async function readCSV(filePath: string): Promise<any[]> {
  try {
    // Zドライブを優先して読み込み（materials.csvの場合はmaterials/サブディレクトリを確認）
    let fullPath: string;
    if (filePath === 'materials.csv') {
      fullPath = path.join(Z_DRIVE_PATH, 'shared', 'materials', filePath);
    } else {
      fullPath = path.join(Z_DRIVE_PATH, 'shared', filePath);
    }
    
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
    // ファイルパスがZドライブパスかどうかを判定
    const isZDrivePath = filePath.startsWith(Z_DRIVE_PATH);
    
    let fullPath: string;
    if (isZDrivePath) {
      // Zドライブパスの場合はそのまま使用
      fullPath = filePath;
    } else {
      // ローカルパスの場合はDATA_DIRと結合
      await ensureDataDir();
      fullPath = path.join(DATA_DIR, filePath);
    }
    
    // ディレクトリが存在しない場合は作成
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
    
    let headers: string[];
    let csvContent: string;
    
    if (data.length === 0) {
      // 空配列の場合はデフォルトヘッダーを作成
      headers = ['id', 'title', 'description', 'type', 'category_id', 'difficulty', 'estimated_hours', 'tags', 'created_date', 'updated_date', 'created_by', 'is_active'];
      csvContent = headers.map(h => `"${h}"`).join(',');
    } else {
      headers = Object.keys(data[0]);
      csvContent = [
        headers.map(h => `"${h}"`).join(','),
        ...data.map(row => 
          headers.map(header => `"${row[header] || ''}"`).join(',')
        )
      ].join('\n').trim(); // trim()で末尾の改行を削除
    }
    
    await writeFile(fullPath, csvContent, 'utf-8');
    console.log(`[writeCSV] Successfully wrote ${data.length} rows to ${fullPath}`);
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

// プロファイルをローカルに同期
async function syncProfileToLocal(userId: string, profile: any) {
  try {
    const localProfilePath = path.join(DATA_DIR, 'users', userId, 'profile.json');
    const localProfileDir = path.dirname(localProfilePath);
    
    if (!fs.existsSync(localProfileDir)) {
      await mkdir(localProfileDir, { recursive: true });
    }
    
    await writeFile(localProfilePath, JSON.stringify(profile, null, 2), 'utf-8');
    console.log(`[syncProfileToLocal] Synced profile to local: ${localProfilePath}`);
  } catch (error) {
    console.error(`[syncProfileToLocal] Error syncing profile to local:`, error);
    // ローカルエラーは無視（Zドライブが優先）
  }
}

// ユーザープロファイルを保存
async function saveUserProfile(userId: string, profile: any) {
  try {
    console.log(`[saveUserProfile] Saving profile for user: ${userId}`);
    
    // Zドライブに保存
    const zProfilePath = path.join(Z_DRIVE_PATH, 'users', userId, 'profile.json');
    const zProfileDir = path.dirname(zProfilePath);
    
    if (!fs.existsSync(zProfileDir)) {
      await mkdir(zProfileDir, { recursive: true });
    }
    
    await writeFile(zProfilePath, JSON.stringify(profile, null, 2), 'utf-8');
    console.log(`[saveUserProfile] Saved profile to Z drive: ${zProfilePath}`);
    
    // ローカルにも同期
    await syncProfileToLocal(userId, profile);
    
  } catch (error) {
    console.error(`[saveUserProfile] Error saving user profile:`, error);
    throw error;
  }
}

// ユーザープロファイルの取得（ユーザー別ファイル）
export async function getUserProfile(userId: string) {
  try {
    console.log(`[getUserProfile] Getting profile for user: ${userId}`);
    
    // Zドライブからプロファイルを取得
    const zProfilePath = path.join(Z_DRIVE_PATH, 'users', userId, 'profile.json');
    console.log(`[getUserProfile] Z drive profile path: ${zProfilePath}`);
    
    if (fs.existsSync(zProfilePath)) {
      console.log(`[getUserProfile] Found profile file on Z drive`);
      const content = await readFile(zProfilePath, 'utf-8');
      const profile = JSON.parse(content);
      
      // ローカルにも同期
      await syncProfileToLocal(userId, profile);
      
      return profile;
    }
    
    // ローカルからプロファイルを取得（フォールバック）
    const localProfilePath = path.join(DATA_DIR, 'users', userId, 'profile.json');
    if (fs.existsSync(localProfilePath)) {
      console.log(`[getUserProfile] Found profile file on local`);
      const content = await readFile(localProfilePath, 'utf-8');
      return JSON.parse(content);
    }
    
    console.log(`[getUserProfile] No profile file found for user: ${userId}`);
    return null;
  } catch (error) {
    console.error(`[getUserProfile] Error getting user profile:`, error);
    return null;
  }
}

// ユーザーデータの取得（ユーザー別プロファイルファイル優先）
export async function getUserData(userId: string) {
  try {
    console.log(`[getUserData] Getting user data for SID: ${userId}`);
    
    // ユーザー別プロファイルファイルから取得
    const userProfile = await getUserProfile(userId);
    if (userProfile) {
      console.log(`[getUserData] Found user profile: ${userProfile.username}`);
      return userProfile;
    }
    
    // プロファイルファイルにない場合は新規作成
    console.log(`[getUserData] User profile not found, creating new user`);
    const newUser = await createNewUser(userId);
    return newUser;
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
    
    // プロファイルファイルに保存
    await saveUserProfile(userId, newUser);
    
    console.log(`[createNewUser] Created new user: ${username}`);
    return newUser;
  } catch (error) {
    console.error(`[createNewUser] Error creating new user:`, error);
    throw error;
  }
}


// ユーザーデータの更新（プロファイルファイルを更新）
export async function updateUserData(userId: string, data: any) {
  try {
    console.log(`[updateUserData] Updating user data for: ${userId}`);
    
    // 既存のプロファイルを取得
    const existingProfile = await getUserProfile(userId);
    
    if (existingProfile) {
      // 既存のプロファイルを更新
      const updatedProfile = { ...existingProfile, ...data };
      await saveUserProfile(userId, updatedProfile);
      
      console.log(`[updateUserData] Updated user profile: ${userId}`);
      return { success: true, user: updatedProfile };
    } else {
      // プロファイルが見つからない場合は新規作成
      const newUser = await createNewUser(userId);
      if (newUser) {
        // 新規作成したユーザーにデータを適用
        const updatedProfile = { ...newUser, ...data };
        await saveUserProfile(userId, updatedProfile);
        
        console.log(`[updateUserData] Created and updated new user profile: ${userId}`);
        return { success: true, user: updatedProfile };
      } else {
        return { success: false, error: 'Failed to create new user' };
      }
    }
  } catch (error) {
    console.error(`[updateUserData] Error updating user data:`, error);
    return { success: false, error: error.message };
  }
}

// ユーザー活動データの取得（Zドライブ優先、ローカルフォールバック）
export async function getUserActivities(userId: string) {
  try {
    console.log(`[getUserActivities] Getting activities for user: ${userId}`);
    
    // Zドライブから取得を試行
    const zActivitiesPath = path.join(Z_DRIVE_PATH, 'users', userId, 'activities.json');
    console.log(`[getUserActivities] Z drive activities path: ${zActivitiesPath}`);
    
    let activities: any = null;
    
    if (fs.existsSync(zActivitiesPath)) {
      console.log(`[getUserActivities] Found activities file on Z drive`);
      try {
        const content = await readFile(zActivitiesPath, 'utf-8');
        if (content.trim()) {
          // BOMを除去してJSONパース
          const cleanContent = content.replace(/^\uFEFF/, '').trim();
          activities = JSON.parse(cleanContent);
          console.log(`[getUserActivities] Found ${activities.activities?.length || 0} activities on Z drive`);
          
          // ローカルにもコピー（フォールバック用）
          await syncActivitiesToLocal(userId, activities);
        } else {
          console.log(`[getUserActivities] Z drive file is empty, trying local fallback`);
          activities = null;
        }
      } catch (error) {
        console.error(`[getUserActivities] Error parsing Z drive JSON:`, error);
        console.log(`[getUserActivities] Trying local fallback`);
        activities = null;
      }
    } else {
      // Zドライブにない場合はローカルから取得
      console.log(`[getUserActivities] Z drive activities not found, trying local`);
      const localActivitiesPath = path.join(DATA_DIR, 'users', userId, 'activities.json');
      
      if (fs.existsSync(localActivitiesPath)) {
        console.log(`[getUserActivities] Found local activities file`);
        try {
          const content = await readFile(localActivitiesPath, 'utf-8');
          if (content.trim()) {
            activities = JSON.parse(content);
            console.log(`[getUserActivities] Found ${activities.activities?.length || 0} activities locally`);
          } else {
            console.log(`[getUserActivities] Local file is empty`);
            activities = null;
          }
        } catch (error) {
          console.error(`[getUserActivities] Error parsing local JSON:`, error);
          activities = null;
        }
      } else {
        console.log(`[getUserActivities] No activities file found anywhere`);
        return { success: true, activities: [] };
      }
    }
    
    if (!activities) {
      return { success: true, activities: [] };
    }
    
    return { success: true, activities: activities.activities || [] };
  } catch (error) {
    console.error(`[getUserActivities] Error getting activities:`, error);
    console.error(`[getUserActivities] Error details:`, error);
    return { success: true, activities: [] }; // エラーでも空配列を返す
  }
}

// アクティビティをローカルに同期
async function syncActivitiesToLocal(userId: string, activities: any): Promise<void> {
  try {
    const localActivitiesPath = path.join(DATA_DIR, 'users', userId, 'activities.json');
    const localUserDir = path.join(DATA_DIR, 'users', userId);
    
    if (!fs.existsSync(localUserDir)) {
      await fs.promises.mkdir(localUserDir, { recursive: true });
    }
    
    await writeFile(localActivitiesPath, JSON.stringify(activities, null, 2), 'utf-8');
    console.log(`[syncActivitiesToLocal] Synced activities to local: ${localActivitiesPath}`);
  } catch (error) {
    console.error(`[syncActivitiesToLocal] Error syncing activities to local:`, error);
  }
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

// 全コンテンツの取得（サーバーとローカルの差分を考慮）
export async function getAllContent() {
  try {
    console.log('[getAllContent] Getting all content with data source comparison');
    
    // CSV比較APIを呼び出して差分を取得
    const comparison = await getContentComparison();
    
    // ローカルのmetadata.jsonからもコンテンツを取得
    const localMetadataContent = await getLocalMetadataContent();
    
    // 全てのコンテンツを統合（重複を避ける）
    const allMaterials = [
      ...comparison.serverOnly,
      ...comparison.localOnly,
      ...comparison.both,
      ...localMetadataContent // ローカルのmetadata.jsonから取得したコンテンツを追加
    ];
    
    // 重複を除去（IDでユニークにする）
    const uniqueMaterials = allMaterials.reduce((acc: any[], current: any) => {
      const existingIndex = acc.findIndex(item => item.id === current.id);
      if (existingIndex === -1) {
        acc.push(current);
      } else {
        // 既存のアイテムを更新（より詳細な情報を優先、uuidも保持）
        if (current.content || current.attachments || current.files || current.uuid) {
          acc[existingIndex] = { 
            ...acc[existingIndex], 
            ...current,
            // uuidが存在する場合は優先的に使用
            uuid: current.uuid || acc[existingIndex].uuid,
            // dataSourceを明示的に保持（local > both > server の優先順位）
            dataSource: current.dataSource === 'local' ? 'local' : 
                       (current.dataSource === 'both' ? 'both' : acc[existingIndex].dataSource)
          };
        } else {
          // 詳細情報がない場合でもdataSourceは保持
          acc[existingIndex] = { 
            ...acc[existingIndex], 
            ...current,
            // dataSourceを明示的に保持（local > both > server の優先順位）
            dataSource: current.dataSource === 'local' ? 'local' : 
                       (current.dataSource === 'both' ? 'both' : acc[existingIndex].dataSource)
          };
        }
      }
      return acc;
    }, []);
    
    console.log(`[getAllContent] Total materials: ${allMaterials.length} (server: ${comparison.serverOnly.length}, local: ${comparison.localOnly.length}, both: ${comparison.both.length}, metadata: ${localMetadataContent.length})`);
    console.log(`[getAllContent] Unique materials after deduplication: ${uniqueMaterials.length}`);
    
    // デバッグ用：dataSourceの内訳を表示
    const serverOnlyCount = uniqueMaterials.filter(m => m.dataSource === 'server').length;
    const localOnlyCount = uniqueMaterials.filter(m => m.dataSource === 'local').length;
    const bothCount = uniqueMaterials.filter(m => m.dataSource === 'both').length;
    console.log(`[getAllContent] Final dataSource counts: ServerOnly=${serverOnlyCount}, LocalOnly=${localOnlyCount}, Both=${bothCount}`);
    
    // 各コンテンツのdataSourceを詳細表示
    uniqueMaterials.forEach(material => {
      console.log(`[getAllContent] Material ${material.id} (${material.title}): dataSource=${material.dataSource}`);
    });
    
    // ID順でソート（数値として比較）
    const sortedMaterials = uniqueMaterials.sort((a, b) => {
      const idA = parseInt(a.id) || 0;
      const idB = parseInt(b.id) || 0;
      return idA - idB;
    });
    
    console.log(`[getAllContent] Sorted materials by ID:`, sortedMaterials.map(m => `${m.id}: ${m.title}`));
    
    return sortedMaterials;
  } catch (error) {
    console.error('[getAllContent] Error getting content comparison, falling back to original method:', error);
    
    // フォールバック: 元の方法でZドライブ優先で読み込み
    const materials = await readCSV('materials.csv');
    const processedMaterials = materials.map(material => {
      let dataSource: DataSource;
      
      if (material.dataSource) {
        dataSource = material.dataSource as DataSource;
      } else if (material.file_path && material.file_path.includes(Z_DRIVE_PATH)) {
        dataSource = 'server';
      } else if (fs.existsSync(Z_DRIVE_PATH)) {
        dataSource = 'server';
      } else {
        dataSource = 'local';
      }
      
      return {
        ...material,
        dataSource
      };
    });
    
    // ID順でソート（数値として比較）
    return processedMaterials.sort((a, b) => {
      const idA = parseInt(a.id) || 0;
      const idB = parseInt(b.id) || 0;
      return idA - idB;
    });
  }
}

// コンテンツ比較を取得（materials.csvレベルでの比較）
export async function getContentComparison() {
  try {
    console.log('[getContentComparison] Starting materials.csv level comparison');
    
    // 内部でCSV比較ロジックを実行（API呼び出しを避ける）
    const zDrivePath = Z_DRIVE_PATH;
    const localDataPath = DATA_DIR;
    
    // Zドライブの接続確認
    const isZDriveConnected = fs.existsSync(zDrivePath);
    
    // サーバー（Zドライブ）のmaterials.csvを読み込み
    let serverMaterials: any[] = [];
    if (isZDriveConnected) {
      const serverMaterialsPath = path.join(zDrivePath, 'shared', 'materials', 'materials.csv');
      if (fs.existsSync(serverMaterialsPath)) {
        serverMaterials = await parseCSVFile(serverMaterialsPath);
        console.log(`[getContentComparison] Loaded ${serverMaterials.length} server materials`);
      }
    }
    
    // ローカルのmaterials.csvを読み込み
    let localMaterials: any[] = [];
    const localMaterialsPath = path.join(localDataPath, 'materials', 'materials.csv');
    if (fs.existsSync(localMaterialsPath)) {
      localMaterials = await parseCSVFile(localMaterialsPath);
      console.log(`[getContentComparison] Loaded ${localMaterials.length} local materials`);
    }
    
    // 差分を検出（materials.csvレベル）
    const result = compareMaterials(serverMaterials, localMaterials);
    console.log(`[getContentComparison] Comparison result: ServerOnly=${result.serverOnly.length}, LocalOnly=${result.localOnly.length}, Both=${result.both.length}`);
    
    return result;
  } catch (error) {
    console.error('[getContentComparison] Error:', error);
    throw error;
  }
}

// CSVファイルを解析（内部関数）
async function parseCSVFile(filePath: string): Promise<any[]> {
  try {
    const content = await readFile(filePath, 'utf-8');
    const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(line => line.trim() !== '');
    
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const data = [];
    
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
      values.push(current.trim());
      
      // ヘッダー数と値の数が一致しない場合はスキップ
      if (values.length !== headers.length) {
        console.warn(`[parseCSVFile] Skipping malformed CSV line ${i + 1}: expected ${headers.length} columns, got ${values.length}`);
        continue;
      }
      
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      data.push(row);
    }
    
    return data;
  } catch (error) {
    console.error(`[parseCSVFile] Error parsing CSV file ${filePath}:`, error);
    return [];
  }
}

// サーバーとローカルのmaterialsを比較（内部関数）
function compareMaterials(serverMaterials: any[], localMaterials: any[]) {
  const serverOnly: any[] = [];
  const localOnly: any[] = [];
  const both: any[] = [];
  
  // 詳細な内訳情報
  const idMismatchServer: any[] = [];
  const idMismatchLocal: any[] = [];
  const timestampMismatchServer: any[] = [];
  const timestampMismatchLocal: any[] = [];
  
  console.log(`[compareMaterials] Server materials: ${serverMaterials.length}, Local materials: ${localMaterials.length}`);
  
  // サーバーのmaterialsをチェック
  for (const serverMaterial of serverMaterials) {
    const localMaterial = localMaterials.find(local => local.id === serverMaterial.id);
    if (localMaterial) {
      // 両方に存在する場合、更新日時を比較
      const serverUpdated = new Date(serverMaterial.updated_date || serverMaterial.created_date);
      const localUpdated = new Date(localMaterial.updated_date || localMaterial.created_date);
      
      console.log(`[compareMaterials] Material ${serverMaterial.id}: Server=${serverUpdated.toISOString()}, Local=${localUpdated.toISOString()}`);
      
      if (serverUpdated.getTime() !== localUpdated.getTime()) {
        // 更新日時が異なる場合、タイムスタンプ不一致として記録
        if (serverUpdated.getTime() > localUpdated.getTime()) {
          timestampMismatchServer.push(serverMaterial);
        } else {
          timestampMismatchLocal.push(localMaterial);
        }
      }
      
      // 両方に存在する場合は「both」として分類
      console.log(`[compareMaterials] Material ${serverMaterial.id}: Same timestamp (both)`);
      both.push({
        ...serverMaterial,
        dataSource: 'both' as const
      });
    } else {
      // サーバーのみ
      console.log(`[compareMaterials] Material ${serverMaterial.id}: Server only`);
      serverOnly.push({
        ...serverMaterial,
        dataSource: 'server' as const
      });
      idMismatchServer.push(serverMaterial);
    }
  }
  
  // ローカルのmaterialsをチェック（サーバーにないもの）
  for (const localMaterial of localMaterials) {
    const serverMaterial = serverMaterials.find(server => server.id === localMaterial.id);
    if (!serverMaterial) {
      // ローカルのみ
      console.log(`[compareMaterials] Material ${localMaterial.id}: Local only`);
      localOnly.push({
        ...localMaterial,
        dataSource: 'local' as const
      });
      idMismatchLocal.push(localMaterial);
    }
  }
  
  console.log(`[compareMaterials] Result: ServerOnly=${serverOnly.length}, LocalOnly=${localOnly.length}, Both=${both.length}`);
  console.log(`[compareMaterials] Details: ID不一致(サーバー=${idMismatchServer.length}, ローカル=${idMismatchLocal.length}), 更新日時不一致(サーバー=${timestampMismatchServer.length}, ローカル=${timestampMismatchLocal.length})`);
  
  return {
    serverOnly,
    localOnly,
    both,
    details: {
      idMismatch: { 
        server: idMismatchServer.length, 
        local: idMismatchLocal.length, 
        total: idMismatchServer.length + idMismatchLocal.length 
      },
      timestampMismatch: { 
        server: timestampMismatchServer.length, 
        local: timestampMismatchLocal.length, 
        total: timestampMismatchServer.length + timestampMismatchLocal.length 
      }
    }
  };
}

// ローカルのmetadata.jsonからコンテンツを取得
async function getLocalMetadataContent(): Promise<any[]> {
  try {
    console.log('[getLocalMetadataContent] Scanning local metadata files');
    
    const localMaterialsDir = path.join(DATA_DIR, 'materials');
    const metadataContent: any[] = [];
    
    if (!fs.existsSync(localMaterialsDir)) {
      console.log('[getLocalMetadataContent] Local materials directory not found');
      return [];
    }
    
    // materialsディレクトリ内のcontent_*ディレクトリをスキャン
    const contentDirs = fs.readdirSync(localMaterialsDir)
      .filter(dir => dir.startsWith('content_'))
      .sort();
    
    console.log(`[getLocalMetadataContent] Found ${contentDirs.length} content directories`);
    
    for (const contentDir of contentDirs) {
      const metadataPath = path.join(localMaterialsDir, contentDir, 'metadata.json');
      
      if (fs.existsSync(metadataPath)) {
        try {
          const metadataContent_raw = await readFile(metadataPath, 'utf-8');
          const metadata = JSON.parse(metadataContent_raw);
          
          // Zドライブにも同じコンテンツが存在するかチェック
          const zDriveMetadataPath = path.join(Z_DRIVE_PATH, 'shared', 'materials', `content_${metadata.id}`, 'metadata.json');
          const existsOnZDrive = fs.existsSync(zDriveMetadataPath);
          
          // metadata.jsonからmaterials.csv形式に変換
          const material = {
            id: metadata.id,
            uuid: metadata.uuid, // metadata.jsonからuuidを読み込み
            title: metadata.title,
            description: metadata.description,
            category_id: metadata.category_id,
            type: metadata.type,
            file_path: metadata.content_path || '',
            difficulty: metadata.difficulty,
            estimated_hours: metadata.estimated_hours,
            created_date: metadata.created_date,
            updated_date: metadata.updated_date,
            dataSource: existsOnZDrive ? 'both' as const : 'local' as const // 実際の存在状況に基づいて設定
          };
          
          metadataContent.push(material);
          console.log(`[getLocalMetadataContent] Added material from metadata: ${metadata.title} (ID: ${metadata.id})`);
        } catch (error) {
          console.error(`[getLocalMetadataContent] Error reading metadata file ${metadataPath}:`, error);
        }
      }
    }
    
    console.log(`[getLocalMetadataContent] Found ${metadataContent.length} materials from metadata files`);
    return metadataContent;
  } catch (error) {
    console.error('[getLocalMetadataContent] Error:', error);
    return [];
  }
}

// ローカルのmetadata.jsonファイルが存在するかチェック
function isLocalMetadataExists(contentId: string): boolean {
  try {
    const localMetadataPath = path.join(DATA_DIR, 'materials', `content_${contentId}`, 'metadata.json');
    return fs.existsSync(localMetadataPath);
  } catch (error) {
    console.error(`[isLocalMetadataExists] Error checking metadata file for ${contentId}:`, error);
    return false;
  }
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

// ユーザーデータのマイグレーション（CSVからプロファイルファイルへ）
export async function migrateUsersToProfiles() {
  try {
    console.log(`[migrateUsersToProfiles] Starting migration from CSV to profile files`);
    
    // 既存のCSVファイルからユーザーを取得
    const csvUsers = await readCSV('users.csv');
    console.log(`[migrateUsersToProfiles] Found ${csvUsers.length} users in CSV`);
    
    let migratedCount = 0;
    
    for (const user of csvUsers) {
      try {
        // プロファイルファイルが既に存在するかチェック
        const existingProfile = await getUserProfile(user.sid);
        if (!existingProfile) {
          // プロファイルファイルに保存
          await saveUserProfile(user.sid, user);
          migratedCount++;
          console.log(`[migrateUsersToProfiles] Migrated user: ${user.username}`);
        } else {
          console.log(`[migrateUsersToProfiles] Profile already exists for user: ${user.username}`);
        }
      } catch (error) {
        console.error(`[migrateUsersToProfiles] Error migrating user ${user.username}:`, error);
      }
    }
    
    console.log(`[migrateUsersToProfiles] Migration completed. ${migratedCount} users migrated.`);
    return { success: true, migratedCount };
  } catch (error) {
    console.error(`[migrateUsersToProfiles] Error during migration:`, error);
    return { success: false, error: error.message };
  }
}

// 全ユーザーの取得（プロファイルファイルから）
export async function getAllUsers() {
  try {
    console.log(`[getAllUsers] Getting all users from profile files`);
    
    const users: any[] = [];
    
    // Zドライブのユーザーディレクトリをスキャン
    const zUsersDir = path.join(Z_DRIVE_PATH, 'users');
    if (fs.existsSync(zUsersDir)) {
      const userDirs = fs.readdirSync(zUsersDir);
      
      for (const userDir of userDirs) {
        const profilePath = path.join(zUsersDir, userDir, 'profile.json');
        if (fs.existsSync(profilePath)) {
          try {
            const content = await readFile(profilePath, 'utf-8');
            const profile = JSON.parse(content);
            users.push(profile);
          } catch (error) {
            console.error(`[getAllUsers] Error reading profile for ${userDir}:`, error);
          }
        }
      }
    }
    
    // ローカルからも取得（フォールバック）
    const localUsersDir = path.join(DATA_DIR, 'users');
    if (fs.existsSync(localUsersDir)) {
      const userDirs = fs.readdirSync(localUsersDir);
      
      for (const userDir of userDirs) {
        const profilePath = path.join(localUsersDir, userDir, 'profile.json');
        if (fs.existsSync(profilePath)) {
          try {
            const content = await readFile(profilePath, 'utf-8');
            const profile = JSON.parse(content);
            
            // Zドライブにない場合のみ追加
            if (!users.find(u => u.sid === profile.sid)) {
              users.push(profile);
            }
          } catch (error) {
            console.error(`[getAllUsers] Error reading local profile for ${userDir}:`, error);
          }
        }
      }
    }
    
    console.log(`[getAllUsers] Found ${users.length} users`);
    return users;
  } catch (error) {
    console.error(`[getAllUsers] Error getting all users:`, error);
    return [];
  }
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
  try {
    console.log(`[createContent] Creating new content: ${data.title}`);
    
    const materials = await getAllContent();
    
    // ID生成の修正（空配列の場合の処理）
    let newId: string;
    if (materials.length === 0) {
      newId = '1';
    } else {
      const maxId = Math.max(...materials.map(m => parseInt(m.id) || 0));
      newId = (maxId + 1).toString();
    }
    
    const uuid = uuidv4(); // UUIDを生成
    const directoryName = `content_${newId.padStart(3, '0')}`;
    
    // フォルダ作成（Zドライブとローカルの両方に作成）
    const zDriveDir = path.join(Z_DRIVE_PATH, 'shared', 'materials', directoryName);
    const localDir = path.join(DATA_DIR, 'materials', directoryName);
    
    // Zドライブにフォルダ作成
    if (fs.existsSync(Z_DRIVE_PATH)) {
      await mkdir(zDriveDir, { recursive: true });
      console.log(`[createContent] Created Z drive directory: ${zDriveDir}`);
    }
    
    // ローカルにもフォルダ作成（同期のため）
    await mkdir(localDir, { recursive: true });
    console.log(`[createContent] Created local directory: ${localDir}`);
    
    // メインの作業ディレクトリを設定
    const uploadDir = fs.existsSync(Z_DRIVE_PATH) ? zDriveDir : localDir;
    
    // コンテンツファイルを作成（Markdown）- Zドライブとローカルの両方に作成
    if (data.content && data.content.trim()) {
      // Zドライブに作成
      if (fs.existsSync(Z_DRIVE_PATH)) {
        const zContentPath = path.join(zDriveDir, 'content.md');
        await writeFile(zContentPath, data.content, 'utf-8');
        console.log(`[createContent] Created Z drive content file: ${zContentPath}`);
      }
      
      // ローカルにも作成
      const localContentPath = path.join(localDir, 'content.md');
      await writeFile(localContentPath, data.content, 'utf-8');
      console.log(`[createContent] Created local content file: ${localContentPath}`);
    }
    
    // 現在のユーザー情報を取得
    let author_name = 'Unknown Author';
    let author_sid = '';
    let author_role = 'user';
    
    try {
      // リクエストからユーザー情報を取得（認証済みユーザー）
      if (data.user && data.user.sid) {
        // ユーザー情報を直接取得
        author_name = data.user.display_name || 'Unknown Author';
        author_sid = data.user.sid || '';
        author_role = data.user.role || 'user';
        console.log(`[createContent] User info: ${author_name} (${author_sid}, ${author_role})`);
      } else {
        console.log(`[createContent] No user info provided, using defaults`);
      }
    } catch (error) {
      console.log(`[createContent] Could not get user info, using default:`, error);
    }

    // 添付ファイル情報を処理
    const files: any[] = [];
    if (data.files && Array.isArray(data.files)) {
      data.files.forEach((file: any, index: number) => {
        files.push({
          id: `${newId}_file_${index + 1}`,
          original_name: file.name,
          safe_name: `file_${String(index + 1).padStart(2, '0')}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
          size: file.size,
          type: file.type,
          path: `materials/${directoryName}/file_${String(index + 1).padStart(2, '0')}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
        });
      });
    }

    // メタデータを作成
    const metadata = {
      id: newId,
      uuid: uuid,
      title: data.title,
      description: data.description,
      category_id: data.category_id,
      type: data.type,
      difficulty: data.difficulty,
      estimated_hours: data.estimated_hours || 1,
      tags: data.tags ? data.tags.split(',').map((tag: string) => tag.trim()) : [],
      content_path: data.content ? `materials/${directoryName}/content.md` : null,
      files: files,
      attachments: files,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
      created_by: 'system',
      author_name: author_name,
      author_sid: author_sid,
      author_role: author_role,
      is_active: true
    };
    
    // メタデータファイルを保存 - Zドライブとローカルの両方に保存
    console.log(`[createContent] Metadata object:`, JSON.stringify(metadata, null, 2));
    
    // Zドライブに保存
    if (fs.existsSync(Z_DRIVE_PATH)) {
      const zMetadataPath = path.join(zDriveDir, 'metadata.json');
      await writeFile(zMetadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
      console.log(`[createContent] Created Z drive metadata file: ${zMetadataPath}`);
      
      // 保存後の確認
      const savedContent = await readFile(zMetadataPath, 'utf-8');
      console.log(`[createContent] Z drive metadata file content:`, savedContent);
    }
    
    // ローカルにも保存
    const localMetadataPath = path.join(localDir, 'metadata.json');
    await writeFile(localMetadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
    console.log(`[createContent] Created local metadata file: ${localMetadataPath}`);
    
    // 保存後の確認
    const localSavedContent = await readFile(localMetadataPath, 'utf-8');
    console.log(`[createContent] Local metadata file content:`, localSavedContent);
    
    const newMaterial = {
      id: newId,
      uuid: uuid,
      title: data.title,
      description: data.description,
      category_id: data.category_id,
      type: data.type,
      file_path: `materials/${directoryName}`,
      difficulty: data.difficulty,
      estimated_hours: data.estimated_hours || 1,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString()
    };
    
    materials.push(newMaterial);
    
    // Zドライブに保存
    const zDriveMaterialsPath = path.join(Z_DRIVE_PATH, 'shared', 'materials', 'materials.csv');
    if (fs.existsSync(Z_DRIVE_PATH)) {
      await writeCSV(zDriveMaterialsPath, materials);
      console.log(`[createContent] Saved to Z drive: ${zDriveMaterialsPath}`);
    } else {
      console.log(`[createContent] Z drive not available, saving locally only`);
    }
    
    // ローカルにも保存
    const localMaterialsPath = 'materials/materials.csv';
    await writeCSV(localMaterialsPath, materials);
    console.log(`[createContent] Saved to local: ${localMaterialsPath}`);
    
    console.log(`[createContent] Successfully created content: ${newId}`);
    return { success: true, material: newMaterial };
  } catch (error) {
    console.error(`[createContent] Error creating content:`, error);
    return { success: false, error: error.message };
  }
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
  try {
    console.log(`[deleteContent] Deleting content: ${contentId}`);
    
    // 直接materials.csvから読み込んで確認
    let materials: any[] = [];
    try {
      materials = await readCSV('materials/materials.csv');
    } catch (error) {
      console.log(`[deleteContent] Could not read materials.csv:`, error);
      materials = [];
    }
    
    const contentToDelete = materials.find(m => m.id === contentId);
    
    if (!contentToDelete) {
      console.log(`[deleteContent] Content not found in CSV: ${contentId}`);
      // CSVにない場合でも、ファイルシステムから削除を試行
    }
    
    // 1. ZドライブのCSVファイルから削除
    const zMaterialsPath = path.join(Z_DRIVE_PATH, 'shared', 'materials', 'materials.csv');
    if (fs.existsSync(zMaterialsPath)) {
      const filteredMaterials = materials.filter(m => m.id !== contentId);
      
      // writeCSV関数を使用してヘッダーを保持
      await writeCSV(zMaterialsPath, filteredMaterials);
      console.log(`[deleteContent] Removed from Z drive CSV: ${contentId}`);
    }
    
    // 2. ローカルのCSVファイルからも削除（同期のため）
    const localMaterialsPath = path.join(DATA_DIR, 'materials', 'materials.csv');
    if (fs.existsSync(localMaterialsPath)) {
      const filteredMaterials = materials.filter(m => m.id !== contentId);
      
      // writeCSV関数を使用してヘッダーを保持
      await writeCSV('materials/materials.csv', filteredMaterials);
      console.log(`[deleteContent] Removed from local CSV: ${contentId}`);
    }
    
    // 3. メタデータファイルを削除（Zドライブ）
    const zMetadataPath = path.join(Z_DRIVE_PATH, 'shared', 'materials', `content_${contentId}`, 'metadata.json');
    if (fs.existsSync(zMetadataPath)) {
      fs.unlinkSync(zMetadataPath);
      console.log(`[deleteContent] Deleted Z drive metadata file: ${zMetadataPath}`);
    }
    
    // 4. コンテンツディレクトリ全体を削除（Zドライブ）
    const zContentDir = path.join(Z_DRIVE_PATH, 'shared', 'materials', `content_${contentId}`);
    if (fs.existsSync(zContentDir)) {
      fs.rmSync(zContentDir, { recursive: true, force: true });
      console.log(`[deleteContent] Deleted Z drive content directory: ${zContentDir}`);
    }
    
    // 5. ローカルのメタデータファイルを削除
    const localMetadataPath = path.join(DATA_DIR, 'materials', `content_${contentId}`, 'metadata.json');
    if (fs.existsSync(localMetadataPath)) {
      fs.unlinkSync(localMetadataPath);
      console.log(`[deleteContent] Deleted local metadata file: ${localMetadataPath}`);
    }
    
    // 6. ローカルのコンテンツディレクトリ全体を削除
    const localContentDir = path.join(DATA_DIR, 'materials', `content_${contentId}`);
    if (fs.existsSync(localContentDir)) {
      fs.rmSync(localContentDir, { recursive: true, force: true });
      console.log(`[deleteContent] Deleted local content directory: ${localContentDir}`);
    }
    
    console.log(`[deleteContent] Successfully deleted content: ${contentId}`);
    return { success: true };
  } catch (error) {
    console.error(`[deleteContent] Error deleting content:`, error);
    return { success: false, error: error.message };
  }
}

// ローカルのみ削除
export async function deleteLocalContent(contentId: string) {
  try {
    console.log(`[deleteLocalContent] Deleting local content: ${contentId}`);
    
    // ローカルのmetadata.jsonファイルの存在を確認
    const localMetadataPath = path.join(DATA_DIR, 'materials', `content_${contentId}`, 'metadata.json');
    if (!fs.existsSync(localMetadataPath)) {
      console.log(`[deleteLocalContent] Local metadata file not found: ${localMetadataPath}`);
      return { success: false, error: 'Local content not found' };
    }
    
    // ローカルのmaterials.csvから削除（存在する場合のみ）
    const localMaterialsPath = path.join(DATA_DIR, 'materials', 'materials.csv');
    if (fs.existsSync(localMaterialsPath)) {
      try {
        // ローカルのCSVを直接読み込み（Zドライブ優先のreadCSVを使わない）
        const materials = await parseCSVFile(localMaterialsPath);
        const contentToDelete = materials.find(m => m.id === contentId);
        
        if (contentToDelete) {
          const filteredMaterials = materials.filter(m => m.id !== contentId);
          await writeCSV('materials/materials.csv', filteredMaterials);
          console.log(`[deleteLocalContent] Removed from local CSV: ${contentId}`);
        } else {
          console.log(`[deleteLocalContent] Content not found in local CSV (local-only content): ${contentId}`);
        }
      } catch (error) {
        console.log(`[deleteLocalContent] Could not update local CSV:`, error);
        // CSVの更新に失敗しても、ファイル削除は続行
      }
    }
    
    // ローカルのコンテンツディレクトリ全体を削除
    const localContentDir = path.join(DATA_DIR, 'materials', `content_${contentId}`);
    if (fs.existsSync(localContentDir)) {
      fs.rmSync(localContentDir, { recursive: true, force: true });
      console.log(`[deleteLocalContent] Deleted local content directory: ${localContentDir}`);
    }
    
    console.log(`[deleteLocalContent] Successfully deleted local content: ${contentId}`);
    return { success: true };
  } catch (error) {
    console.error(`[deleteLocalContent] Error deleting local content:`, error);
    return { success: false, error: error.message };
  }
}

// サーバーのみ削除
export async function deleteServerContent(contentId: string) {
  try {
    console.log(`[deleteServerContent] Deleting server content: ${contentId}`);
    
    // 直接materials.csvから読み込んで確認
    let materials: any[] = [];
    try {
      materials = await readCSV('materials/materials.csv');
    } catch (error) {
      console.log(`[deleteServerContent] Could not read materials.csv:`, error);
      materials = [];
    }
    
    const contentToDelete = materials.find(m => m.id === contentId);
    
    if (!contentToDelete) {
      console.log(`[deleteServerContent] Content not found in CSV: ${contentId}`);
      return { success: false, error: 'Content not found' };
    }
    
    // 1. ZドライブのCSVファイルから削除
    const zMaterialsPath = path.join(Z_DRIVE_PATH, 'shared', 'materials', 'materials.csv');
    if (fs.existsSync(zMaterialsPath)) {
      const filteredMaterials = materials.filter(m => m.id !== contentId);
      
      // writeCSV関数を使用してヘッダーを保持
      await writeCSV(zMaterialsPath, filteredMaterials);
      console.log(`[deleteServerContent] Removed from Z drive CSV: ${contentId}`);
    }
    
    // 2. メタデータファイルを削除（Zドライブ）
    const zMetadataPath = path.join(Z_DRIVE_PATH, 'shared', 'materials', `content_${contentId}`, 'metadata.json');
    if (fs.existsSync(zMetadataPath)) {
      fs.unlinkSync(zMetadataPath);
      console.log(`[deleteServerContent] Deleted Z drive metadata file: ${zMetadataPath}`);
    }
    
    // 3. コンテンツディレクトリ全体を削除（Zドライブ）
    const zContentDir = path.join(Z_DRIVE_PATH, 'shared', 'materials', `content_${contentId}`);
    if (fs.existsSync(zContentDir)) {
      fs.rmSync(zContentDir, { recursive: true, force: true });
      console.log(`[deleteServerContent] Deleted Z drive content directory: ${zContentDir}`);
    }
    
    console.log(`[deleteServerContent] Successfully deleted server content: ${contentId}`);
    return { success: true };
  } catch (error) {
    console.error(`[deleteServerContent] Error deleting server content:`, error);
    return { success: false, error: error.message };
  }
}

// コンテンツ詳細取得
export async function getContentById(contentId: string) {
  try {
    console.log(`[getContentById] Getting content for ID: ${contentId}`);
    
    // まずローカルのmetadata.jsonから情報を取得（ローカルのみのコンテンツ対応）
    const localMetadataPath = path.join(DATA_DIR, 'materials', `content_${contentId}`, 'metadata.json');
    let material: any = null;
    
    if (fs.existsSync(localMetadataPath)) {
      try {
        const metadataContent = await readFile(localMetadataPath, 'utf-8');
        const cleanContent = metadataContent.replace(/^\uFEFF/, '').trim();
        const metadata = JSON.parse(cleanContent);
        
        // metadataから基本情報を構築
        material = {
          id: contentId,
          uuid: metadata.uuid || '',
          title: metadata.title || '',
          description: metadata.description || '',
          category_id: metadata.category_id || '',
          type: metadata.type || 'article',
          difficulty: metadata.difficulty || 'beginner',
          estimated_hours: metadata.estimated_hours || '1',
          created_date: metadata.created_date || new Date().toISOString(),
          updated_date: metadata.updated_date || new Date().toISOString(),
          file_path: metadata.file_path || `materials/content_${contentId}`,
          author_name: metadata.author_name || '',
          author_sid: metadata.author_sid || '',
          author_role: metadata.author_role || 'user'
        };
        console.log(`[getContentById] Found local-only material from metadata:`, material);
      } catch (error) {
        console.log(`[getContentById] Error reading local metadata:`, error);
      }
    }
    
    // ローカルのmetadata.jsonから取得できない場合は、サーバーのmaterials.csvから取得
    if (!material) {
      const materials = await readCSV('materials.csv');
      console.log(`[getContentById] Found ${materials.length} materials in CSV`);
      
      material = materials.find(m => m.id === contentId);
      console.log(`[getContentById] Found material in CSV:`, material);
      
      if (!material) {
        console.log(`[getContentById] Material not found for ID: ${contentId}`);
        return null;
      }
    }
    
    // 詳細情報をmetadata.jsonから取得（ローカルのみのコンテンツの場合はローカル優先）
    const contentDir = `content_${contentId}`;
    let metadataPath: string;
    
    // ローカルのmetadata.jsonが存在する場合は、それを優先的に使用
    const localMetadataPathForDetails = path.join(DATA_DIR, 'materials', contentDir, 'metadata.json');
    if (fs.existsSync(localMetadataPathForDetails)) {
      metadataPath = localMetadataPathForDetails;
      console.log(`[getContentById] Using local metadata: ${metadataPath}`);
    } else if (fs.existsSync(Z_DRIVE_PATH)) {
      metadataPath = path.join(Z_DRIVE_PATH, 'shared', 'materials', contentDir, 'metadata.json');
      console.log(`[getContentById] Using Z-drive metadata: ${metadataPath}`);
    } else {
      metadataPath = localMetadataPathForDetails;
      console.log(`[getContentById] Using fallback local metadata: ${metadataPath}`);
    }
    console.log(`[getContentById] Metadata path: ${metadataPath}`);
    console.log(`[getContentById] Metadata exists: ${fs.existsSync(metadataPath)}`);
    
    let content = '';
    let attachments: any[] = [];
    let tags: string[] = [];
    let author_name = '';
    let author_sid = '';
    let author_role = 'user';
    
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
        } else if (metadata.content_path) {
          // content_pathが指定されている場合は直接読み込み
          let contentFilePath: string;
          
          // ローカルのmetadata.jsonを使用している場合は、ローカルを優先
          if (metadataPath === localMetadataPathForDetails) {
            contentFilePath = path.join(DATA_DIR, metadata.content_path);
            console.log(`[getContentById] Using local content_path (local metadata): ${contentFilePath}`);
          } else if (fs.existsSync(Z_DRIVE_PATH)) {
            contentFilePath = path.join(Z_DRIVE_PATH, 'shared', metadata.content_path);
            console.log(`[getContentById] Using Z-drive content_path: ${contentFilePath}`);
          } else {
            contentFilePath = path.join(DATA_DIR, metadata.content_path);
            console.log(`[getContentById] Using local content_path (fallback): ${contentFilePath}`);
          }
          console.log(`[getContentById] Reading content from content_path: ${contentFilePath}`);
          
          if (fs.existsSync(contentFilePath)) {
            try {
              content = await readFile(contentFilePath, 'utf-8');
              console.log(`[getContentById] Content from content_path length: ${content.length} chars`);
            } catch (error) {
              console.error(`[getContentById] Error reading content_path file:`, error);
              content = 'Error reading content file';
            }
          } else {
            console.log(`[getContentById] Content file not found: ${contentFilePath}`);
            content = 'Content file not found';
          }
        } else if ((metadata.files && metadata.files.length > 0) || (metadata.attachments && metadata.attachments.length > 0)) {
          // メインコンテンツファイルを探す
          const mainContentFiles = ['index.md', 'content.md', 'main.md', 'readme.md'];
          let mainContentFile = null;
          
          // filesまたはattachmentsからメインコンテンツファイルを探す
          const fileList = metadata.files || metadata.attachments || [];
          for (const file of fileList) {
            const fileName = file.safe_name.toLowerCase();
            if (mainContentFiles.includes(fileName)) {
              mainContentFile = file;
              break;
            }
          }
          
          // .mdファイルを探す
          if (!mainContentFile) {
            for (const file of fileList) {
              if (file.safe_name.toLowerCase().endsWith('.md')) {
                mainContentFile = file;
                break;
              }
            }
          }
          
          if (mainContentFile) {
            let filePath: string;
            
            // ローカルのmetadata.jsonを使用している場合は、ローカルを優先
            if (metadataPath === localMetadataPathForDetails) {
              filePath = path.join(DATA_DIR, mainContentFile.path);
              console.log(`[getContentById] Using local file path (local metadata): ${filePath}`);
            } else if (fs.existsSync(Z_DRIVE_PATH)) {
              filePath = path.join(Z_DRIVE_PATH, 'shared', mainContentFile.path);
              console.log(`[getContentById] Using Z-drive file path: ${filePath}`);
            } else {
              filePath = path.join(DATA_DIR, mainContentFile.path);
              console.log(`[getContentById] Using local file path (fallback): ${filePath}`);
            }
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
        } else {
          // metadataにcontentやfilesがない場合、content.mdファイルを直接読み込み
          const contentFilePath = path.join(path.dirname(metadataPath), 'content.md');
          console.log(`[getContentById] Trying to read content.md directly: ${contentFilePath}`);
          
          if (fs.existsSync(contentFilePath)) {
            try {
              content = await readFile(contentFilePath, 'utf-8');
              console.log(`[getContentById] Direct content.md length: ${content.length} chars`);
            } catch (error) {
              console.error(`[getContentById] Error reading content.md:`, error);
              content = 'Error reading content.md';
            }
          } else {
            console.log(`[getContentById] content.md file not found: ${contentFilePath}`);
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
        author_role = metadata.author_role || 'user';
        
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
      author_role: author_role,
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
    const users = await getAllUsers();
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

// 学習進捗関連の型定義
export interface UserLearningProgress {
  userId: string;
  contentId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress: number; // 0-100
  isFavorite: boolean;
  isAssigned: boolean; // アサインメントかどうか
  startedAt?: string;
  completedAt?: string;
  lastAccessedAt: string;
  notes?: string; // ユーザーのメモ
  rating?: number; // 1-5の評価
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
      try {
        const content = await readFile(zAssignmentsPath, 'utf-8');
        if (content.trim()) {
          assignments = JSON.parse(content);
          console.log(`[getUserAssignments] Found ${assignments.length} assignments on Z drive`);
          
          // ローカルにもコピー（フォールバック用）
          await syncAssignmentsToLocal(userId, assignments);
        } else {
          console.log(`[getUserAssignments] Z drive file is empty, trying local fallback`);
          assignments = [];
        }
      } catch (error) {
        console.error(`[getUserAssignments] Error parsing Z drive JSON:`, error);
        console.log(`[getUserAssignments] Trying local fallback`);
        assignments = [];
      }
    } else {
      // Zドライブにない場合はローカルから取得
      console.log(`[getUserAssignments] Z drive assignments not found, trying local`);
      const localAssignmentsPath = getUserAssignmentsFilePath(userId, false);
      
      if (fs.existsSync(localAssignmentsPath)) {
        console.log(`[getUserAssignments] Found local assignments file`);
        try {
          const content = await readFile(localAssignmentsPath, 'utf-8');
          if (content.trim()) {
            assignments = JSON.parse(content);
            console.log(`[getUserAssignments] Found ${assignments.length} assignments locally`);
          } else {
            console.log(`[getUserAssignments] Local file is empty`);
            assignments = [];
          }
        } catch (error) {
          console.error(`[getUserAssignments] Error parsing local JSON:`, error);
          assignments = [];
        }
      } else {
        console.log(`[getUserAssignments] No assignments file found anywhere`);
        return [];
      }
    }
    
    // 期限切れチェック（表示用のみ、ファイル更新なし）
    const updatedAssignments = assignments.map(checkOverdueStatusDisplayOnly);
    
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

// アサインメントを作成（排他制御付き）
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
    
    // 排他制御で学習指示を作成
    await fileLockManager.withLock(assignment.assignedTo, async () => {
      // 既存のアサインメントを安全に取得
      const existingAssignments = await fileLockManager.readAssignmentsSafely(assignment.assignedTo);
      
      // 新しいアサインメントを追加
      const updatedAssignments = [...existingAssignments, newAssignment];
      
      // Zドライブに安全に保存
      await fileLockManager.writeAssignmentsSafely(assignment.assignedTo, updatedAssignments);
      
      // ローカルにも同期
      await syncAssignmentsToLocal(assignment.assignedTo, updatedAssignments);
      
      console.log(`[createAssignment] Created assignment: ${assignmentId} for user: ${assignment.assignedTo}`);
    });
    
    return { success: true, assignment: newAssignment };
  } catch (error) {
    console.error(`[createAssignment] Error creating assignment:`, error);
    return { success: false, error: error.message };
  }
}

// アサインメントを更新（排他制御付き）
export async function updateAssignment(userId: string, assignmentId: string, updates: Partial<Assignment>): Promise<{ success: boolean; assignment?: Assignment; error?: string }> {
  try {
    console.log(`[updateAssignment] Updating assignment: ${assignmentId} for user: ${userId}`);
    
    // 排他制御で学習指示を更新
    let result: { success: boolean; assignment?: Assignment; error?: string };
    await fileLockManager.withLock(userId, async () => {
      const assignments = await fileLockManager.readAssignmentsSafely(userId);
      const assignmentIndex = assignments.findIndex(a => a.id === assignmentId);
      
      if (assignmentIndex === -1) {
        result = { success: false, error: 'Assignment not found' };
        return;
      }
      
      // アサインメントを更新
      const updatedAssignment = {
        ...assignments[assignmentIndex],
        ...updates,
        updated_date: new Date().toISOString()
      };
      
      assignments[assignmentIndex] = updatedAssignment;
      
      // Zドライブに安全に保存
      await fileLockManager.writeAssignmentsSafely(userId, assignments);
      
      // ローカルにも同期
      await syncAssignmentsToLocal(userId, assignments);
      
      console.log(`[updateAssignment] Updated assignment: ${assignmentId}`);
      result = { success: true, assignment: updatedAssignment };
    });
    
    return result;
  } catch (error) {
    console.error(`[updateAssignment] Error updating assignment:`, error);
    return { success: false, error: error.message };
  }
}

// アサインメントを削除（排他制御付き）
export async function deleteAssignment(userId: string, assignmentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[deleteAssignment] Deleting assignment: ${assignmentId} for user: ${userId}`);
    
    // 排他制御で学習指示を削除
    let result: { success: boolean; error?: string };
    await fileLockManager.withLock(userId, async () => {
      const assignments = await fileLockManager.readAssignmentsSafely(userId);
      const filteredAssignments = assignments.filter(a => a.id !== assignmentId);
      
      if (assignments.length === filteredAssignments.length) {
        result = { success: false, error: 'Assignment not found' };
        return;
      }
      
      // Zドライブに安全に保存
      await fileLockManager.writeAssignmentsSafely(userId, filteredAssignments);
      
      // ローカルにも同期
      await syncAssignmentsToLocal(userId, filteredAssignments);
      
      console.log(`[deleteAssignment] Deleted assignment: ${assignmentId}`);
      result = { success: true };
    });
    
    return result;
  } catch (error) {
    console.error(`[deleteAssignment] Error deleting assignment:`, error);
    return { success: false, error: error.message };
  }
}

// 期限切れ判定ロジック（表示用のみ、ファイル更新なし）
function checkOverdueStatusDisplayOnly(assignment: Assignment): Assignment {
  const now = new Date();
  const dueDate = new Date(assignment.dueDate);
  
  // 期限日を23:59:59まで有効とする
  dueDate.setHours(23, 59, 59, 999);
  
  // 期限切れかつ未完了の場合のみ表示用ステータスを更新（ファイル更新なし）
  if (now > dueDate && assignment.status !== 'completed') {
    return {
      ...assignment,
      status: 'overdue'
      // updated_dateは更新しない（ファイル更新を防ぐため）
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
    
    // 期限切れチェック（表示用のみ、ファイル更新なし）
    const updatedAssignments = allAssignments.map(checkOverdueStatusDisplayOnly);
    
    console.log(`[getAllAssignments] Found ${updatedAssignments.length} total assignments`);
    return updatedAssignments;
  } catch (error) {
    console.error(`[getAllAssignments] Error getting all assignments:`, error);
    return [];
  }
}

// ===== 学習進捗機能 =====

// ユーザーの学習進捗ファイルパスを取得
function getUserLearningProgressPath(userId: string, isZDrive: boolean = true): string {
  if (isZDrive) {
    return path.join(Z_DRIVE_PATH, 'users', userId, 'learning-progress.json');
  } else {
    return path.join(DATA_DIR, 'users', userId, 'learning-progress.json');
  }
}

// ユーザーの学習進捗を取得（Zドライブ優先、ローカルフォールバック）
export async function getUserLearningProgress(userId: string): Promise<UserLearningProgress[]> {
  try {
    console.log(`[getUserLearningProgress] Getting learning progress for user: ${userId}`);
    
    // Zドライブから取得を試行
    const zProgressPath = getUserLearningProgressPath(userId, true);
    console.log(`[getUserLearningProgress] Z drive progress path: ${zProgressPath}`);
    
    let progress: UserLearningProgress[] = [];
    
    if (fs.existsSync(zProgressPath)) {
      console.log(`[getUserLearningProgress] Found progress file on Z drive`);
      const content = await readFile(zProgressPath, 'utf-8');
      progress = JSON.parse(content);
      console.log(`[getUserLearningProgress] Found ${progress.length} progress entries on Z drive`);
      
      // ローカルにもコピー（フォールバック用）
      await syncLearningProgressToLocal(userId, progress);
    } else {
      // Zドライブにない場合はローカルから取得
      console.log(`[getUserLearningProgress] Z drive progress not found, trying local`);
      const localProgressPath = getUserLearningProgressPath(userId, false);
      
      if (fs.existsSync(localProgressPath)) {
        console.log(`[getUserLearningProgress] Found local progress file`);
        const content = await readFile(localProgressPath, 'utf-8');
        progress = JSON.parse(content);
        console.log(`[getUserLearningProgress] Found ${progress.length} progress entries locally`);
      } else {
        console.log(`[getUserLearningProgress] No progress file found anywhere`);
        return [];
      }
    }
    
    return progress;
  } catch (error) {
    console.error(`[getUserLearningProgress] Error getting learning progress:`, error);
    return [];
  }
}

// 学習進捗をローカルに同期
async function syncLearningProgressToLocal(userId: string, progress: UserLearningProgress[]): Promise<void> {
  try {
    const localDir = path.join(DATA_DIR, 'users', userId);
    await mkdir(localDir, { recursive: true });
    
    const localPath = getUserLearningProgressPath(userId, false);
    await writeFile(localPath, JSON.stringify(progress, null, 2), 'utf-8');
    
    console.log(`[syncLearningProgressToLocal] Synced ${progress.length} progress entries to local`);
  } catch (error) {
    console.error(`[syncLearningProgressToLocal] Error syncing to local:`, error);
  }
}

// 学習進捗を更新
export async function updateUserLearningProgress(userId: string, contentId: string, updatedProgress: UserLearningProgress): Promise<void> {
  try {
    console.log(`[updateUserLearningProgress] Updating progress for user: ${userId}, content: ${contentId}`);
    
    const progress = await getUserLearningProgress(userId);
    const index = progress.findIndex(p => p.contentId === contentId);
    
    if (index !== -1) {
      progress[index] = updatedProgress;
    } else {
      progress.push(updatedProgress);
    }
    
    // Zドライブに保存
    const zDir = path.join(Z_DRIVE_PATH, 'users', userId);
    await mkdir(zDir, { recursive: true });
    
    const zPath = getUserLearningProgressPath(userId, true);
    await writeFile(zPath, JSON.stringify(progress, null, 2), 'utf-8');
    
    // ローカルにも同期
    await syncLearningProgressToLocal(userId, progress);
    
    console.log(`[updateUserLearningProgress] Successfully updated progress`);
  } catch (error) {
    console.error(`[updateUserLearningProgress] Error updating progress:`, error);
    throw error;
  }
}

// 新しい学習進捗を作成
export async function createUserLearningProgress(newProgress: UserLearningProgress): Promise<void> {
  try {
    console.log(`[createUserLearningProgress] Creating new progress for user: ${newProgress.userId}, content: ${newProgress.contentId}`);
    
    const progress = await getUserLearningProgress(newProgress.userId);
    
    // 既存のエントリがあるかチェック
    const existingIndex = progress.findIndex(p => p.contentId === newProgress.contentId);
    
    if (existingIndex !== -1) {
      // 既存のエントリを更新
      progress[existingIndex] = newProgress;
    } else {
      // 新しいエントリを追加
      progress.push(newProgress);
    }
    
    // Zドライブに保存
    const zDir = path.join(Z_DRIVE_PATH, 'users', newProgress.userId);
    await mkdir(zDir, { recursive: true });
    
    const zPath = getUserLearningProgressPath(newProgress.userId, true);
    await writeFile(zPath, JSON.stringify(progress, null, 2), 'utf-8');
    
    // ローカルにも同期
    await syncLearningProgressToLocal(newProgress.userId, progress);
    
    console.log(`[createUserLearningProgress] Successfully created progress`);
  } catch (error) {
    console.error(`[createUserLearningProgress] Error creating progress:`, error);
    throw error;
  }
}

// 学習進捗を削除
export async function deleteUserLearningProgress(userId: string, contentId: string): Promise<void> {
  try {
    console.log(`[deleteUserLearningProgress] Deleting progress for user: ${userId}, content: ${contentId}`);
    
    const progress = await getUserLearningProgress(userId);
    const filteredProgress = progress.filter(p => p.contentId !== contentId);
    
    if (filteredProgress.length === progress.length) {
      console.log(`[deleteUserLearningProgress] No progress found to delete`);
      return;
    }
    
    // Zドライブに保存
    const zDir = path.join(Z_DRIVE_PATH, 'users', userId);
    await mkdir(zDir, { recursive: true });
    
    const zPath = getUserLearningProgressPath(userId, true);
    await writeFile(zPath, JSON.stringify(filteredProgress, null, 2), 'utf-8');
    
    // ローカルにも同期
    await syncLearningProgressToLocal(userId, filteredProgress);
    
    console.log(`[deleteUserLearningProgress] Successfully deleted progress`);
  } catch (error) {
    console.error(`[deleteUserLearningProgress] Error deleting progress:`, error);
    throw error;
  }
}

// ==================== 通知管理機能 ====================

// ユーザーの通知ファイルパスを取得
export function getUserNotificationsPath(userId: string, isZDrive: boolean = true): string {
  if (isZDrive) {
    return path.join(Z_DRIVE_PATH, 'users', userId, 'notifications', 'notifications.json');
  } else {
    return path.join(DATA_DIR, 'users', userId, 'notifications', 'notifications.json');
  }
}

// ユーザーの通知を取得
export async function getUserNotifications(userId: string): Promise<Notification[]> {
  try {
    console.log(`[getUserNotifications] Getting notifications for user: ${userId}`);
    
    // Zドライブを優先
    const zNotificationsPath = getUserNotificationsPath(userId, true);
    let notifications: Notification[] = [];
    
    if (fs.existsSync(zNotificationsPath)) {
      console.log(`[getUserNotifications] Found notifications file on Z drive`);
      const content = await readFile(zNotificationsPath, 'utf-8');
      
      if (content.trim()) {
        notifications = JSON.parse(content);
        console.log(`[getUserNotifications] Found ${notifications.length} notifications on Z drive`);
      } else {
        console.log(`[getUserNotifications] Z drive notifications file is empty`);
      }
    } else {
      console.log(`[getUserNotifications] No notifications file found on Z drive`);
    }
    
    // ローカルにも同期（フォールバック用）
    if (notifications.length > 0) {
      await syncNotificationsToLocal(userId, notifications);
    }
    
    return notifications;
  } catch (error) {
    console.error(`[getUserNotifications] Error getting notifications:`, error);
    return [];
  }
}

// 通知をローカルに同期
async function syncNotificationsToLocal(userId: string, notifications: Notification[]): Promise<void> {
  try {
    const localDir = path.join(DATA_DIR, 'users', userId, 'notifications');
    await mkdir(localDir, { recursive: true });
    
    const localPath = getUserNotificationsPath(userId, false);
    await writeFile(localPath, JSON.stringify(notifications, null, 2), 'utf-8');
    
    console.log(`[syncNotificationsToLocal] Synced ${notifications.length} notifications to local`);
  } catch (error) {
    console.error(`[syncNotificationsToLocal] Error syncing notifications:`, error);
  }
}

// ユーザー別sync.logを作成・更新
export async function updateUserSyncLog(userId: string, syncedCount: number, skippedCount: number): Promise<void> {
  try {
    const userSyncDir = path.join(Z_DRIVE_PATH, 'users', userId, 'sync');
    const userSyncLogPath = path.join(userSyncDir, 'sync.log');
    
    console.log(`[updateUserSyncLog] Creating sync log for user: ${userId}`);
    console.log(`[updateUserSyncLog] Sync directory: ${userSyncDir}`);
    console.log(`[updateUserSyncLog] Sync log path: ${userSyncLogPath}`);
    
    // ユーザーsyncディレクトリを作成
    if (!fs.existsSync(userSyncDir)) {
      console.log(`[updateUserSyncLog] Creating sync directory: ${userSyncDir}`);
      await mkdir(userSyncDir, { recursive: true });
    }
    
    // 同期ログエントリを作成
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] User ${userId}: ${syncedCount}件同期, ${skippedCount}件スキップ\n`;
    
    console.log(`[updateUserSyncLog] Writing log entry: ${logEntry.trim()}`);
    
    // ログファイルに追記
    const appendFile = promisify(fs.appendFile);
    await appendFile(userSyncLogPath, logEntry, 'utf-8');
    
    console.log(`[updateUserSyncLog] Successfully updated sync log for user ${userId}: ${syncedCount} synced, ${skippedCount} skipped`);
  } catch (error) {
    console.error(`[updateUserSyncLog] Error updating sync log for user ${userId}:`, error);
  }
}

// ユーザー別sync.logから最新の同期時刻を取得
export async function getUserLastSyncTime(userId: string): Promise<string | null> {
  try {
    const userSyncLogPath = path.join(Z_DRIVE_PATH, 'users', userId, 'sync', 'sync.log');
    console.log(`[getUserLastSyncTime] Looking for sync log at: ${userSyncLogPath}`);
    
    if (!fs.existsSync(userSyncLogPath)) {
      console.log(`[getUserLastSyncTime] Sync log file does not exist for user: ${userId}`);
      return null;
    }
    
    const logContent = await readFile(userSyncLogPath, 'utf-8');
    const lines = logContent.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      return null;
    }
    
    // 最後の行から時刻を抽出
    const lastLine = lines[lines.length - 1];
    const match = lastLine.match(/\[(.*?)\]/);
    
    if (match) {
      // UTC時刻を日本時間に変換
      const utcTime = new Date(match[1]);
      return utcTime.toLocaleString('ja-JP', {
        timeZone: 'Asia/Tokyo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    }
    
    return null;
  } catch (error) {
    console.error(`[getUserLastSyncTime] Error reading sync log for user ${userId}:`, error);
    return null;
  }
}

// 通知を作成（排他制御付き）
export async function createNotification(notification: Notification): Promise<void> {
  try {
    console.log(`[createNotification] Creating notification: ${notification.id} for user: ${notification.userId}`);
    
    if (!notification.userId) {
      throw new Error('Notification userId is required');
    }
    
    // 排他制御で通知を作成
    await fileLockManager.withLock(notification.userId, async () => {
      const notifications = await fileLockManager.readNotificationsSafely(notification.userId);
      notifications.push(notification);
      
      // Zドライブに安全に保存
      await fileLockManager.writeNotificationsSafely(notification.userId, notifications);
      
      // ローカルにも同期
      await syncNotificationsToLocal(notification.userId, notifications);
      
      console.log(`[createNotification] Successfully created notification: ${notification.id} for user: ${notification.userId}`);
    });
  } catch (error) {
    console.error(`[createNotification] Error creating notification:`, error);
    throw error;
  }
}

// 通知を既読にする（排他制御付き）
export async function markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
  try {
    console.log(`[markNotificationAsRead] Marking notification as read: ${notificationId}`);
    
    // 排他制御で通知を既読にする
    await fileLockManager.withLock(userId, async () => {
      const notifications = await fileLockManager.readNotificationsSafely(userId);
      const updatedNotifications = notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      );
      
      // Zドライブに安全に保存
      await fileLockManager.writeNotificationsSafely(userId, updatedNotifications);
      
      // ローカルにも同期
      await syncNotificationsToLocal(userId, updatedNotifications);
      
      console.log(`[markNotificationAsRead] Successfully marked notification as read: ${notificationId}`);
    });
  } catch (error) {
    console.error(`[markNotificationAsRead] Error marking notification as read:`, error);
    throw error;
  }
}

// 通知を削除（排他制御付き）
export async function deleteNotification(userId: string, notificationId: string): Promise<void> {
  try {
    console.log(`[deleteNotification] Deleting notification: ${notificationId}`);
    
    // 排他制御で通知を削除
    await fileLockManager.withLock(userId, async () => {
      const notifications = await fileLockManager.readNotificationsSafely(userId);
      const filteredNotifications = notifications.filter(n => n.id !== notificationId);
      
      // Zドライブに安全に保存
      await fileLockManager.writeNotificationsSafely(userId, filteredNotifications);
      
      // ローカルにも同期
      await syncNotificationsToLocal(userId, filteredNotifications);
      
      console.log(`[deleteNotification] Successfully deleted notification: ${notificationId}`);
    });
  } catch (error) {
    console.error(`[deleteNotification] Error deleting notification:`, error);
    throw error;
  }
}

// 学習指示通知を作成
export async function createAssignmentNotification(
  assignedTo: string, 
  assignedBy: string, 
  assignmentTitle: string, 
  dueDate: string,
  assignmentId: string
): Promise<void> {
  try {
    console.log(`[createAssignmentNotification] Creating assignment notification for user: ${assignedTo}`);
    
    const notification: Notification = {
      id: `assignment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'assignment',
      title: '新しい学習指示が割り当てられました',
      message: `「${assignmentTitle}」が割り当てられました。期限: ${new Date(dueDate).toLocaleDateString('ja-JP')}`,
      timestamp: new Date().toISOString(),
      read: false,
      actionUrl: '/learning-tasks',
      actionText: '確認する',
      assignedBy: assignedBy,
      assignmentId: assignmentId,
      userId: assignedTo  // 重要: userIdを設定
    };
    
    await createNotification(notification);
    
    console.log(`[createAssignmentNotification] Successfully created assignment notification: ${notification.id}`);
  } catch (error) {
    console.error(`[createAssignmentNotification] Error creating assignment notification:`, error);
    throw error;
  }
}
