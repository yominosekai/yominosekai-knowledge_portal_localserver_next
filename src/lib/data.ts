import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

// データディレクトリのパス
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
    await ensureDataDir();
    const fullPath = path.join(DATA_DIR, filePath);
    
    if (!fs.existsSync(fullPath)) {
      return [];
    }
    
    const content = await readFile(fullPath, 'utf-8');
    const lines = content.trim().split('\n');
    
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.replace(/"/g, ''));
      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      data.push(row);
    }
    
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

// ユーザーデータの取得
export async function getUserData(userId: string) {
  const users = await readCSV('users/users.csv');
  return users.find(user => user.sid === userId) || null;
}

// ユーザーデータの更新
export async function updateUserData(userId: string, data: any) {
  const users = await readCSV('users/users.csv');
  const userIndex = users.findIndex(user => user.sid === userId);
  
  if (userIndex >= 0) {
    users[userIndex] = { ...users[userIndex], ...data };
  } else {
    // 新規ユーザー作成
    const newUser = {
      sid: userId,
      username: data.username || `user_${Date.now()}`,
      display_name: data.display_name || 'New User',
      email: data.email || '',
      role: data.role || 'user',
      department: data.department || 'General',
      created_date: new Date().toISOString(),
      last_login: new Date().toISOString(),
      is_active: 'True'
    };
    users.push(newUser);
  }
  
  await writeCSV('users/users.csv', users);
  return { success: true, user: users[userIndex] || users[users.length - 1] };
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

// 全コンテンツの取得
export async function getAllContent() {
  return await readCSV('materials/materials.csv');
}

// 全カテゴリの取得
export async function getAllCategories() {
  return await readCSV('categories/categories.csv');
}

// 全ユーザーの取得
export async function getAllUsers() {
  return await readCSV('users/users.csv');
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
  const materials = await getAllContent();
  return materials.find(m => m.id === contentId) || null;
}

// 部署管理
export async function getAllDepartments() {
  return await readCSV('departments/departments.csv');
}

export async function getDepartment(departmentId: string) {
  const departments = await getAllDepartments();
  return departments.find(d => d.id === departmentId) || null;
}

export async function createDepartment(data: any) {
  const departments = await getAllDepartments();
  const newId = (Math.max(...departments.map(d => parseInt(d.id) || 0)) + 1).toString();
  
  const newDepartment = {
    id: newId,
    name: data.name,
    description: data.description || '',
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString()
  };
  
  departments.push(newDepartment);
  await writeCSV('departments/departments.csv', departments);
  
  return { success: true, department: newDepartment };
}

export async function updateDepartment(departmentId: string, data: any) {
  const departments = await getAllDepartments();
  const departmentIndex = departments.findIndex(d => d.id === departmentId);
  
  if (departmentIndex >= 0) {
    departments[departmentIndex] = { 
      ...departments[departmentIndex], 
      ...data, 
      updated_date: new Date().toISOString() 
    };
    await writeCSV('departments/departments.csv', departments);
    return { success: true, department: departments[departmentIndex] };
  }
  
  return { success: false, error: 'Department not found' };
}

export async function deleteDepartment(departmentId: string) {
  const departments = await getAllDepartments();
  const filteredDepartments = departments.filter(d => d.id !== departmentId);
  
  if (filteredDepartments.length < departments.length) {
    await writeCSV('departments/departments.csv', filteredDepartments);
    return { success: true };
  }
  
  return { success: false, error: 'Department not found' };
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
