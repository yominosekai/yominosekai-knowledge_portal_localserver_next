'use client';

import { useState, useEffect } from 'react';
import { getSyncStatus, smartSync, forceSync, SyncResult } from '../lib/sync';
import { useAuth } from '../contexts/AuthContext';

interface SyncContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onSyncComplete?: (syncedCount: number) => void; // 同期完了時に呼び出される
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

export function SyncContentModal({ isOpen, onClose, onSuccess, onSyncComplete }: SyncContentModalProps) {
  const { user } = useAuth();
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
           serverOnlyCount: 0,
           localOnlyCount: 0,
           bothCount: 0,
           totalSize: 0,
           details: {
             idMismatch: { server: 0, local: 0, total: 0 },
             timestampMismatch: { server: 0, local: 0, total: 0 }
           },
           errors: [] as string[]
         });

  useEffect(() => {
    if (isOpen) {
      // モーダルが開かれるたびに最新の状態を再計算
      console.log('[SyncContentModal] モーダルが開かれました - 最新状態を再計算中...');
      loadSyncStatus();
      loadContentItems();
    }
  }, [isOpen]);

  // モーダルが開いている間も定期的に状態を更新（5秒間隔）
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      console.log('[SyncContentModal] 定期更新 - 同期状態を再計算中...');
      loadSyncStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const loadSyncStatus = async () => {
    try {
      if (!user?.sid) {
        console.error('ユーザーIDが取得できません');
        return;
      }
      
      console.log('[SyncContentModal] 同期ステータスを再計算中...');
      // ブラウザキャッシュを回避するためにタイムスタンプ付きでAPIを呼び出し
      const response = await fetch(`/api/sync/status?userId=${encodeURIComponent(user.sid)}&t=${Date.now()}`);
      const data = await response.json();
      
      if (data.success) {
        const status = data.status;
        console.log('[SyncContentModal] 同期ステータス取得完了:', {
          isConnected: status.isConnected,
          syncedCount: status.syncedCount,
          localCount: status.localCount,
          serverOnlyCount: status.serverOnlyCount,
          localOnlyCount: status.localOnlyCount,
          bothCount: status.bothCount
        });
        setSyncInfo(status);
      } else {
        throw new Error(data.error || '同期ステータスの取得に失敗しました');
      }
    } catch (error) {
      console.error('同期ステータス取得エラー:', error);
    }
  };

  const loadContentItems = async () => {
    try {
      console.log('[SyncContentModal] コンテンツ一覧を再取得中...');
      const response = await fetch(`/api/content`);
      const data = await response.json();
      
      if (data.success) {
        const items: ContentItem[] = data.materials.map((material: any) => ({
          id: material.id,
          title: material.title,
          size: 0, // 実際のファイルサイズを取得する場合は別途APIが必要
          lastModified: material.updated_date || material.created_date,
          isSelected: true
        }));
        console.log(`[SyncContentModal] コンテンツ一覧取得完了: ${items.length}件`);
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
    console.log('[SyncContentModal] スマート同期開始 - モーダル状態:', { isOpen, isSyncing });
    setIsSyncing(true);
    setSyncProgress(0);
    setSyncMessage('スマート同期を開始しています...');
    setSyncDetails(null);

    try {
      // 1. 同期前の状態確認
      setSyncProgress(10);
      setSyncMessage('Zドライブの接続を確認中...');
      
      const statusResponse = await getSyncStatus(user?.sid || '');
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
        const message = syncResponse.syncedCount > 0 
          ? `同期完了: ${syncResponse.syncedCount}件同期, ${syncResponse.skippedCount}件スキップ`
          : `同期スキップ: ${syncResponse.skippedCount}件スキップ（同期不要）`;
        setSyncMessage(message);
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
        // 同期完了後に実際の同期ステータスを再取得
        console.log('[SyncModal] スマート同期完了 - 同期ステータスを再取得中...');
        try {
          const updatedStatus = await getSyncStatus(user?.sid || '');
          console.log('[SyncModal] 再取得した同期ステータス:', updatedStatus);
          console.log('[SyncModal] 詳細な内訳情報:', updatedStatus.details);
          setSyncInfo(prev => ({
            ...prev,
            ...updatedStatus,
            lastSync: now
          }));
        } catch (error) {
          console.error('[SyncModal] 同期ステータス再取得エラー:', error);
          // エラーの場合は手動で更新
          setSyncInfo(prev => ({
            ...prev,
            lastSync: now
          }));
        }

        // 同期完了を親コンポーネントに通知（非同期で実行）
        if (onSyncComplete) {
          console.log('[SyncContentModal] onSyncComplete コールバックを呼び出し中...');
          // 非同期で実行してモーダルが閉じられるのを防ぐ
          setTimeout(() => {
            console.log('[SyncContentModal] onSyncComplete 実行中...');
            onSyncComplete(syncResponse.syncedCount);
          }, 100);
        }
        
        // コンテンツ一覧の再読み込み（非同期で実行）
        if (onSuccess) {
          console.log('[SyncContentModal] onSuccess コールバックを呼び出し中...');
          // 非同期で実行してモーダルが閉じられるのを防ぐ
          setTimeout(() => {
            console.log('[SyncContentModal] onSuccess 実行中...');
            onSuccess();
          }, 200);
        }
        
        // 同期完了後は画面を閉じない（自動閉じるを削除）
        console.log('[SyncContentModal] スマート同期完了 - モーダル状態:', { isOpen, isSyncing: false });
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
        // 同期完了後に実際の同期ステータスを再取得
        console.log('[SyncModal] 強制同期完了 - 同期ステータスを再取得中...');
        try {
          const updatedStatus = await getSyncStatus(user?.sid || '');
          console.log('[SyncModal] 再取得した同期ステータス:', updatedStatus);
          console.log('[SyncModal] 詳細な内訳情報:', updatedStatus.details);
          setSyncInfo(prev => ({
            ...prev,
            ...updatedStatus,
            lastSync: now
          }));
        } catch (error) {
          console.error('[SyncModal] 同期ステータス再取得エラー:', error);
          // エラーの場合は手動で更新
          setSyncInfo(prev => ({
            ...prev,
            lastSync: now
          }));
        }

        // 同期完了を親コンポーネントに通知
        if (onSyncComplete) {
          onSyncComplete(syncResponse.syncedCount);
        }
        
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
                     
                     {/* 詳細な内訳情報 */}
                     {syncInfo.details && (
                       <div className="mt-3 p-3 bg-gray-700/50 rounded-lg">
                         <h4 className="text-sm font-medium text-white mb-2">内訳</h4>
                         <div className="space-y-1 text-xs text-white/70">
                           <div className="flex items-center justify-between">
                             <span>ID不一致:</span>
                             <span className={syncInfo.details.idMismatch.total > 0 ? "text-yellow-400" : "text-green-400"}>
                               {syncInfo.details.idMismatch.total}件（サーバー{syncInfo.details.idMismatch.server}件、ローカル{syncInfo.details.idMismatch.local}件）
                             </span>
                           </div>
                           <div className="flex items-center justify-between">
                             <span>更新日時不一致:</span>
                             <span className={syncInfo.details.timestampMismatch.total > 0 ? "text-orange-400" : "text-green-400"}>
                               {syncInfo.details.timestampMismatch.total}件（サーバー{syncInfo.details.timestampMismatch.server}件、ローカル{syncInfo.details.timestampMismatch.local}件）
                             </span>
                           </div>
                         </div>
                       </div>
                     )}
                     
                     {/* ローカルのみのコンテンツがある場合の警告 */}
                     {syncInfo.localOnlyCount > 0 && (
                       <div className="mt-3 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                         <div className="flex items-center gap-2">
                           <span className="text-yellow-400 text-lg">⚠️</span>
                           <span className="text-yellow-300 text-sm font-medium">
                             ※現在ローカルからの同期はできません。
                           </span>
                         </div>
                         <div className="text-yellow-200/80 text-xs mt-1">
                           ローカルのみのコンテンツ {syncInfo.localOnlyCount}件が検出されました。
                         </div>
                       </div>
                     )}
                     
                     <div className="flex items-center justify-between">
                       <span>同期状況:</span>
                       <span className={`${
                         (() => {
                           const isSynced = syncInfo.bothCount > 0 && 
                                          syncInfo.details.idMismatch.total === 0 && 
                                          syncInfo.details.timestampMismatch.total === 0;
                           const partialSync = syncInfo.bothCount > 0 && (syncInfo.details.idMismatch.total > 0 || syncInfo.details.timestampMismatch.total > 0);
                           const needsSync = syncInfo.details.idMismatch.total > 0 || 
                                           syncInfo.details.timestampMismatch.total > 0 ||
                                           (syncInfo.serverOnlyCount > 0 && syncInfo.localOnlyCount === 0) ||
                                           (syncInfo.localOnlyCount > 0 && syncInfo.serverOnlyCount === 0);
                           
                           if (isSynced) return 'text-green-400';
                           if (partialSync) return 'text-blue-400';
                           if (needsSync) return 'text-yellow-400';
                           return 'text-gray-400';
                         })()
                       }`}>
                         {(() => {
                           // 同期済み: 両方が1件以上、かつID不一致と更新日時不一致が0件
                           const isSynced = syncInfo.bothCount > 0 && 
                                          syncInfo.details.idMismatch.total === 0 && 
                                          syncInfo.details.timestampMismatch.total === 0;
                           
                           // 同期が必要: ID不一致または更新日時不一致がある、またはサーバーのみ・ローカルのみがある
                           const needsSync = syncInfo.details.idMismatch.total > 0 || 
                                           syncInfo.details.timestampMismatch.total > 0 ||
                                           (syncInfo.serverOnlyCount > 0 && syncInfo.localOnlyCount === 0) ||
                                           (syncInfo.localOnlyCount > 0 && syncInfo.serverOnlyCount === 0);
                           
                           // 部分同期: 両方があるが、まだ不一致がある
                           const partialSync = syncInfo.bothCount > 0 && (syncInfo.details.idMismatch.total > 0 || syncInfo.details.timestampMismatch.total > 0);
                           
                           const status = isSynced ? '同期済み' : 
                                        partialSync ? '部分同期' : 
                                        needsSync ? '同期が必要' : '未同期';
                           
                           console.log('[SyncModal] 同期状況判定:', {
                             serverOnlyCount: syncInfo.serverOnlyCount,
                             localOnlyCount: syncInfo.localOnlyCount,
                             bothCount: syncInfo.bothCount,
                             idMismatch: syncInfo.details.idMismatch.total,
                             timestampMismatch: syncInfo.details.timestampMismatch.total,
                             syncedCount: syncInfo.syncedCount,
                             localCount: syncInfo.localCount,
                             isSynced,
                             partialSync,
                             needsSync,
                             status
                           });
                           
                           return status;
                         })()}
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
                     syncDetails.syncedCount > 0
                       ? 'border-green-500/30 bg-green-500/10' 
                       : syncDetails.skippedCount > 0
                       ? 'border-yellow-500/30 bg-yellow-500/10'
                       : 'border-white/10'
                   }`}>
                     <h3 className="font-semibold text-white mb-2">
                       ファイル単位同期結果
                       {syncDetails.syncedCount > 0 && (
                         <span className="ml-2 text-green-400 text-sm">✓ 同期完了</span>
                       )}
                       {syncDetails.syncedCount === 0 && syncDetails.skippedCount > 0 && (
                         <span className="ml-2 text-yellow-400 text-sm">⚠ 同期スキップ</span>
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
