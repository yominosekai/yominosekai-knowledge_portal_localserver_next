import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { CONFIG } from '../../../../../config/drive';

export async function GET() {
  try {
    console.log('[ContentCompare] Starting server and local CSV comparison');
    
    const zDrivePath = CONFIG.DRIVE_PATH;
    const localDataPath = CONFIG.DATA_DIR;
    
    // Zドライブの接続確認
    const isZDriveConnected = fs.existsSync(zDrivePath);
    console.log(`[ContentCompare] Z drive connected: ${isZDriveConnected}`);
    
    // サーバー（Zドライブ）のmaterials.csvを読み込み
    let serverMaterials: any[] = [];
    if (isZDriveConnected) {
      const serverMaterialsPath = path.join(zDrivePath, 'shared', 'materials.csv');
      if (fs.existsSync(serverMaterialsPath)) {
        serverMaterials = await parseCSVFile(serverMaterialsPath);
        console.log(`[ContentCompare] Server materials: ${serverMaterials.length} items`);
      } else {
        console.log('[ContentCompare] Server materials.csv not found');
      }
    }
    
    // ローカルのmaterials.csvを読み込み
    let localMaterials: any[] = [];
    const localMaterialsPath = path.join(localDataPath, 'materials', 'materials.csv');
    if (fs.existsSync(localMaterialsPath)) {
      localMaterials = await parseCSVFile(localMaterialsPath);
      console.log(`[ContentCompare] Local materials: ${localMaterials.length} items`);
    } else {
      console.log('[ContentCompare] Local materials.csv not found');
    }
    
    // 差分を検出
    const comparison = compareMaterials(serverMaterials, localMaterials);
    
    console.log(`[ContentCompare] Comparison result:`, {
      serverOnly: comparison.serverOnly.length,
      localOnly: comparison.localOnly.length,
      both: comparison.both.length
    });
    
    return NextResponse.json({
      success: true,
      comparison: {
        serverOnly: comparison.serverOnly,
        localOnly: comparison.localOnly,
        both: comparison.both,
        summary: {
          serverCount: serverMaterials.length,
          localCount: localMaterials.length,
          serverOnlyCount: comparison.serverOnly.length,
          localOnlyCount: comparison.localOnly.length,
          bothCount: comparison.both.length
        }
      }
    });
    
  } catch (error) {
    console.error('[ContentCompare] Error:', error);
    return NextResponse.json(
      { success: false, error: 'CSV comparison failed' },
      { status: 500 }
    );
  }
}

// CSVファイルを解析
async function parseCSVFile(filePath: string): Promise<any[]> {
  try {
    const content = await fs.promises.readFile(filePath, 'utf-8');
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
        console.warn(`[ContentCompare] Skipping malformed CSV line ${i + 1}: expected ${headers.length} columns, got ${values.length}`);
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
    console.error(`[ContentCompare] Error parsing CSV file ${filePath}:`, error);
    return [];
  }
}

// サーバーとローカルのmaterialsを比較
function compareMaterials(serverMaterials: any[], localMaterials: any[]) {
  const serverOnly: any[] = [];
  const localOnly: any[] = [];
  const both: any[] = [];
  
  // サーバーのmaterialsをチェック
  for (const serverMaterial of serverMaterials) {
    const localMaterial = localMaterials.find(local => local.uuid === serverMaterial.uuid);
    if (localMaterial) {
      // 両方に存在
      both.push({
        ...serverMaterial,
        dataSource: 'both' as const
      });
    } else {
      // サーバーのみ
      serverOnly.push({
        ...serverMaterial,
        dataSource: 'server' as const
      });
    }
  }
  
  // ローカルのmaterialsをチェック（サーバーにないもの）
  for (const localMaterial of localMaterials) {
    const serverMaterial = serverMaterials.find(server => server.uuid === localMaterial.uuid);
    if (!serverMaterial) {
      // ローカルのみ
      localOnly.push({
        ...localMaterial,
        dataSource: 'local' as const
      });
    }
  }
  
  return {
    serverOnly,
    localOnly,
    both
  };
}
