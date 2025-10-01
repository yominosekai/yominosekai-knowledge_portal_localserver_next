'use client';

import { useState, useEffect } from 'react';
import { getSyncStatus, syncContent, SyncOptions } from '../lib/sync';

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

export function SyncContentModal({ isOpen, onClose, onSuccess }: SyncContentModalProps) {
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [syncAll, setSyncAll] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStatus, setSyncStatus] = useState('');
  const [syncInfo, setSyncInfo] = useState({
    isConnected: false,
    lastSync: null as string | null,
    syncedCount: 0,
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

  const handleStartSync = async () => {
    setIsSyncing(true);
    setSyncProgress(0);
    setSyncStatus('同期を開始しています...');

    try {
      const selectedItems = contentItems.filter(item => item.isSelected);
      const selectedIds = selectedItems.map(item => item.id);
      
      const options: SyncOptions = {
        syncAll,
        selectedContent: selectedIds,
        forceSync: true
      };

      setSyncStatus('Zドライブとの同期を実行中...');
      setSyncProgress(25);

      const result = await syncContent(options);
      
      if (result.success) {
        setSyncProgress(100);
        setSyncStatus('同期が完了しました！');
        
        // 同期ステータスを再取得
        await loadSyncStatus();
        
        if (onSuccess) {
          onSuccess();
        }
        
        setTimeout(() => {
          setIsSyncing(false);
          onClose();
        }, 2000);
      } else {
        setSyncStatus(`同期に失敗しました: ${result.message}`);
        setIsSyncing(false);
      }
    } catch (error) {
      console.error('同期エラー:', error);
      setSyncStatus(`同期エラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
              <p>Zドライブ接続: <span className={`${syncInfo.isConnected ? 'text-green-400' : 'text-red-400'}`}>
                {syncInfo.isConnected ? '接続済み' : '未接続'}
              </span></p>
              <p>同期済みコンテンツ: <span className="text-white">{syncInfo.syncedCount}</span>件</p>
              <p>総サイズ: <span className="text-white">{formatFileSize(syncInfo.totalSize * 1024 * 1024)}</span></p>
              <p>最終同期: <span className="text-white">
                {syncInfo.lastSync ? new Date(syncInfo.lastSync).toLocaleString('ja-JP') : '未実行'}
              </span></p>
              {syncInfo.errors.length > 0 && (
                <div className="text-red-400 text-xs">
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
                  <span className="text-white/70">{syncStatus}</span>
                  <span className="text-white">{syncProgress}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-brand to-brand-dark h-2 rounded-full transition-all duration-300"
                    style={{ width: `${syncProgress}%` }}
                  />
                </div>
              </div>
            </div>
          )}
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
            onClick={handleStartSync}
            className="px-4 py-2 rounded bg-brand text-white hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSyncing || selectedCount === 0}
          >
            {isSyncing ? '同期中...' : `同期開始 (${selectedCount}件)`}
          </button>
        </div>
      </div>
    </div>
  );
}
