// Zドライブとの同期機能

export interface SyncStatus {
  isConnected: boolean;
  lastSync: string | null;
  syncedCount: number;
  totalSize: number;
  errors: string[];
}

export interface SyncOptions {
  syncAll?: boolean;
  selectedContent?: string[];
  forceSync?: boolean;
  totalContent?: number;
  onProgress?: (progress: number, message: string) => void;
}

export interface SyncResult {
  success: boolean;
  message: string;
  syncedCount?: number;
  skippedCount?: number;
  duration?: string;
  totalContent?: number;
  errors?: string[];
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
export async function syncContent(options: SyncOptions = {}): Promise<SyncResult> {
  try {
    const { onProgress, ...syncOptions } = options;
    
    // プログレスコールバックがある場合は段階的に進行状況を更新
    if (onProgress) {
      onProgress(10, 'Zドライブの接続を確認中...');
    }

    const response = await fetch('/api/sync/content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(syncOptions)
    });
    
    const data = await response.json();
    
    if (onProgress) {
      onProgress(100, '同期完了');
    }
    
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

// スマート同期（タイムスタンプ比較）
export async function smartSync(options: {
  totalContent?: number;
  onProgress?: (progress: number, message: string) => void;
} = {}): Promise<SyncResult> {
  return syncContent({
    forceSync: false,
    ...options
  });
}

// 強制同期（全ファイル再同期）
export async function forceSync(options: {
  onProgress?: (progress: number, message: string) => void;
} = {}): Promise<SyncResult> {
  return syncContent({
    forceSync: true,
    ...options
  });
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



