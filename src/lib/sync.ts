// Zドライブとの同期機能

export interface SyncStatus {
  isConnected: boolean;
  lastSync: string | null;
  syncedCount: number;
  totalSize: number;
  errors: string[];
}

export interface SyncOptions {
  syncAll: boolean;
  selectedContent: string[];
  forceSync: boolean;
}

// 同期ステータスを取得
export async function getSyncStatus(): Promise<SyncStatus> {
  try {
    const response = await fetch('/api/sync/status');
    const data = await response.json();
    
    if (data.success) {
      return data.status;
    } else {
      throw new Error(data.error || '同期ステータスの取得に失敗しました');
    }
  } catch (error) {
    console.error('同期ステータス取得エラー:', error);
    return {
      isConnected: false,
      lastSync: null,
      syncedCount: 0,
      totalSize: 0,
      errors: ['Zドライブに接続できません']
    };
  }
}

// コンテンツを同期
export async function syncContent(options: SyncOptions): Promise<{ success: boolean; message: string; errors?: string[] }> {
  try {
    const response = await fetch('/api/sync/content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options)
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('同期エラー:', error);
    return {
      success: false,
      message: '同期に失敗しました',
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

// 同期を開始
export async function startSync(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch('/api/sync/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('同期開始エラー:', error);
    return {
      success: false,
      message: '同期の開始に失敗しました'
    };
  }
}

// 同期を停止
export async function stopSync(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch('/api/sync/stop', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('同期停止エラー:', error);
    return {
      success: false,
      message: '同期の停止に失敗しました'
    };
  }
}



