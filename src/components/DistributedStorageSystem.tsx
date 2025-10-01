'use client';

import React, { useState, useEffect } from 'react';

interface StorageNode {
  id: string;
  name: string;
  type: 'local' | 'network' | 'cloud';
  status: 'online' | 'offline' | 'error';
  capacity: number;
  used: number;
  lastSync: string;
  location: string;
  priority: number;
}

interface SyncStatus {
  nodeId: string;
  status: 'syncing' | 'completed' | 'error' | 'pending';
  progress: number;
  lastSync: string;
  errorMessage?: string;
}

interface DistributedStorageSystemProps {
  className?: string;
}

export function DistributedStorageSystem({ className = '' }: DistributedStorageSystemProps) {
  const [storageNodes, setStorageNodes] = useState<StorageNode[]>([]);
  const [syncStatuses, setSyncStatuses] = useState<SyncStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNodeModal, setShowNodeModal] = useState(false);
  const [editingNode, setEditingNode] = useState<StorageNode | null>(null);
  const [newNode, setNewNode] = useState<Partial<StorageNode>>({
    type: 'local',
    status: 'online',
    priority: 1
  });
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadStorageNodes();
    loadSyncStatuses();
    
    // 定期的に同期ステータスを更新
    const interval = setInterval(loadSyncStatuses, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadStorageNodes = async () => {
    try {
      setLoading(true);
      // 実際のAPIからストレージノードを取得
      // const response = await fetch('/api/storage/nodes');
      // const data = await response.json();
      
      // モックデータ
      const mockNodes: StorageNode[] = [
        {
          id: '1',
          name: 'ローカルストレージ',
          type: 'local',
          status: 'online',
          capacity: 1000 * 1024 * 1024 * 1024, // 1TB
          used: 500 * 1024 * 1024 * 1024, // 500GB
          lastSync: '2024-01-15T10:30:00Z',
          location: '/data/local',
          priority: 1
        },
        {
          id: '2',
          name: 'Zドライブ（ネットワーク）',
          type: 'network',
          status: 'online',
          capacity: 5 * 1024 * 1024 * 1024 * 1024, // 5TB
          used: 2 * 1024 * 1024 * 1024 * 1024, // 2TB
          lastSync: '2024-01-15T10:25:00Z',
          location: '\\\\server\\shared\\knowledge',
          priority: 2
        },
        {
          id: '3',
          name: 'クラウドストレージ',
          type: 'cloud',
          status: 'online',
          capacity: 10 * 1024 * 1024 * 1024 * 1024, // 10TB
          used: 1 * 1024 * 1024 * 1024 * 1024, // 1TB
          lastSync: '2024-01-15T10:20:00Z',
          location: 's3://company-knowledge-bucket',
          priority: 3
        },
        {
          id: '4',
          name: 'バックアップストレージ',
          type: 'network',
          status: 'offline',
          capacity: 2 * 1024 * 1024 * 1024 * 1024, // 2TB
          used: 800 * 1024 * 1024 * 1024, // 800GB
          lastSync: '2024-01-14T15:30:00Z',
          location: '\\\\backup\\knowledge',
          priority: 4
        }
      ];
      
      setStorageNodes(mockNodes);
    } catch (error) {
      console.error('ストレージノードの読み込みに失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSyncStatuses = async () => {
    try {
      // 実際のAPIから同期ステータスを取得
      // const response = await fetch('/api/storage/sync-status');
      // const data = await response.json();
      
      // モックデータ
      const mockStatuses: SyncStatus[] = [
        {
          nodeId: '1',
          status: 'completed',
          progress: 100,
          lastSync: '2024-01-15T10:30:00Z'
        },
        {
          nodeId: '2',
          status: 'syncing',
          progress: 75,
          lastSync: '2024-01-15T10:25:00Z'
        },
        {
          nodeId: '3',
          status: 'completed',
          progress: 100,
          lastSync: '2024-01-15T10:20:00Z'
        },
        {
          nodeId: '4',
          status: 'error',
          progress: 0,
          lastSync: '2024-01-14T15:30:00Z',
          errorMessage: 'ネットワーク接続エラー'
        }
      ];
      
      setSyncStatuses(mockStatuses);
    } catch (error) {
      console.error('同期ステータスの読み込みに失敗:', error);
    }
  };

  const handleSyncAll = async () => {
    try {
      setIsSyncing(true);
      const response = await fetch('/api/storage/sync-all', {
        method: 'POST'
      });

      if (response.ok) {
        alert('全ノードの同期を開始しました');
        loadSyncStatuses();
      } else {
        throw new Error('同期の開始に失敗しました');
      }
    } catch (error) {
      console.error('同期エラー:', error);
      alert('同期の開始に失敗しました');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncNode = async (nodeId: string) => {
    try {
      const response = await fetch(`/api/storage/nodes/${nodeId}/sync`, {
        method: 'POST'
      });

      if (response.ok) {
        alert('ノードの同期を開始しました');
        loadSyncStatuses();
      } else {
        throw new Error('同期の開始に失敗しました');
      }
    } catch (error) {
      console.error('ノード同期エラー:', error);
      alert('同期の開始に失敗しました');
    }
  };

  const handleSaveNode = async () => {
    try {
      const nodeData = editingNode || newNode;
      
      const response = await fetch('/api/storage/nodes', {
        method: editingNode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(nodeData)
      });

      if (response.ok) {
        alert(`ノードを${editingNode ? '更新' : '作成'}しました`);
        setShowNodeModal(false);
        setEditingNode(null);
        setNewNode({ type: 'local', status: 'online', priority: 1 });
        loadStorageNodes();
      } else {
        throw new Error('ノードの保存に失敗しました');
      }
    } catch (error) {
      console.error('ノード保存エラー:', error);
      alert('ノードの保存に失敗しました');
    }
  };

  const handleDeleteNode = async (nodeId: string) => {
    if (!confirm('このノードを削除しますか？')) return;

    try {
      const response = await fetch(`/api/storage/nodes/${nodeId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('ノードを削除しました');
        loadStorageNodes();
      } else {
        throw new Error('ノードの削除に失敗しました');
      }
    } catch (error) {
      console.error('ノード削除エラー:', error);
      alert('ノードの削除に失敗しました');
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
      case 'online': return 'text-green-400 bg-green-400/20';
      case 'offline': return 'text-gray-400 bg-gray-400/20';
      case 'error': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-400/20';
      case 'syncing': return 'text-blue-400 bg-blue-400/20';
      case 'error': return 'text-red-400 bg-red-400/20';
      case 'pending': return 'text-yellow-400 bg-yellow-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'local': return '💾';
      case 'network': return '🌐';
      case 'cloud': return '☁️';
      default: return '📁';
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
        <h2 className="text-xl font-semibold text-white">分散ストレージシステム</h2>
        <div className="flex gap-2">
          <button
            onClick={handleSyncAll}
            disabled={isSyncing}
            className="px-4 py-2 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 disabled:opacity-50 transition-colors"
          >
            {isSyncing ? '同期中...' : '全ノード同期'}
          </button>
          <button
            onClick={() => setShowNodeModal(true)}
            className="px-4 py-2 rounded bg-brand text-white hover:bg-brand-dark transition-colors"
          >
            ノード追加
          </button>
        </div>
      </div>

      {/* ストレージノード一覧 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {storageNodes.map((node) => {
          const syncStatus = syncStatuses.find(s => s.nodeId === node.id);
          const usagePercentage = (node.used / node.capacity) * 100;
          
          return (
            <div
              key={node.id}
              className="rounded-lg bg-white/5 p-6 ring-1 ring-white/10 hover:ring-white/20 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getTypeIcon(node.type)}</span>
                  <div>
                    <h3 className="font-semibold text-white">{node.name}</h3>
                    <p className="text-white/70 text-sm">{node.location}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(node.status)}`}>
                  {node.status}
                </span>
              </div>
              
              {/* ストレージ使用量 */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/70">使用量</span>
                  <span className="text-white">{formatBytes(node.used)} / {formatBytes(node.capacity)}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      usagePercentage > 90 ? 'bg-red-500' :
                      usagePercentage > 75 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${usagePercentage}%` }}
                  />
                </div>
                <div className="text-white/50 text-xs text-center">
                  {usagePercentage.toFixed(1)}% 使用中
                </div>
              </div>

              {/* 同期ステータス */}
              {syncStatus && (
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/70">同期ステータス</span>
                    <span className={`px-2 py-1 rounded text-xs ${getSyncStatusColor(syncStatus.status)}`}>
                      {syncStatus.status}
                    </span>
                  </div>
                  
                  {syncStatus.status === 'syncing' && (
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${syncStatus.progress}%` }}
                      />
                    </div>
                  )}
                  
                  {syncStatus.errorMessage && (
                    <p className="text-red-400 text-xs">{syncStatus.errorMessage}</p>
                  )}
                  
                  <p className="text-white/50 text-xs">
                    最終同期: {new Date(syncStatus.lastSync).toLocaleString('ja-JP')}
                  </p>
                </div>
              )}

              {/* アクション */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleSyncNode(node.id)}
                  className="flex-1 px-3 py-2 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors text-sm"
                >
                  同期
                </button>
                <button
                  onClick={() => {
                    setEditingNode(node);
                    setShowNodeModal(true);
                  }}
                  className="px-3 py-2 rounded bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors text-sm"
                >
                  編集
                </button>
                <button
                  onClick={() => handleDeleteNode(node.id)}
                  className="px-3 py-2 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm"
                >
                  削除
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {storageNodes.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">💾</div>
          <p className="text-white/70">ストレージノードがありません</p>
        </div>
      )}

      {/* ノード管理モーダル */}
      {showNodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-800">
                {editingNode ? 'ノードを編集' : '新しいノードを追加'}
              </h2>
              <button
                onClick={() => {
                  setShowNodeModal(false);
                  setEditingNode(null);
                  setNewNode({ type: 'local', status: 'online', priority: 1 });
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
                    ノード名
                  </label>
                  <input
                    type="text"
                    value={editingNode?.name || newNode.name || ''}
                    onChange={(e) => {
                      if (editingNode) {
                        setEditingNode({...editingNode, name: e.target.value});
                      } else {
                        setNewNode({...newNode, name: e.target.value});
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    タイプ
                  </label>
                  <select
                    value={editingNode?.type || newNode.type || 'local'}
                    onChange={(e) => {
                      if (editingNode) {
                        setEditingNode({...editingNode, type: e.target.value as any});
                      } else {
                        setNewNode({...newNode, type: e.target.value as any});
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="local">ローカル</option>
                    <option value="network">ネットワーク</option>
                    <option value="cloud">クラウド</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    場所/パス
                  </label>
                  <input
                    type="text"
                    value={editingNode?.location || newNode.location || ''}
                    onChange={(e) => {
                      if (editingNode) {
                        setEditingNode({...editingNode, location: e.target.value});
                      } else {
                        setNewNode({...newNode, location: e.target.value});
                      }
                    }}
                    placeholder="例: /data/local または \\\\server\\shared"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    容量 (GB)
                  </label>
                  <input
                    type="number"
                    value={editingNode ? editingNode.capacity / (1024 * 1024 * 1024) : newNode.capacity ? newNode.capacity / (1024 * 1024 * 1024) : ''}
                    onChange={(e) => {
                      const capacityGB = parseFloat(e.target.value);
                      const capacityBytes = capacityGB * 1024 * 1024 * 1024;
                      if (editingNode) {
                        setEditingNode({...editingNode, capacity: capacityBytes});
                      } else {
                        setNewNode({...newNode, capacity: capacityBytes});
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    優先度
                  </label>
                  <input
                    type="number"
                    value={editingNode?.priority || newNode.priority || 1}
                    onChange={(e) => {
                      const priority = parseInt(e.target.value);
                      if (editingNode) {
                        setEditingNode({...editingNode, priority});
                      } else {
                        setNewNode({...newNode, priority});
                      }
                    }}
                    min="1"
                    max="10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={() => {
                  setShowNodeModal(false);
                  setEditingNode(null);
                  setNewNode({ type: 'local', status: 'online', priority: 1 });
                }}
                className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleSaveNode}
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


