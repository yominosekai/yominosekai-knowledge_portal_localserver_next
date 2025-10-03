'use client';

import { useEffect, useState } from 'react';
import { apiClient, User, Material, Category, Department } from '../../lib/api';

interface ReportData {
  totalUsers: number;
  activeUsers: number;
  totalContent: number;
  totalAssignments: number;
  completionRate: number;
  departmentStats: Array<{
    department: string;
    users: number;
    completionRate: number;
  }>;
}

export default function Page() {
  const [users, setUsers] = useState<User[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [reports, setReports] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('users');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // フォーム状態
  const [newUser, setNewUser] = useState({
    username: '',
    display_name: '',
    email: '',
    department: '',
    role: 'user'
  });
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    description: '',
    category_id: '',
    difficulty: 'beginner',
    estimated_hours: 1,
    type: 'video'
  });
  const [newDepartment, setNewDepartment] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 認証
        await apiClient.authenticate();
        
        // データ取得
        const [usersData, materialsData, categoriesData, departmentsData] = await Promise.all([
          fetch('/api/admin/users').then(res => res.json()),
          apiClient.getContent(),
          apiClient.getCategories(),
          fetch('/api/departments').then(res => res.json())
        ]);
        
        setUsers(usersData);
        setMaterials(materialsData);
        setCategories(categoriesData);
        setDepartments(departmentsData);
        
        // レポートデータ生成
        const reportData: ReportData = {
          totalUsers: usersData.length,
          activeUsers: usersData.filter((u: User) => u.is_active === 'true').length,
          totalContent: materialsData.length,
          totalAssignments: Math.floor(materialsData.length * 0.8),
          completionRate: Math.floor(Math.random() * 40) + 30,
          departmentStats: departmentsData.map((dept: Department) => ({
            department: dept.name,
            users: usersData.filter((u: User) => u.department === dept.name).length,
            completionRate: Math.floor(Math.random() * 50) + 20
          }))
        };
        
        setReports(reportData);
        
      } catch (err) {
        console.error('データ取得エラー:', err);
        setError('データの取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCreateUser = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      
      if (response.ok) {
        const newUserData = await response.json();
        setUsers([...users, newUserData]);
        setNewUser({ username: '', display_name: '', email: '', department: '', role: 'user' });
        setShowCreateForm(false);
      }
    } catch (err) {
      console.error('ユーザー作成エラー:', err);
    }
  };

  const handleCreateMaterial = async () => {
    try {
      const response = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMaterial)
      });
      
      if (response.ok) {
        const newMaterialData = await response.json();
        setMaterials([...materials, newMaterialData]);
        setNewMaterial({ title: '', description: '', category_id: '', difficulty: 'beginner', estimated_hours: 1, type: 'video' });
        setShowCreateForm(false);
      }
    } catch (err) {
      console.error('コンテンツ作成エラー:', err);
    }
  };

  const handleCreateDepartment = async () => {
    try {
      const response = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDepartment)
      });
      
      if (response.ok) {
        const newDepartmentData = await response.json();
        setDepartments([...departments, newDepartmentData]);
        setNewDepartment({ name: '', description: '' });
        setShowCreateForm(false);
      }
    } catch (err) {
      console.error('部署作成エラー:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-white/70">データを読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-500/10 p-6 ring-1 ring-red-500/20">
        <h2 className="text-xl font-semibold mb-3 text-red-400">エラー</h2>
        <p className="text-red-300">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
    <div className="rounded-lg bg-white/5 p-6 ring-1 ring-white/10">
        <h2 className="text-xl font-semibold mb-4">管理画面</h2>
        
        {/* タブナビゲーション */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'users', label: 'ユーザー管理' },
            { id: 'departments', label: '部署管理' },
            { id: 'content-mgmt', label: 'コンテンツ管理' },
            { id: 'reports', label: 'レポート' }
          ].map(tab => (
            <button
              key={tab.id}
              className={`px-4 py-2 rounded transition-colors ${
                activeTab === tab.id
                  ? 'bg-brand text-white'
                  : 'bg-black/20 text-white/70 hover:bg-white/10'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ユーザー管理タブ */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">ユーザー管理</h3>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 rounded bg-brand text-white hover:bg-brand-dark transition-colors"
              >
                新規ユーザー作成
              </button>
            </div>

            {showCreateForm && (
              <div className="p-4 rounded-lg bg-black/20 ring-1 ring-white/10">
                <h4 className="text-lg font-semibold mb-4">新規ユーザー作成</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/70 mb-1">ユーザー名</label>
                    <input
                      type="text"
                      className="w-full rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white"
                      value={newUser.username}
                      onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-1">表示名</label>
                    <input
                      type="text"
                      className="w-full rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white"
                      value={newUser.display_name}
                      onChange={(e) => setNewUser({...newUser, display_name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-1">メール</label>
                    <input
                      type="email"
                      className="w-full rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-1">部署</label>
                    <select
                      className="w-full rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white"
                      value={newUser.department}
                      onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                    >
                      <option value="">部署を選択</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.name}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleCreateUser}
                    className="px-4 py-2 rounded bg-brand text-white hover:bg-brand-dark transition-colors"
                  >
                    作成
                  </button>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 rounded bg-black/40 text-white hover:bg-white/10 transition-colors"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-white/70">ユーザー名</th>
                    <th className="text-left py-3 px-4 text-white/70">表示名</th>
                    <th className="text-left py-3 px-4 text-white/70">メール</th>
                    <th className="text-left py-3 px-4 text-white/70">部署</th>
                    <th className="text-left py-3 px-4 text-white/70">ロール</th>
                    <th className="text-left py-3 px-4 text-white/70">ステータス</th>
                    <th className="text-left py-3 px-4 text-white/70">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.sid} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 px-4 text-white">{user.username}</td>
                      <td className="py-3 px-4 text-white">{user.display_name}</td>
                      <td className="py-3 px-4 text-white/70">{user.email}</td>
                      <td className="py-3 px-4 text-white/70">{user.department}</td>
                      <td className="py-3 px-4 text-white/70">{user.role}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          user.is_active === 'true' 
                            ? 'text-green-400 bg-green-400/10' 
                            : 'text-red-400 bg-red-400/10'
                        }`}>
                          {user.is_active === 'true' ? 'アクティブ' : '非アクティブ'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs hover:bg-blue-500/30 transition-colors">
                            編集
                          </button>
                          <button className="px-2 py-1 rounded bg-red-500/20 text-red-400 text-xs hover:bg-red-500/30 transition-colors">
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
        )}

        {/* 部署管理タブ */}
        {activeTab === 'departments' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">部署管理</h3>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 rounded bg-brand text-white hover:bg-brand-dark transition-colors"
              >
                新規部署作成
              </button>
            </div>

            {showCreateForm && (
              <div className="p-4 rounded-lg bg-black/20 ring-1 ring-white/10">
                <h4 className="text-lg font-semibold mb-4">新規部署作成</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/70 mb-1">部署名</label>
                    <input
                      type="text"
                      className="w-full rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white"
                      value={newDepartment.name}
                      onChange={(e) => setNewDepartment({...newDepartment, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-1">説明</label>
                    <input
                      type="text"
                      className="w-full rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white"
                      value={newDepartment.description}
                      onChange={(e) => setNewDepartment({...newDepartment, description: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleCreateDepartment}
                    className="px-4 py-2 rounded bg-brand text-white hover:bg-brand-dark transition-colors"
                  >
                    作成
                  </button>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 rounded bg-black/40 text-white hover:bg-white/10 transition-colors"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {departments.map((dept) => (
                <div key={dept.id} className="rounded-lg bg-black/20 p-4 ring-1 ring-white/10">
                  <h4 className="font-semibold text-white mb-2">{dept.name}</h4>
                  <p className="text-sm text-white/70 mb-3">{dept.description}</p>
                  <div className="flex justify-between text-xs text-white/50">
                    <span>ID: {dept.id}</span>
                    <span>{new Date(dept.created_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs hover:bg-blue-500/30 transition-colors">
                      編集
                    </button>
                    <button className="px-2 py-1 rounded bg-red-500/20 text-red-400 text-xs hover:bg-red-500/30 transition-colors">
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* コンテンツ管理タブ */}
        {activeTab === 'content-mgmt' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">コンテンツ管理</h3>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 rounded bg-brand text-white hover:bg-brand-dark transition-colors"
              >
                新規コンテンツ作成
              </button>
            </div>

            {showCreateForm && (
              <div className="p-4 rounded-lg bg-black/20 ring-1 ring-white/10">
                <h4 className="text-lg font-semibold mb-4">新規コンテンツ作成</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/70 mb-1">タイトル</label>
                    <input
                      type="text"
                      className="w-full rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white"
                      value={newMaterial.title}
                      onChange={(e) => setNewMaterial({...newMaterial, title: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-1">カテゴリ</label>
                    <select
                      className="w-full rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white"
                      value={newMaterial.category_id}
                      onChange={(e) => setNewMaterial({...newMaterial, category_id: e.target.value})}
                    >
                      <option value="">カテゴリを選択</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-1">難易度</label>
                    <select
                      className="w-full rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white"
                      value={newMaterial.difficulty}
                      onChange={(e) => setNewMaterial({...newMaterial, difficulty: e.target.value})}
                    >
                      <option value="beginner">初級</option>
                      <option value="intermediate">中級</option>
                      <option value="advanced">上級</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-1">タイプ</label>
                    <select
                      className="w-full rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white"
                      value={newMaterial.type}
                      onChange={(e) => setNewMaterial({...newMaterial, type: e.target.value})}
                    >
                      <option value="video">動画</option>
                      <option value="article">記事</option>
                      <option value="quiz">クイズ</option>
                      <option value="exercise">演習</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-1">推定時間（時間）</label>
                    <input
                      type="number"
                      className="w-full rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white"
                      value={newMaterial.estimated_hours}
                      onChange={(e) => setNewMaterial({...newMaterial, estimated_hours: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-white/70 mb-1">説明</label>
                    <textarea
                      className="w-full rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white"
                      rows={3}
                      value={newMaterial.description}
                      onChange={(e) => setNewMaterial({...newMaterial, description: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleCreateMaterial}
                    className="px-4 py-2 rounded bg-brand text-white hover:bg-brand-dark transition-colors"
                  >
                    作成
                  </button>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 rounded bg-black/40 text-white hover:bg-white/10 transition-colors"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {materials.map((material) => (
                <div key={material.id} className="rounded-lg bg-black/20 p-4 ring-1 ring-white/10">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-2">{material.title}</h4>
                      <p className="text-sm text-white/70 mb-3">{material.description}</p>
                      <div className="flex flex-wrap gap-4 text-xs text-white/50">
                        <span className="capitalize">{material.difficulty}</span>
                        <span>{material.estimated_hours}時間</span>
                        <span className="capitalize">{material.type}</span>
                        <span>ID: {material.id}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs hover:bg-blue-500/30 transition-colors">
                        編集
                      </button>
                      <button className="px-2 py-1 rounded bg-red-500/20 text-red-400 text-xs hover:bg-red-500/30 transition-colors">
                        削除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* レポートタブ */}
        {activeTab === 'reports' && reports && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">レポート</h3>
            
            {/* 統計サマリー */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-lg bg-black/20 p-4 text-center">
                <div className="text-2xl font-bold text-brand mb-1">{reports.totalUsers}</div>
                <div className="text-sm text-white/70">総ユーザー数</div>
              </div>
              <div className="rounded-lg bg-black/20 p-4 text-center">
                <div className="text-2xl font-bold text-green-400 mb-1">{reports.activeUsers}</div>
                <div className="text-sm text-white/70">アクティブユーザー</div>
              </div>
              <div className="rounded-lg bg-black/20 p-4 text-center">
                <div className="text-2xl font-bold text-blue-400 mb-1">{reports.totalContent}</div>
                <div className="text-sm text-white/70">総コンテンツ数</div>
              </div>
              <div className="rounded-lg bg-black/20 p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400 mb-1">{reports.completionRate}%</div>
                <div className="text-sm text-white/70">平均完了率</div>
              </div>
            </div>

            {/* 部署別統計 */}
            <div className="rounded-lg bg-black/20 p-4">
              <h4 className="text-lg font-semibold mb-4">部署別統計</h4>
              <div className="space-y-3">
                {reports.departmentStats.map((dept, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded bg-black/20">
                    <div>
                      <div className="font-medium text-white">{dept.department}</div>
                      <div className="text-sm text-white/70">{dept.users}人</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32 bg-black/20 rounded-full h-2">
                        <div 
                          className="bg-brand h-2 rounded-full transition-all duration-300"
                          style={{ width: `${dept.completionRate}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-white w-12 text-right">{dept.completionRate}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



