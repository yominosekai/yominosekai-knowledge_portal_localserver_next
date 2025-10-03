'use client';

import React, { useState, useEffect } from 'react';

interface ContentVersion {
  id: string;
  version: string;
  title: string;
  description: string;
  content: string;
  changes: string;
  createdBy: string;
  createdAt: string;
  isCurrent: boolean;
  fileSize: number;
  checksum: string;
}

interface ContentVersioningProps {
  contentId: string;
  className?: string;
}

export function ContentVersioning({ contentId, className = '' }: ContentVersioningProps) {
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<ContentVersion | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [compareVersion1, setCompareVersion1] = useState<string>('');
  const [compareVersion2, setCompareVersion2] = useState<string>('');
  const [showCreateVersionModal, setShowCreateVersionModal] = useState(false);
  const [newVersionData, setNewVersionData] = useState({
    changes: '',
    description: ''
  });

  useEffect(() => {
    loadVersions();
  }, [contentId]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      // 実際のAPIからバージョンを取得
      // const response = await fetch(`/api/content/${contentId}/versions`);
      // const data = await response.json();
      
      // モックデータ
      const mockVersions: ContentVersion[] = [
        {
          id: '1',
          version: '1.0.0',
          title: 'React入門 - 初回版',
          description: 'Reactの基本的な概念を学習するコンテンツ',
          content: '# React入門\n\n## 概要\nReactは...',
          changes: '初回作成',
          createdBy: 'admin',
          createdAt: '2024-01-01T00:00:00Z',
          isCurrent: false,
          fileSize: 2048,
          checksum: 'abc123def456'
        },
        {
          id: '2',
          version: '1.1.0',
          title: 'React入門 - 更新版',
          description: 'Reactの基本的な概念を学習するコンテンツ（更新版）',
          content: '# React入門\n\n## 概要\nReactは...\n\n## 新機能\n- Hooksの説明を追加',
          changes: 'Hooksの説明を追加、例を更新',
          createdBy: 'instructor1',
          createdAt: '2024-01-15T10:30:00Z',
          isCurrent: false,
          fileSize: 2560,
          checksum: 'def456ghi789'
        },
        {
          id: '3',
          version: '1.2.0',
          title: 'React入門 - 最新版',
          description: 'Reactの基本的な概念を学習するコンテンツ（最新版）',
          content: '# React入門\n\n## 概要\nReactは...\n\n## 新機能\n- Hooksの説明を追加\n- TypeScript対応を追加',
          changes: 'TypeScript対応を追加、コード例を更新',
          createdBy: 'instructor1',
          createdAt: '2024-01-20T14:15:00Z',
          isCurrent: true,
          fileSize: 3072,
          checksum: 'ghi789jkl012'
        }
      ];
      
      setVersions(mockVersions);
    } catch (error) {
      console.error('バージョンの読み込みに失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVersion = async () => {
    try {
      const response = await fetch(`/api/content/${contentId}/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newVersionData)
      });

      if (response.ok) {
        alert('新しいバージョンを作成しました');
        setShowCreateVersionModal(false);
        setNewVersionData({ changes: '', description: '' });
        loadVersions();
      } else {
        throw new Error('バージョンの作成に失敗しました');
      }
    } catch (error) {
      console.error('バージョン作成エラー:', error);
      alert('バージョンの作成に失敗しました');
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    if (!confirm('このバージョンに復元しますか？')) return;

    try {
      const response = await fetch(`/api/content/${contentId}/versions/${versionId}/restore`, {
        method: 'POST'
      });

      if (response.ok) {
        alert('バージョンを復元しました');
        loadVersions();
      } else {
        throw new Error('バージョンの復元に失敗しました');
      }
    } catch (error) {
      console.error('バージョン復元エラー:', error);
      alert('バージョンの復元に失敗しました');
    }
  };

  const handleDeleteVersion = async (versionId: string) => {
    if (!confirm('このバージョンを削除しますか？')) return;

    try {
      const response = await fetch(`/api/content/${contentId}/versions/${versionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('バージョンを削除しました');
        loadVersions();
      } else {
        throw new Error('バージョンの削除に失敗しました');
      }
    } catch (error) {
      console.error('バージョン削除エラー:', error);
      alert('バージョンの削除に失敗しました');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getVersionColor = (version: ContentVersion) => {
    if (version.isCurrent) return 'text-green-400 bg-green-400/20';
    return 'text-blue-400 bg-blue-400/20';
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
        <h2 className="text-xl font-semibold text-white">コンテンツバージョン管理</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateVersionModal(true)}
            className="px-4 py-2 rounded bg-brand text-white hover:bg-brand-dark transition-colors"
          >
            新しいバージョン
          </button>
          <button
            onClick={() => setShowDiff(true)}
            className="px-4 py-2 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
          >
            差分比較
          </button>
        </div>
      </div>

      {/* バージョン一覧 */}
      <div className="space-y-4">
        {versions.map((version) => (
          <div
            key={version.id}
            className={`rounded-lg p-6 ring-1 transition-colors ${
              version.isCurrent 
                ? 'bg-green-500/10 ring-green-500/20' 
                : 'bg-white/5 ring-white/10 hover:ring-white/20'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded text-sm font-medium ${getVersionColor(version)}`}>
                  v{version.version}
                </span>
                {version.isCurrent && (
                  <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-400">
                    現在のバージョン
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedVersion(version)}
                  className="px-3 py-1 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors text-sm"
                >
                  詳細
                </button>
                {!version.isCurrent && (
                  <button
                    onClick={() => handleRestoreVersion(version.id)}
                    className="px-3 py-1 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors text-sm"
                  >
                    復元
                  </button>
                )}
                <button
                  onClick={() => handleDeleteVersion(version.id)}
                  className="px-3 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm"
                >
                  削除
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-white font-semibold">{version.title}</h3>
              <p className="text-white/70 text-sm">{version.description}</p>
              <p className="text-white/50 text-sm">変更内容: {version.changes}</p>
            </div>

            <div className="flex items-center justify-between mt-4 text-sm text-white/50">
              <div className="flex items-center gap-4">
                <span>作成者: {version.createdBy}</span>
                <span>作成日: {new Date(version.createdAt).toLocaleDateString('ja-JP')}</span>
                <span>サイズ: {formatFileSize(version.fileSize)}</span>
              </div>
              <span>チェックサム: {version.checksum}</span>
            </div>
          </div>
        ))}
      </div>

      {versions.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📝</div>
          <p className="text-white/70">バージョンがありません</p>
        </div>
      )}

      {/* バージョン詳細モーダル */}
      {selectedVersion && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  v{selectedVersion.version} - {selectedVersion.title}
                </h2>
                <p className="text-gray-600 mt-1">{selectedVersion.description}</p>
              </div>
              <button
                onClick={() => setSelectedVersion(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">変更内容</h3>
                  <p className="text-gray-600">{selectedVersion.changes}</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">コンテンツ</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedVersion.content}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 新しいバージョン作成モーダル */}
      {showCreateVersionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">新しいバージョンを作成</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  変更内容
                </label>
                <textarea
                  value={newVersionData.changes}
                  onChange={(e) => setNewVersionData({...newVersionData, changes: e.target.value})}
                  placeholder="このバージョンでの変更内容を記述してください"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  説明
                </label>
                <input
                  type="text"
                  value={newVersionData.description}
                  onChange={(e) => setNewVersionData({...newVersionData, description: e.target.value})}
                  placeholder="バージョンの説明"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateVersionModal(false)}
                className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleCreateVersion}
                className="px-4 py-2 bg-brand text-white rounded-md hover:bg-brand-dark transition-colors"
              >
                作成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 差分比較モーダル */}
      {showDiff && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-800">バージョン差分比較</h2>
              <button
                onClick={() => setShowDiff(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    比較元バージョン
                  </label>
                  <select
                    value={compareVersion1}
                    onChange={(e) => setCompareVersion1(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">選択してください</option>
                    {versions.map(version => (
                      <option key={version.id} value={version.id}>
                        v{version.version} - {version.title}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    比較先バージョン
                  </label>
                  <select
                    value={compareVersion2}
                    onChange={(e) => setCompareVersion2(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">選択してください</option>
                    {versions.map(version => (
                      <option key={version.id} value={version.id}>
                        v{version.version} - {version.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {compareVersion1 && compareVersion2 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">差分結果</h3>
                  <div className="bg-white rounded p-4 border">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {/* 実際の差分表示ロジックをここに実装 */}
                      {versions.find(v => v.id === compareVersion1)?.content}
                      {'\n\n--- 差分 ---\n'}
                      {versions.find(v => v.id === compareVersion2)?.content}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



