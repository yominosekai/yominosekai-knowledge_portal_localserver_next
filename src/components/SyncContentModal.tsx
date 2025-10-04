'use client';

import { useState, useEffect } from 'react';
import { getSyncStatus, smartSync, forceSync, SyncResult } from '../lib/sync';

interface SyncContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ContentItem {
  id: string;
  title: string;
  size: number;
  lastModified: string;
  isSelected: boolean;
}

interface SyncDetails {
  syncedCount: number;
  skippedCount: number;
  duration: string;
  totalContent: number;
}

export function SyncContentModal({ isOpen, onClose, onSuccess }: SyncContentModalProps) {
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [syncAll, setSyncAll] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncMessage, setSyncMessage] = useState('');
  const [syncDetails, setSyncDetails] = useState<SyncDetails | null>(null);
         const [syncInfo, setSyncInfo] = useState({
           isConnected: false,
           lastSync: null as string | null,
           syncedCount: 0,
           localCount: 0,
           totalSize: 0,
           errors: [] as string[]
         });

  useEffect(() => {
    if (isOpen) {
      loadSyncStatus();
      loadContentItems();
    }
  }, [isOpen]);

  const loadSyncStatus = async () => {
    try {
      const status = await getSyncStatus();
      setSyncInfo(status);
    } catch (error) {
      console.error('同期ステータス取得エラー:', error);
    }
  };

  const loadContentItems = async () => {
    try {
      // 実際のAPIからコンテンツ一覧を取得
      const response = await fetch('/api/content');
      const data = await response.json();
      
      if (data.success) {
        const items: ContentItem[] = data.materials.map((material: any) => ({
          id: material.id,
          title: material.title,
          size: 0, // 実際のファイルサイズを取得する場合は別途APIが必要
          lastModified: material.updated_date || material.created_date,
          isSelected: true
        }));
        setContentItems(items);
      }
    } catch (error) {
      console.error('コンテンツ読み込みエラー:', error);
    }
  };

  const handleSelectAll = (selected: boolean) => {
    setContentItems(prev => prev.map(item => ({ ...item, isSelected: selected })));
    setSyncAll(selected);
  };

  const handleSelectItem = (id: string, selected: boolean) => {
    setContentItems(prev => prev.map(item => 
      item.id === id ? { ...item, isSelected: selected } : item
    ));
  };

  // スマート同期の実行
  const handleSmartSync = async () => {
    setIsSyncing(true);
    setSyncProgress(0);
    setSyncMessage('スマート同期を開始しています...');
    setSyncDetails(null);

    try {
      // 1. 同期前の状態確認
      setSyncProgress(10);
      setSyncMessage('Zドライブの接続を確認中...');
      
      const statusResponse = await getSyncStatus();
      if (!statusResponse.isConnected) {
        throw new Error('Zドライブに接続できません');
      }

      // 2. コンテンツ一覧の取得
      setSyncProgress(20);
      setSyncMessage('コンテンツ一覧を取得中...');
      
      const contentResponse = await fetch('/api/content');
      const contentData = await contentResponse.json();
      const totalContent = contentData.materials?.length || 0;

      if (totalContent === 0) {
        setSyncProgress(100);
        setSyncMessage('同期するコンテンツがありません');
        setIsSyncing(false);
        return;
      }

      // 3. スマート同期の実行
      setSyncProgress(30);
      setSyncMessage(`${totalContent}件のコンテンツを同期中...`);
      
      const syncResponse = await smartSync({
        totalContent: totalContent,
        onProgress: (progress: number, message: string) => {
          setSyncProgress(30 + (progress * 0.6)); // 30-90%の範囲
          setSyncMessage(message);
        }
      });

      if (syncResponse.success) {
        setSyncProgress(100);
        setSyncMessage(`同期完了: ${syncResponse.syncedCount}件同期, ${syncResponse.skippedCount}件スキップ`);
        setSyncDetails({
          syncedCount: syncResponse.syncedCount || 0,
          skippedCount: syncResponse.skippedCount || 0,
          duration: syncResponse.duration || '0ms',
          totalContent: totalContent
        });

        // 同期完了時刻をフロントエンドで設定
        const now = new Date().toLocaleString('ja-JP', {
          timeZone: 'Asia/Tokyo',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        setSyncInfo(prev => ({ ...prev, lastSync: now }));

        // コンテンツ一覧の再読み込み
        if (onSuccess) {
          onSuccess();
        }
        
        // 同期完了後は画面を閉じない（自動閉じるを削除）
        setIsSyncing(false);
      } else {
        throw new Error(syncResponse.message || '同期に失敗しました');
      }

    } catch (error) {
      console.error('Smart sync error:', error);
      setSyncProgress(0);
      setSyncMessage(`同期エラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setSyncDetails(null);
      setIsSyncing(false);
    }
  };

  // 強制同期の実行
  const handleForceSync = async () => {
    setIsSyncing(true);
    setSyncProgress(0);
    setSyncMessage('強制同期を開始しています...');
    setSyncDetails(null);

    try {
      const syncResponse = await forceSync({
        onProgress: (progress: number, message: string) => {
          setSyncProgress(progress);
          setSyncMessage(message);
        }
      });

      if (syncResponse.success) {
        setSyncProgress(100);
        setSyncMessage(`強制同期完了: ${syncResponse.syncedCount}件`);
        setSyncDetails({
          syncedCount: syncResponse.syncedCount || 0,
          skippedCount: 0,
          duration: syncResponse.duration || '0ms',
          totalContent: syncResponse.totalContent || 0
        });

        // 同期完了時刻をフロントエンドで設定
        const now = new Date().toLocaleString('ja-JP', {
          timeZone: 'Asia/Tokyo',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        setSyncInfo(prev => ({ ...prev, lastSync: now }));

        if (onSuccess) {
          onSuccess();
        }
        
        // 同期完了後は画面を閉じない（自動閉じるを削除）
        setIsSyncing(false);
      } else {
        throw new Error(syncResponse.message || '強制同期に失敗しました');
      }

    } catch (error) {
      console.error('Force sync error:', error);
      setSyncProgress(0);
      setSyncMessage(`強制同期エラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setSyncDetails(null);
      setIsSyncing(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ディレクトリを開く関数
  const openDirectory = () => {
    try {
      // 相対パスを使用（プロジェクトルートからの相対パス）
      const relativePath = 'data\\materials';
      
      // APIに相対パスを送信（サーバー側で絶対パスに変換）
      fetch('/api/open-directory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: relativePath })
      }).then(response => response.json())
        .then(data => {
          if (data.success) {
            console.log('ディレクトリを開きました:', data.path);
          } else {
            console.error('ディレクトリを開けませんでした:', data.error);
            alert('ディレクトリを開けませんでした。手動で data\\materials フォルダを開いてください。');
          }
        })
        .catch(error => {
          console.error('API呼び出しエラー:', error);
          alert('ディレクトリを開けませんでした。手動で data\\materials フォルダを開いてください。');
        });
    } catch (error) {
      console.error('ディレクトリを開けませんでした:', error);
      alert('ディレクトリを開けませんでした。手動で data\\materials フォルダを開いてください。');
    }
  };

  const totalSize = contentItems
    .filter(item => item.isSelected)
    .reduce((sum, item) => sum + item.size, 0);

  const selectedCount = contentItems.filter(item => item.isSelected).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">コンテンツ同期</h2>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white text-2xl"
            disabled={isSyncing}
          >
            ×
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                 {/* 同期ステータス */}
                 <div className="mb-6">
                   <h3 className="text-lg font-semibold text-white mb-3">同期状況</h3>
                   <div className="space-y-2 text-sm text-white/70">
                     <div className="flex items-center justify-between">
                       <span>Zドライブ接続:</span>
                       <span className={`${syncInfo.isConnected ? 'text-green-400' : 'text-red-400'}`}>
                         {syncInfo.isConnected ? '接続済み' : '未接続'}
                       </span>
                     </div>
                     
                     <div className="flex items-center justify-between">
                       <span>サーバーコンテンツ:</span>
                       <span className="text-white">{syncInfo.syncedCount}件</span>
                     </div>
                     
                     <div className="flex items-center justify-between">
                       <span>ローカルコンテンツ:</span>
                       <span className="text-white">{syncInfo.localCount}件</span>
                     </div>
                     
                     <div className="flex items-center justify-between">
                       <span>同期状況:</span>
                       <span className={`${
                         syncInfo.syncedCount === syncInfo.localCount && syncInfo.syncedCount > 0 
                           ? 'text-green-400' 
                           : syncInfo.syncedCount > syncInfo.localCount 
                             ? 'text-yellow-400' 
                             : 'text-gray-400'
                       }`}>
                         {syncInfo.syncedCount === syncInfo.localCount && syncInfo.syncedCount > 0 
                           ? '同期済み' 
                           : syncInfo.syncedCount > syncInfo.localCount 
                             ? '同期が必要' 
                             : '未同期'}
                       </span>
                     </div>
                     
                     <div className="flex items-center justify-between">
                       <span>総サイズ:</span>
                       <span className="text-white">{formatFileSize(syncInfo.totalSize * 1024 * 1024)}</span>
                     </div>
                     
                     <div className="flex items-center justify-between">
                       <span>最終同期:</span>
                       <span className="text-white">
                         {syncInfo.lastSync ? syncInfo.lastSync : '未実行'}
                       </span>
                     </div>
                     
                     {syncInfo.errors.length > 0 && (
                       <div className="text-red-400 text-xs mt-2">
                         {syncInfo.errors.map((error, index) => (
                           <div key={index}>• {error}</div>
                         ))}
                       </div>
                     )}
                   </div>
                 </div>

          {/* 同期オプション */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">同期オプション</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={syncAll}
                  onChange={(e) => {
                    setSyncAll(e.target.checked);
                    handleSelectAll(e.target.checked);
                  }}
                  className="w-4 h-4 text-brand"
                  disabled={isSyncing}
                />
                <span className="text-white">すべてのコンテンツを同期</span>
              </label>

              {!syncAll && (
                <div className="ml-7">
                  <h4 className="text-md font-medium text-white mb-3">同期するコンテンツを選択</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {contentItems.map(item => (
                      <label key={item.id} className="flex items-center gap-3 p-2 rounded hover:bg-white/5">
                        <input
                          type="checkbox"
                          checked={item.isSelected}
                          onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                          className="w-4 h-4 text-brand"
                          disabled={isSyncing}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-white truncate">{item.title}</div>
                          <div className="text-xs text-white/50">
                            {formatFileSize(item.size)} • {formatDate(item.lastModified)}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 同期進捗 */}
          {isSyncing && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">同期進捗</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/70">{syncMessage}</span>
                  <span className="text-white">{Math.round(syncProgress)}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-brand to-brand-dark h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${syncProgress}%` }}
                  />
                </div>
              </div>
            </div>
          )}

                 {/* 同期結果の表示 */}
                 {syncDetails && (
                   <div className={`mb-6 p-3 border rounded-lg transition-colors duration-500 ${
                     syncDetails.syncedCount > 0 || syncDetails.skippedCount > 0
                       ? 'border-green-500/30 bg-green-500/10' 
                       : 'border-white/10'
                   }`}>
                     <h3 className="font-semibold text-white mb-2">
                       ファイル単位同期結果
                       {(syncDetails.syncedCount > 0 || syncDetails.skippedCount > 0) && (
                         <span className="ml-2 text-green-400 text-sm">✓ 同期完了</span>
                       )}
                     </h3>
                     <div className="text-sm text-white/70 space-y-1">
                       <div>同期ファイル数: {syncDetails.syncedCount}件</div>
                       <div>スキップファイル数: {syncDetails.skippedCount}件</div>
                       <div>処理時間: {syncDetails.duration}</div>
                       {syncDetails.totalContent > 0 && (
                         <div>総コンテンツ数: {syncDetails.totalContent}件</div>
                       )}
                     </div>
                   </div>
                 )}

                 {/* 保存先ディレクトリ（常時表示） */}
                 <div className="mb-6 p-3 border border-white/10 rounded-lg">
                   <h3 className="font-semibold text-white mb-2">
                     保存先ディレクトリ
                   </h3>
                   <div className="flex items-center justify-between">
                     <div className="flex-1 min-w-0">
                       <div className="text-sm text-white/70 font-mono truncate">
                         data\materials
                       </div>
                     </div>
                     <button
                       onClick={openDirectory}
                       className="ml-3 px-2 py-1 text-xs bg-white/10 hover:bg-white/20 text-white rounded transition-colors flex items-center gap-1"
                       title="エクスプローラーで開く"
                     >
                       📁 開く
                     </button>
                   </div>
                 </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-white/10 text-white hover:bg-white/20 transition-colors"
            disabled={isSyncing}
          >
            キャンセル
          </button>
          
          <button
            onClick={handleSmartSync}
            disabled={isSyncing}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <span>{isSyncing ? '⏳' : '🔄'}</span>
            {isSyncing ? '同期中...' : 'スマート同期'}
          </button>
          
          <button
            onClick={handleForceSync}
            disabled={isSyncing}
            className="px-4 py-2 rounded bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <span>{isSyncing ? '⏳' : '⚡'}</span>
            {isSyncing ? '同期中...' : '強制同期'}
          </button>
        </div>

        {/* 同期説明 */}
        <div className="px-6 pb-4 text-sm text-white/60">
          <div className="mb-2">
            <strong>スマート同期:</strong> 変更されたファイルのみ同期（推奨）
          </div>
          <div>
            <strong>強制同期:</strong> 全てのファイルを再同期
          </div>
        </div>
      </div>
    </div>
  );
}
