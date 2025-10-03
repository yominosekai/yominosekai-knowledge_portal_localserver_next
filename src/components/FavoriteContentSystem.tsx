'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';

interface FavoriteContentSystemProps {
  contentId: string;
  userId: string;
  initialLiked?: boolean;
  initialLikeCount?: number;
  className?: string;
}

export function FavoriteContentSystem({ 
  contentId, 
  userId, 
  initialLiked = false, 
  initialLikeCount = 0,
  className = '' 
}: FavoriteContentSystemProps) {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLoading, setIsLoading] = useState(false);
  const [showBookmarkModal, setShowBookmarkModal] = useState(false);
  const [bookmarkFolders, setBookmarkFolders] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    loadBookmarkFolders();
  }, [userId]);

  const loadBookmarkFolders = async () => {
    try {
      // 実際のAPIからブックマークフォルダを取得
      // const response = await fetch(`/api/users/${userId}/bookmark-folders`);
      // const folders = await response.json();
      
      // モックデータ
      setBookmarkFolders(['お気に入り', '後で読む', '重要', '学習中']);
    } catch (error) {
      console.error('ブックマークフォルダの読み込みに失敗:', error);
    }
  };

  const handleLike = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const action = isLiked ? 'unlike' : 'like';
      const response = await fetch(`/api/content/${contentId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action
        })
      });

      if (response.ok) {
        const result = await response.json();
        setIsLiked(!isLiked);
        setLikeCount(result.likes?.length || likeCount + (isLiked ? -1 : 1));
      } else {
        throw new Error('いいねの更新に失敗しました');
      }
    } catch (error) {
      console.error('いいねエラー:', error);
      alert('いいねの更新に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (!selectedFolder && !newFolderName) {
      alert('フォルダを選択するか、新しいフォルダ名を入力してください');
      return;
    }

    try {
      const folderName = selectedFolder || newFolderName;
      const response = await fetch(`/api/users/${userId}/bookmarks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentId,
          folderName
        })
      });

      if (response.ok) {
        alert(`「${folderName}」フォルダにブックマークしました`);
        setShowBookmarkModal(false);
        setSelectedFolder('');
        setNewFolderName('');
      } else {
        throw new Error('ブックマークの追加に失敗しました');
      }
    } catch (error) {
      console.error('ブックマークエラー:', error);
      alert('ブックマークの追加に失敗しました');
    }
  };

  const createNewFolder = () => {
    if (newFolderName.trim()) {
      setBookmarkFolders(prev => [...prev, newFolderName.trim()]);
      setSelectedFolder(newFolderName.trim());
    }
  };

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* いいねボタン */}
      <button
        onClick={handleLike}
        disabled={isLoading}
        className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
          isLiked 
            ? 'bg-red-500 text-white hover:bg-red-600' 
            : 'bg-white/10 text-white/70 hover:bg-white/20'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
        ) : (
          <span className="text-lg">{isLiked ? '❤️' : '🤍'}</span>
        )}
        <span className="text-sm font-medium">
          {isLiked ? 'いいね済み' : 'いいね'}
        </span>
        {likeCount > 0 && (
          <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
            {likeCount}
          </span>
        )}
      </button>

      {/* ブックマークボタン */}
      <button
        onClick={() => setShowBookmarkModal(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-md bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
      >
        <span className="text-lg">🔖</span>
        <span className="text-sm font-medium">ブックマーク</span>
      </button>

      {/* ブックマークモーダル */}
      {showBookmarkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">ブックマークに追加</h3>
              <button
                onClick={() => setShowBookmarkModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* 既存フォルダ選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  フォルダを選択
                </label>
                <select
                  value={selectedFolder}
                  onChange={(e) => setSelectedFolder(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">フォルダを選択してください</option>
                  {bookmarkFolders.map(folder => (
                    <option key={folder} value={folder}>
                      {folder}
                    </option>
                  ))}
                </select>
              </div>

              {/* 新しいフォルダ作成 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  新しいフォルダを作成
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="フォルダ名を入力"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={createNewFolder}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    作成
                  </button>
                </div>
              </div>

              {/* ボタン */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowBookmarkModal(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleBookmark}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  ブックマーク
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



