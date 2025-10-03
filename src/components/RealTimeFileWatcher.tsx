'use client';

import React, { useState, useEffect, useRef } from 'react';

interface FileChangeEvent {
  id: string;
  type: 'created' | 'modified' | 'deleted' | 'moved';
  path: string;
  oldPath?: string;
  timestamp: string;
  size?: number;
  hash?: string;
}

interface WatchedDirectory {
  id: string;
  path: string;
  recursive: boolean;
  status: 'watching' | 'paused' | 'error';
  lastScan: string;
  fileCount: number;
  filters: string[];
}

interface RealTimeFileWatcherProps {
  className?: string;
}

export function RealTimeFileWatcher({ className = '' }: RealTimeFileWatcherProps) {
  const [watchedDirectories, setWatchedDirectories] = useState<WatchedDirectory[]>([]);
  const [fileChanges, setFileChanges] = useState<FileChangeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDirectoryModal, setShowDirectoryModal] = useState(false);
  const [editingDirectory, setEditingDirectory] = useState<WatchedDirectory | null>(null);
  const [newDirectory, setNewDirectory] = useState<Partial<WatchedDirectory>>({
    recursive: true,
    status: 'watching',
    filters: ['*']
  });
  const [isWatching, setIsWatching] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadWatchedDirectories();
    loadFileChanges();
    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  const connectWebSocket = () => {
    try {
      const ws = new WebSocket('ws://localhost:3001/ws/file-watcher');
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('ファイル監視WebSocket接続確立');
        setConnectionStatus('connected');
        setIsWatching(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'file_change') {
            handleFileChange(data);
          } else if (data.type === 'directory_status') {
            handleDirectoryStatusUpdate(data);
          }
        } catch (error) {
          console.error('WebSocketメッセージ解析エラー:', error);
        }
      };

      ws.onclose = () => {
        console.log('ファイル監視WebSocket接続切断');
        setConnectionStatus('disconnected');
        setIsWatching(false);
        
        // 5秒後に再接続を試行
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 5000);
      };

      ws.onerror = (error) => {
        console.error('ファイル監視WebSocketエラー:', error);
        setConnectionStatus('error');
        setIsWatching(false);
      };
    } catch (error) {
      console.error('WebSocket接続エラー:', error);
      setConnectionStatus('error');
    }
  };

  const handleFileChange = (change: FileChangeEvent) => {
    setFileChanges(prev => [change, ...prev.slice(0, 99)]); // 最新100件を保持
  };

  const handleDirectoryStatusUpdate = (data: any) => {
    setWatchedDirectories(prev => 
      prev.map(dir => 
        dir.id === data.directoryId 
          ? { ...dir, ...data.updates }
          : dir
      )
    );
  };

  const loadWatchedDirectories = async () => {
    try {
      setLoading(true);
      // 実際のAPIから監視ディレクトリを取得
      // const response = await fetch('/api/file-watcher/directories');
      // const data = await response.json();
      
      // モックデータ
      const mockDirectories: WatchedDirectory[] = [
        {
          id: '1',
          path: '/data/content',
          recursive: true,
          status: 'watching',
          lastScan: '2024-01-15T10:30:00Z',
          fileCount: 1250,
          filters: ['*.pdf', '*.docx', '*.pptx', '*.mp4']
        },
        {
          id: '2',
          path: '\\\\server\\shared\\knowledge',
          recursive: true,
          status: 'watching',
          lastScan: '2024-01-15T10:25:00Z',
          fileCount: 3420,
          filters: ['*']
        },
        {
          id: '3',
          path: '/data/temp',
          recursive: false,
          status: 'paused',
          lastScan: '2024-01-15T09:15:00Z',
          fileCount: 45,
          filters: ['*.tmp', '*.log']
        }
      ];
      
      setWatchedDirectories(mockDirectories);
    } catch (error) {
      console.error('監視ディレクトリの読み込みに失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFileChanges = async () => {
    try {
      // 実際のAPIからファイル変更履歴を取得
      // const response = await fetch('/api/file-watcher/changes');
      // const data = await response.json();
      
      // モックデータ
      const mockChanges: FileChangeEvent[] = [
        {
          id: '1',
          type: 'created',
          path: '/data/content/new-document.pdf',
          timestamp: '2024-01-15T10:30:00Z',
          size: 2048576,
          hash: 'abc123def456'
        },
        {
          id: '2',
          type: 'modified',
          path: '/data/content/existing-presentation.pptx',
          timestamp: '2024-01-15T10:25:00Z',
          size: 5242880,
          hash: 'def456ghi789'
        },
        {
          id: '3',
          type: 'deleted',
          path: '/data/content/old-file.txt',
          timestamp: '2024-01-15T10:20:00Z'
        },
        {
          id: '4',
          type: 'moved',
          path: '/data/content/renamed-file.docx',
          oldPath: '/data/content/old-name.docx',
          timestamp: '2024-01-15T10:15:00Z',
          size: 1024000,
          hash: 'ghi789jkl012'
        }
      ];
      
      setFileChanges(mockChanges);
    } catch (error) {
      console.error('ファイル変更履歴の読み込みに失敗:', error);
    }
  };

  const handleStartWatching = async (directoryId: string) => {
    try {
      const response = await fetch(`/api/file-watcher/directories/${directoryId}/start`, {
        method: 'POST'
      });

      if (response.ok) {
        alert('監視を開始しました');
        loadWatchedDirectories();
      } else {
        throw new Error('監視の開始に失敗しました');
      }
    } catch (error) {
      console.error('監視開始エラー:', error);
      alert('監視の開始に失敗しました');
    }
  };

  const handleStopWatching = async (directoryId: string) => {
    try {
      const response = await fetch(`/api/file-watcher/directories/${directoryId}/stop`, {
        method: 'POST'
      });

      if (response.ok) {
        alert('監視を停止しました');
        loadWatchedDirectories();
      } else {
        throw new Error('監視の停止に失敗しました');
      }
    } catch (error) {
      console.error('監視停止エラー:', error);
      alert('監視の停止に失敗しました');
    }
  };

  const handleSaveDirectory = async () => {
    try {
      const directoryData = editingDirectory || newDirectory;
      
      const response = await fetch('/api/file-watcher/directories', {
        method: editingDirectory ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(directoryData)
      });

      if (response.ok) {
        alert(`ディレクトリを${editingDirectory ? '更新' : '追加'}しました`);
        setShowDirectoryModal(false);
        setEditingDirectory(null);
        setNewDirectory({ recursive: true, status: 'watching', filters: ['*'] });
        loadWatchedDirectories();
      } else {
        throw new Error('ディレクトリの保存に失敗しました');
      }
    } catch (error) {
      console.error('ディレクトリ保存エラー:', error);
      alert('ディレクトリの保存に失敗しました');
    }
  };

  const handleDeleteDirectory = async (directoryId: string) => {
    if (!confirm('このディレクトリの監視を停止して削除しますか？')) return;

    try {
      const response = await fetch(`/api/file-watcher/directories/${directoryId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('ディレクトリを削除しました');
        loadWatchedDirectories();
      } else {
        throw new Error('ディレクトリの削除に失敗しました');
      }
    } catch (error) {
      console.error('ディレクトリ削除エラー:', error);
      alert('ディレクトリの削除に失敗しました');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'watching': return 'text-green-400 bg-green-400/20';
      case 'paused': return 'text-yellow-400 bg-yellow-400/20';
      case 'error': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getChangeTypeIcon = (type: string) => {
    switch (type) {
      case 'created': return '➕';
      case 'modified': return '✏️';
      case 'deleted': return '🗑️';
      case 'moved': return '📁';
      default: return '📄';
    }
  };

  const getChangeTypeColor = (type: string) => {
    switch (type) {
      case 'created': return 'text-green-400';
      case 'modified': return 'text-blue-400';
      case 'deleted': return 'text-red-400';
      case 'moved': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-white">リアルタイムファイル監視</h2>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' :
              connectionStatus === 'error' ? 'bg-red-500' : 'bg-gray-500'
            }`}></div>
            <span className="text-white/70 text-sm">
              {connectionStatus === 'connected' ? '接続中' :
               connectionStatus === 'error' ? 'エラー' : '切断中'}
            </span>
          </div>
        </div>
        <button
          onClick={() => setShowDirectoryModal(true)}
          className="px-4 py-2 rounded bg-brand text-white hover:bg-brand-dark transition-colors"
        >
          ディレクトリ追加
        </button>
      </div>

      {/* 監視ディレクトリ一覧 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">監視ディレクトリ</h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          {watchedDirectories.map((directory) => (
            <div
              key={directory.id}
              className="rounded-lg bg-white/5 p-6 ring-1 ring-white/10 hover:ring-white/20 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📁</span>
                  <div>
                    <h4 className="font-semibold text-white">{directory.path}</h4>
                    <p className="text-white/70 text-sm">
                      {directory.recursive ? '再帰的監視' : '直接監視'} • {directory.fileCount}ファイル
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(directory.status)}`}>
                  {directory.status}
                </span>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/70">最終スキャン</span>
                  <span className="text-white/50">
                    {new Date(directory.lastScan).toLocaleString('ja-JP')}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/70">フィルター</span>
                  <span className="text-white/50">
                    {directory.filters.join(', ')}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                {directory.status === 'watching' ? (
                  <button
                    onClick={() => handleStopWatching(directory.id)}
                    className="flex-1 px-3 py-2 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm"
                  >
                    停止
                  </button>
                ) : (
                  <button
                    onClick={() => handleStartWatching(directory.id)}
                    className="flex-1 px-3 py-2 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors text-sm"
                  >
                    開始
                  </button>
                )}
                
                <button
                  onClick={() => {
                    setEditingDirectory(directory);
                    setShowDirectoryModal(true);
                  }}
                  className="px-3 py-2 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors text-sm"
                >
                  編集
                </button>
                
                <button
                  onClick={() => handleDeleteDirectory(directory.id)}
                  className="px-3 py-2 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm"
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ファイル変更履歴 */}
      <div className="rounded-lg bg-white/5 p-6 ring-1 ring-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">ファイル変更履歴</h3>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {fileChanges.map((change) => (
            <div
              key={change.id}
              className="flex items-center gap-3 p-3 rounded bg-black/20 hover:bg-black/30 transition-colors"
            >
              <span className="text-2xl">{getChangeTypeIcon(change.type)}</span>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-sm font-medium ${getChangeTypeColor(change.type)}`}>
                    {change.type}
                  </span>
                  <span className="text-white/70 text-sm truncate">
                    {change.path}
                  </span>
                </div>
                
                {change.oldPath && (
                  <p className="text-white/50 text-xs">
                    移動元: {change.oldPath}
                  </p>
                )}
                
                <div className="flex items-center gap-4 text-xs text-white/50">
                  <span>{new Date(change.timestamp).toLocaleString('ja-JP')}</span>
                  {change.size && (
                    <span>{formatFileSize(change.size)}</span>
                  )}
                  {change.hash && (
                    <span>ハッシュ: {change.hash.slice(0, 8)}...</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {fileChanges.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📄</div>
            <p className="text-white/70">ファイル変更がありません</p>
          </div>
        )}
      </div>

      {/* ディレクトリ管理モーダル */}
      {showDirectoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-800">
                {editingDirectory ? 'ディレクトリを編集' : '新しいディレクトリを追加'}
              </h2>
              <button
                onClick={() => {
                  setShowDirectoryModal(false);
                  setEditingDirectory(null);
                  setNewDirectory({ recursive: true, status: 'watching', filters: ['*'] });
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ディレクトリパス
                  </label>
                  <input
                    type="text"
                    value={editingDirectory?.path || newDirectory.path || ''}
                    onChange={(e) => {
                      if (editingDirectory) {
                        setEditingDirectory({...editingDirectory, path: e.target.value});
                      } else {
                        setNewDirectory({...newDirectory, path: e.target.value});
                      }
                    }}
                    placeholder="例: /data/content または \\\\server\\shared"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingDirectory?.recursive || newDirectory.recursive || false}
                    onChange={(e) => {
                      if (editingDirectory) {
                        setEditingDirectory({...editingDirectory, recursive: e.target.checked});
                      } else {
                        setNewDirectory({...newDirectory, recursive: e.target.checked});
                      }
                    }}
                    className="w-4 h-4 text-brand rounded focus:ring-brand"
                  />
                  <label className="text-sm text-gray-700">再帰的監視（サブディレクトリも含む）</label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ファイルフィルター
                  </label>
                  <input
                    type="text"
                    value={(editingDirectory?.filters || newDirectory.filters || ['*']).join(', ')}
                    onChange={(e) => {
                      const filters = e.target.value.split(',').map(f => f.trim()).filter(f => f);
                      if (editingDirectory) {
                        setEditingDirectory({...editingDirectory, filters});
                      } else {
                        setNewDirectory({...newDirectory, filters});
                      }
                    }}
                    placeholder="例: *.pdf, *.docx, *.mp4 (空白で全ファイル)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-gray-500 text-xs mt-1">
                    カンマ区切りで複数のパターンを指定できます。例: *.pdf, *.docx
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={() => {
                  setShowDirectoryModal(false);
                  setEditingDirectory(null);
                  setNewDirectory({ recursive: true, status: 'watching', filters: ['*'] });
                }}
                className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleSaveDirectory}
                className="px-4 py-2 bg-brand text-white rounded-md hover:bg-brand-dark transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



