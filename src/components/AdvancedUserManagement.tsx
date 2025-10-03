'use client';

import React, { useState, useEffect } from 'react';

interface User {
  id: string;
  sid: string;
  username: string;
  displayName: string;
  email: string;
  role: 'admin' | 'instructor' | 'student';
  department: string;
  isActive: boolean;
  lastLogin: string;
  createdAt: string;
  permissions: string[];
  profile: {
    bio?: string;
    skills: string[];
    avatar?: string;
  };
}

interface AdvancedUserManagementProps {
  className?: string;
}

export function AdvancedUserManagement({ className = '' }: AdvancedUserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'admin' | 'instructor' | 'student'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'role' | 'lastLogin' | 'createdAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      // 実際のAPIからユーザーを取得
      // const response = await fetch('/api/admin/users');
      // const data = await response.json();
      
      // モックデータ
      const mockUsers: User[] = [
        {
          id: '1',
          sid: 'S-1-5-21-1234567890-1234567890-1234567890-1001',
          username: 'admin',
          displayName: '管理者',
          email: 'admin@company.com',
          role: 'admin',
          department: 'IT部門',
          isActive: true,
          lastLogin: '2024-01-15T10:30:00Z',
          createdAt: '2024-01-01T00:00:00Z',
          permissions: ['user_management', 'content_management', 'system_settings'],
          profile: {
            bio: 'システム管理者',
            skills: ['システム管理', 'セキュリティ', 'ネットワーク'],
            avatar: ''
          }
        },
        {
          id: '2',
          sid: 'S-1-5-21-1234567890-1234567890-1234567890-1002',
          username: 'instructor1',
          displayName: '講師1',
          email: 'instructor1@company.com',
          role: 'instructor',
          department: '教育部門',
          isActive: true,
          lastLogin: '2024-01-15T09:15:00Z',
          createdAt: '2024-01-02T00:00:00Z',
          permissions: ['content_management', 'user_progress'],
          profile: {
            bio: 'プログラミング講師',
            skills: ['JavaScript', 'Python', 'React', 'Node.js'],
            avatar: ''
          }
        },
        {
          id: '3',
          sid: 'S-1-5-21-1234567890-1234567890-1234567890-1003',
          username: 'student1',
          displayName: '学習者1',
          email: 'student1@company.com',
          role: 'student',
          department: '営業部門',
          isActive: true,
          lastLogin: '2024-01-15T14:20:00Z',
          createdAt: '2024-01-03T00:00:00Z',
          permissions: ['content_view', 'progress_tracking'],
          profile: {
            bio: '営業担当',
            skills: ['営業', 'コミュニケーション'],
            avatar: ''
          }
        }
      ];
      
      setUsers(mockUsers);
    } catch (error) {
      console.error('ユーザーの読み込みに失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesFilter = filter === 'all' || 
      (filter === 'active' && user.isActive) ||
      (filter === 'inactive' && !user.isActive) ||
      (filter === 'admin' && user.role === 'admin') ||
      (filter === 'instructor' && user.role === 'instructor') ||
      (filter === 'student' && user.role === 'student');
    
    const matchesSearch = !searchTerm || 
      user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  }).sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    if (sortBy === 'lastLogin' || sortBy === 'createdAt') {
      aValue = new Date(aValue as string).getTime();
      bValue = new Date(bValue as string).getTime();
    }
    
    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const handleSelectUser = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) return;

    const actionMessages = {
      activate: '選択したユーザーを有効化しますか？',
      deactivate: '選択したユーザーを無効化しますか？',
      delete: '選択したユーザーを削除しますか？',
      export: '選択したユーザーをエクスポートしますか？',
      resetPassword: '選択したユーザーのパスワードをリセットしますか？'
    };

    if (actionMessages[action as keyof typeof actionMessages]) {
      if (!confirm(actionMessages[action as keyof typeof actionMessages])) return;
    }

    try {
      // 実際のAPI呼び出し
      await fetch('/api/admin/users/bulk-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          userIds: selectedUsers
        })
      });

      alert(`${action}が完了しました`);
      setSelectedUsers([]);
      loadUsers();
    } catch (error) {
      console.error('一括操作エラー:', error);
      alert('一括操作に失敗しました');
    }
  };

  const handleImportUsers = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/admin/users/import', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        alert('ユーザーのインポートが完了しました');
        loadUsers();
      } else {
        throw new Error('インポートに失敗しました');
      }
    } catch (error) {
      console.error('インポートエラー:', error);
      alert('インポートに失敗しました');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-red-400 bg-red-400/20';
      case 'instructor': return 'text-blue-400 bg-blue-400/20';
      case 'student': return 'text-green-400 bg-green-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'text-green-400 bg-green-400/20' : 'text-gray-400 bg-gray-400/20';
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
        <h2 className="text-xl font-semibold text-white">高度なユーザー管理</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
          >
            インポート
          </button>
          <button
            onClick={() => setShowUserModal(true)}
            className="px-4 py-2 rounded bg-brand text-white hover:bg-brand-dark transition-colors"
          >
            新規ユーザー
          </button>
        </div>
      </div>

      {/* フィルター・検索 */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'すべて' },
            { key: 'active', label: '有効' },
            { key: 'inactive', label: '無効' },
            { key: 'admin', label: '管理者' },
            { key: 'instructor', label: '講師' },
            { key: 'student', label: '学習者' }
          ].map(filterOption => (
            <button
              key={filterOption.key}
              onClick={() => setFilter(filterOption.key as any)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                filter === filterOption.key
                  ? 'bg-brand text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {filterOption.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="ユーザーを検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 min-w-64 rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white placeholder-white/40"
        />

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white"
        >
          <option value="name">名前</option>
          <option value="email">メール</option>
          <option value="role">役割</option>
          <option value="lastLogin">最終ログイン</option>
          <option value="createdAt">作成日</option>
        </select>

        <button
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="px-3 py-2 rounded bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          {sortOrder === 'asc' ? '↑' : '↓'}
        </button>
      </div>

      {/* 一括操作 */}
      {selectedUsers.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-brand/10 rounded-lg ring-1 ring-brand/20">
          <span className="text-white">
            {selectedUsers.length}件選択中
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkAction('activate')}
              className="px-3 py-1 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors text-sm"
            >
              有効化
            </button>
            <button
              onClick={() => handleBulkAction('deactivate')}
              className="px-3 py-1 rounded bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors text-sm"
            >
              無効化
            </button>
            <button
              onClick={() => handleBulkAction('export')}
              className="px-3 py-1 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors text-sm"
            >
              エクスポート
            </button>
            <button
              onClick={() => handleBulkAction('resetPassword')}
              className="px-3 py-1 rounded bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors text-sm"
            >
              パスワードリセット
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              className="px-3 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm"
            >
              削除
            </button>
          </div>
        </div>
      )}

      {/* ユーザー一覧 */}
      <div className="rounded-lg bg-white/5 ring-1 ring-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-brand rounded focus:ring-brand"
                  />
                </th>
                <th className="px-4 py-3 text-left text-white/70 font-medium">ユーザー</th>
                <th className="px-4 py-3 text-left text-white/70 font-medium">役割</th>
                <th className="px-4 py-3 text-left text-white/70 font-medium">部門</th>
                <th className="px-4 py-3 text-left text-white/70 font-medium">ステータス</th>
                <th className="px-4 py-3 text-left text-white/70 font-medium">最終ログイン</th>
                <th className="px-4 py-3 text-left text-white/70 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-t border-white/10 hover:bg-white/5">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                      className="w-4 h-4 text-brand rounded focus:ring-brand"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-white text-sm font-bold">
                        {user.displayName.charAt(0)}
                      </div>
                      <div>
                        <div className="text-white font-medium">{user.displayName}</div>
                        <div className="text-white/50 text-sm">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/70 text-sm">{user.department}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(user.isActive)}`}>
                      {user.isActive ? '有効' : '無効'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/70 text-sm">
                    {new Date(user.lastLogin).toLocaleDateString('ja-JP')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingUser(user);
                          setShowUserModal(true);
                        }}
                        className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors text-sm"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleBulkAction('delete')}
                        className="px-2 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm"
                      >
                        削除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">👥</div>
          <p className="text-white/70">該当するユーザーが見つかりませんでした</p>
        </div>
      )}

      {/* インポートモーダル */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">ユーザーインポート</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CSVファイルを選択
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImportUsers(file);
                      setShowImportModal(false);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="text-sm text-gray-600">
                <p>CSVファイルの形式:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>username, displayName, email, role, department</li>
                  <li>1行目はヘッダー</li>
                  <li>文字エンコーディング: UTF-8</li>
                </ul>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



