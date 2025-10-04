import fs from 'fs';
import path from 'path';
import { KNOWLEDGE_PORTAL_DRIVE_PATH, CONFIG } from '../config/drive';

export interface ConfigItem {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  parent_id?: string;
  level?: number;
}

export type ConfigType = 'categories' | 'content-types' | 'difficulty-levels';

/**
 * 設定ファイルを読み込む（Zドライブ優先、ローカルフォールバック）
 */
export async function getConfig(type: ConfigType): Promise<ConfigItem[]> {
  try {
    const fileName = getConfigFileName(type);
    
    // Zドライブから読み込みを試行
    if (fs.existsSync(KNOWLEDGE_PORTAL_DRIVE_PATH)) {
      const zDrivePath = path.join(KNOWLEDGE_PORTAL_DRIVE_PATH, 'shared', 'config', fileName);
      if (fs.existsSync(zDrivePath)) {
        console.log(`[getConfig] Loading ${type} from Z drive: ${zDrivePath}`);
        return await parseConfigFile(zDrivePath);
      }
    }
    
    // ローカルフォールバック
    const localPath = path.join(CONFIG.DATA_DIR, 'config', fileName);
    if (fs.existsSync(localPath)) {
      console.log(`[getConfig] Loading ${type} from local: ${localPath}`);
      return await parseConfigFile(localPath);
    }
    
    // デフォルト値を返す
    console.log(`[getConfig] Using default values for ${type}`);
    return getDefaultConfig(type);
    
  } catch (error) {
    console.error(`[getConfig] Error loading ${type}:`, error);
    return getDefaultConfig(type);
  }
}

/**
 * 設定タイプに応じたファイル名を取得
 */
function getConfigFileName(type: ConfigType): string {
  switch (type) {
    case 'categories':
      return 'categories.csv';
    case 'content-types':
      return 'content_types.csv';
    case 'difficulty-levels':
      return 'difficulty_levels.csv';
    default:
      throw new Error(`Unknown config type: ${type}`);
  }
}

/**
 * CSVファイルを解析してConfigItem配列に変換
 */
async function parseConfigFile(filePath: string): Promise<ConfigItem[]> {
  try {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    const lines = content.trim().split('\n');
    
    if (lines.length < 2) {
      return [];
    }
    
    const headers = lines[0].split(',').map(h => h.trim());
    const items: ConfigItem[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const item: ConfigItem = {
        id: values[0] || '',
        name: values[1] || '',
      };
      
      // オプションフィールドを追加
      if (headers.includes('description') && values[2]) {
        item.description = values[2];
      }
      if (headers.includes('icon') && values[3]) {
        item.icon = values[3];
      }
      if (headers.includes('color') && values[3]) {
        item.color = values[3];
      }
      if (headers.includes('parent_id') && values[4]) {
        item.parent_id = values[4];
      }
      if (headers.includes('level') && values[5]) {
        item.level = parseInt(values[5]) || 0;
      }
      
      items.push(item);
    }
    
    return items;
  } catch (error) {
    console.error(`[parseConfigFile] Error parsing ${filePath}:`, error);
    return [];
  }
}

/**
 * デフォルト設定を返す
 */
function getDefaultConfig(type: ConfigType): ConfigItem[] {
  switch (type) {
    case 'categories':
      return [
        { id: '1', name: 'Programming', description: 'Programming languages and development', parent_id: '0', level: 1 },
        { id: '2', name: 'Web Development', description: 'Frontend and backend web development', parent_id: '1', level: 2 },
        { id: '3', name: 'Database', description: 'Database design and management', parent_id: '1', level: 2 },
        { id: '4', name: 'DevOps', description: 'Development operations and deployment', parent_id: '1', level: 2 },
        { id: '5', name: 'Cybersecurity', description: 'Information security and protection', parent_id: '0', level: 1 },
      ];
    
    case 'content-types':
      return [
        { id: 'article', name: '記事', description: 'テキストベースの学習コンテンツ' },
        { id: 'video', name: '動画', description: '動画形式の学習コンテンツ' },
        { id: 'exercise', name: '練習', description: '実践的な演習問題' },
        { id: 'document', name: '文書', description: '参考資料やドキュメント' },
      ];
    
    case 'difficulty-levels':
      return [
        { id: 'beginner', name: '初級', description: '基礎的な内容', color: 'green' },
        { id: 'intermediate', name: '中級', description: '応用的な内容', color: 'yellow' },
        { id: 'advanced', name: '上級', description: '専門的な内容', color: 'red' },
      ];
    
    default:
      return [];
  }
}

/**
 * 設定をローカルに同期
 */
export async function syncConfigToLocal(type: ConfigType): Promise<void> {
  try {
    const config = await getConfig(type);
    const fileName = getConfigFileName(type);
    const localDir = path.join(CONFIG.DATA_DIR, 'config');
    
    // ローカルディレクトリを作成
    if (!fs.existsSync(localDir)) {
      await fs.promises.mkdir(localDir, { recursive: true });
    }
    
    // CSVファイルを生成
    const csvContent = generateCSVContent(config);
    const localPath = path.join(localDir, fileName);
    await fs.promises.writeFile(localPath, csvContent, 'utf-8');
    
    console.log(`[syncConfigToLocal] Synced ${type} to local: ${localPath}`);
  } catch (error) {
    console.error(`[syncConfigToLocal] Error syncing ${type}:`, error);
  }
}

/**
 * ConfigItem配列をCSV形式に変換
 */
function generateCSVContent(items: ConfigItem[]): string {
  if (items.length === 0) {
    return '';
  }
  
  const headers = ['id', 'name', 'description', 'icon', 'color', 'parent_id', 'level'];
  const csvLines = [headers.join(',')];
  
  for (const item of items) {
    const values = [
      item.id || '',
      item.name || '',
      item.description || '',
      item.icon || '',
      item.color || '',
      item.parent_id || '',
      item.level?.toString() || '',
    ];
    csvLines.push(values.join(','));
  }
  
  return csvLines.join('\n');
}
