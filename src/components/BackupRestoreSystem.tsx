'use client';

import React, { useState, useEffect } from 'react';

interface BackupJob {
  id: string;
  name: string;
  type: 'full' | 'incremental' | 'differential';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  size: number;
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
  location: string;
  retentionDays: number;
}

interface RestoreJob {
  id: string;
  backupId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
  targetLocation: string;
}

interface BackupRestoreSystemProps {
  className?: string;
}

export function BackupRestoreSystem({ className = '' }: BackupRestoreSystemProps) {
  const [backupJobs, setBackupJobs] = useState<BackupJob[]>([]);
  const [restoreJobs, setRestoreJobs] = useState<RestoreJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [newBackup, setNewBackup] = useState<Partial<BackupJob>>({
    type: 'full',
    retentionDays: 30
  });
  const [selectedBackup, setSelectedBackup] = useState<BackupJob | null>(null);
  const [storageStats, setStorageStats] = useState({
    totalSpace: 0,
    usedSpace: 0,
    availableSpace: 0,
    backupCount: 0
  });

  useEffect(() => {
    loadBackupJobs();
    loadRestoreJobs();
    loadStorageStats();
  }, []);

  const loadBackupJobs = async () => {
    try {
      setLoading(true);
      // 実際のAPIからバックアップジョブを取得
      // const response = await fetch('/api/backup/jobs');
      // const data = await response.json();
      
      // モックデータ
      const mockBackupJobs: BackupJob[] = [
        {
          id: '1',
          name: 'フルバックアップ_20240115',
          type: 'full',
          status: 'completed',
          progress: 100,
          size: 2.5 * 1024 * 1024 * 1024, // 2.5GB
          createdAt: '2024-01-15T02:00:00Z',
          completedAt: '2024-01-15T03:30:00Z',
          location: '/backups/full_20240115.tar.gz',
          retentionDays: 30
        },
        {
          id: '2',
          name: '増分バックアップ_20240116',
          type: 'incremental',
          status: 'completed',
          progress: 100,
          size: 150 * 1024 * 1024, // 150MB
          createdAt: '2024-01-16T02:00:00Z',
          completedAt: '2024-01-16T02:15:00Z',
          location: '/backups/incremental_20240116.tar.gz',
          retentionDays: 7
        },
        {
          id: '3',
          name: 'フルバックアップ_20240117',
          type: 'full',
          status: 'running',
          progress: 65,
          size: 0,
          createdAt: '2024-01-17T02:00:00Z',
          location: '/backups/full_20240117.tar.gz',
          retentionDays: 30
        },
        {
          id: '4',
          name: '差分バックアップ_20240114',
          type: 'differential',
          status: 'failed',
          progress: 0,
          size: 0,
          createdAt: '2024-01-14T02:00:00Z',
          errorMessage: 'ディスク容量不足',
          location: '/backups/differential_20240114.tar.gz',
          retentionDays: 7
        }
      ];
      
      setBackupJobs(mockBackupJobs);
    } catch (error) {
      console.error('バックアップジョブの読み込みに失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRestoreJobs = async () => {
    try {
      // 実際のAPIから復元ジョブを取得
      // const response = await fetch('/api/restore/jobs');
      // const data = await response.json();
      
      // モックデータ
      const mockRestoreJobs: RestoreJob[] = [
        {
          id: '1',
          backupId: '1',
          status: 'completed',
          progress: 100,
          createdAt: '2024-01-15T10:00:00Z',
          completedAt: '2024-01-15T10:45:00Z',
          targetLocation: '/restore/20240115_100000'
        },
        {
          id: '2',
          backupId: '2',
          status: 'running',
          progress: 30,
          createdAt: '2024-01-17T14:30:00Z',
          targetLocation: '/restore/20240117_143000'
        }
      ];
      
      setRestoreJobs(mockRestoreJobs);
    } catch (error) {
      console.error('復元ジョブの読み込みに失敗:', error);
    }
  };

  const loadStorageStats = async () => {
    try {
      // 実際のAPIからストレージ統計を取得
      // const response = await fetch('/api/backup/storage-stats');
      // const data = await response.json();
      
      // モックデータ
      const mockStats = {
        totalSpace: 100 * 1024 * 1024 * 1024, // 100GB
        usedSpace: 25 * 1024 * 1024 * 1024, // 25GB
        availableSpace: 75 * 1024 * 1024 * 1024, // 75GB
        backupCount: 12
      };
      
      setStorageStats(mockStats);
    } catch (error) {
      console.error('ストレージ統計の読み込みに失敗:', error);
    }
  };

  const handleCreateBackup = async () => {
    try {
      const response = await fetch('/api/backup/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newBackup)
      });

      if (response.ok) {
        alert('バックアップジョブを作成しました');
        setShowBackupModal(false);
        setNewBackup({ type: 'full', retentionDays: 30 });
        loadBackupJobs();
      } else {
        throw new Error('バックアップジョブの作成に失敗しました');
      }
    } catch (error) {
      console.error('バックアップ作成エラー:', error);
      alert('バックアップジョブの作成に失敗しました');
    }
  };

  const handleStartRestore = async (backupId: string) => {
    try {
      const response = await fetch('/api/restore/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ backupId })
      });

      if (response.ok) {
        alert('復元ジョブを開始しました');
        setShowRestoreModal(false);
        loadRestoreJobs();
      } else {
        throw new Error('復元ジョブの開始に失敗しました');
      }
    } catch (error) {
      console.error('復元開始エラー:', error);
      alert('復元ジョブの開始に失敗しました');
    }
  };

  const handleCancelJob = async (jobId: string, type: 'backup' | 'restore') => {
    if (!confirm('ジョブをキャンセルしますか？')) return;

    try {
      const endpoint = type === 'backup' ? `/api/backup/${jobId}/cancel` : `/api/restore/${jobId}/cancel`;
      const response = await fetch(endpoint, {
        method: 'POST'
      });

      if (response.ok) {
        alert('ジョブをキャンセルしました');
        if (type === 'backup') {
          loadBackupJobs();
        } else {
          loadRestoreJobs();
        }
      } else {
        throw new Error('ジョブのキャンセルに失敗しました');
      }
    } catch (error) {
      console.error('ジョブキャンセルエラー:', error);
      alert('ジョブのキャンセルに失敗しました');
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    if (!confirm('バックアップを削除しますか？')) return;

    try {
      const response = await fetch(`/api/backup/${backupId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('バックアップを削除しました');
        loadBackupJobs();
      } else {
        throw new Error('バックアップの削除に失敗しました');
      }
    } catch (error) {
      console.error('バックアップ削除エラー:', error);
      alert('バックアップの削除に失敗しました');
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-400/20';
      case 'running': return 'text-blue-400 bg-blue-400/20';
      case 'pending': return 'text-yellow-400 bg-yellow-400/20';
      case 'failed': return 'text-red-400 bg-red-400/20';
      case 'cancelled': return 'text-gray-400 bg-gray-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'full': return '💾';
      case 'incremental': return '📈';
      case 'differential': return '📊';
      default: return '💾';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'full': return 'フルバックアップ';
      case 'incremental': return '増分バックアップ';
      case 'differential': return '差分バックアップ';
      default: return 'バックアップ';
    }
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-64 ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">バックアップ・復元システム</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBackupModal(true)}
            className="px-4 py-2 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
          >
            バックアップ作成
          </button>
          <button
            onClick={() => setShowRestoreModal(true)}
            className="px-4 py-2 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
          >
            復元実行
          </button>
        </div>
      </div>

      {/* ストレージ統計 */}
      <div className="rounded-lg bg-white/5 p-6 ring-1 ring-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">ストレージ統計</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{formatBytes(storageStats.totalSpace)}</div>
            <div className="text-white/70 text-sm">総容量</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">{formatBytes(storageStats.usedSpace)}</div>
            <div className="text-white/70 text-sm">使用済み</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{formatBytes(storageStats.availableSpace)}</div>
            <div className="text-white/70 text-sm">利用可能</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">{storageStats.backupCount}</div>
            <div className="text-white/70 text-sm">バックアップ数</div>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-white/70">使用率</span>
            <span className="text-white/70">
              {((storageStats.usedSpace / storageStats.totalSpace) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-yellow-400 to-red-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(storageStats.usedSpace / storageStats.totalSpace) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* バックアップジョブ一覧 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">バックアップジョブ</h3>
        
        <div className="space-y-3">
          {backupJobs.map((job) => (
            <div
              key={job.id}
              className="rounded-lg bg-white/5 p-6 ring-1 ring-white/10 hover:ring-white/20 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getTypeIcon(job.type)}</span>
                  <div>
                    <h4 className="text-white font-semibold">{job.name}</h4>
                    <p className="text-white/70 text-sm">{getTypeLabel(job.type)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(job.status)}`}>
                    {job.status}
                  </span>
                  {job.size > 0 && (
                    <span className="text-white/50 text-sm">{formatBytes(job.size)}</span>
                  )}
                </div>
              </div>
              
              {/* プログレスバー */}
              {job.status === 'running' && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-white/70">進行状況</span>
                    <span className="text-white/70">{job.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>
                </div>
              )}
              
              {/* エラーメッセージ */}
              {job.errorMessage && (
                <div className="mb-4 p-3 rounded bg-red-500/10 text-red-400 text-sm">
                  {job.errorMessage}
                </div>
              )}
              
              {/* 詳細情報 */}
              <div className="flex items-center justify-between text-sm text-white/50 mb-4">
                <div className="flex items-center gap-4">
                  <span>作成: {new Date(job.createdAt).toLocaleString('ja-JP')}</span>
                  {job.completedAt && (
                    <span>完了: {new Date(job.completedAt).toLocaleString('ja-JP')}</span>
                  )}
                  <span>保持期間: {job.retentionDays}日</span>
                </div>
                <span>{job.location}</span>
              </div>
              
              {/* アクション */}
              <div className="flex gap-2">
                {job.status === 'running' && (
                  <button
                    onClick={() => handleCancelJob(job.id, 'backup')}
                    className="px-3 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm"
                  >
                    キャンセル
                  </button>
                )}
                
                {job.status === 'completed' && (
                  <button
                    onClick={() => {
                      setSelectedBackup(job);
                      setShowRestoreModal(true);
                    }}
                    className="px-3 py-1 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors text-sm"
                  >
                    復元
                  </button>
                )}
                
                <button
                  onClick={() => handleDeleteBackup(job.id)}
                  className="px-3 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm"
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 復元ジョブ一覧 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">復元ジョブ</h3>
        
        <div className="space-y-3">
          {restoreJobs.map((job) => (
            <div
              key={job.id}
              className="rounded-lg bg-white/5 p-6 ring-1 ring-white/10 hover:ring-white/20 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔄</span>
                  <div>
                    <h4 className="text-white font-semibold">復元ジョブ #{job.id}</h4>
                    <p className="text-white/70 text-sm">バックアップID: {job.backupId}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(job.status)}`}>
                  {job.status}
                </span>
              </div>
              
              {/* プログレスバー */}
              {job.status === 'running' && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-white/70">進行状況</span>
                    <span className="text-white/70">{job.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>
                </div>
              )}
              
              {/* エラーメッセージ */}
              {job.errorMessage && (
                <div className="mb-4 p-3 rounded bg-red-500/10 text-red-400 text-sm">
                  {job.errorMessage}
                </div>
              )}
              
              {/* 詳細情報 */}
              <div className="flex items-center justify-between text-sm text-white/50">
                <div className="flex items-center gap-4">
                  <span>開始: {new Date(job.createdAt).toLocaleString('ja-JP')}</span>
                  {job.completedAt && (
                    <span>完了: {new Date(job.completedAt).toLocaleString('ja-JP')}</span>
                  )}
                </div>
                <span>復元先: {job.targetLocation}</span>
              </div>
              
              {/* アクション */}
              {job.status === 'running' && (
                <div className="mt-4">
                  <button
                    onClick={() => handleCancelJob(job.id, 'restore')}
                    className="px-3 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm"
                  >
                    キャンセル
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* バックアップ作成モーダル */}
      {showBackupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">バックアップ作成</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  バックアップ名
                </label>
                <input
                  type="text"
                  value={newBackup.name || ''}
                  onChange={(e) => setNewBackup({...newBackup, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  バックアップタイプ
                </label>
                <select
                  value={newBackup.type || 'full'}
                  onChange={(e) => setNewBackup({...newBackup, type: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="full">フルバックアップ</option>
                  <option value="incremental">増分バックアップ</option>
                  <option value="differential">差分バックアップ</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  保持期間（日）
                </label>
                <input
                  type="number"
                  value={newBackup.retentionDays || 30}
                  onChange={(e) => setNewBackup({...newBackup, retentionDays: parseInt(e.target.value)})}
                  min="1"
                  max="365"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowBackupModal(false)}
                className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleCreateBackup}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
              >
                作成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 復元実行モーダル */}
      {showRestoreModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">復元実行</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  復元先ディレクトリ
                </label>
                <input
                  type="text"
                  placeholder="/restore/backup_restore"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {selectedBackup && (
                <div className="p-3 bg-gray-50 rounded-md">
                  <h4 className="font-medium text-gray-800 mb-2">選択されたバックアップ</h4>
                  <p className="text-sm text-gray-600">{selectedBackup.name}</p>
                  <p className="text-sm text-gray-500">
                    {getTypeLabel(selectedBackup.type)} • {formatBytes(selectedBackup.size)} • 
                    {new Date(selectedBackup.createdAt).toLocaleString('ja-JP')}
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowRestoreModal(false)}
                className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={() => selectedBackup && handleStartRestore(selectedBackup.id)}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                復元開始
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


