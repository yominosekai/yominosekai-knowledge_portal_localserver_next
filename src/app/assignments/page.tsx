'use client';

import { useEffect, useState } from 'react';
import { apiClient, Material, User } from '../../lib/api';

interface Assignment {
  id: string;
  contentId: string;
  content: Material;
  assignedTo: string;
  assignedBy: string;
  assignedDate: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  progress: number;
  notes?: string;
  priority: 'low' | 'medium' | 'high';
}

export default function Page() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    contentId: '',
    assignedTo: '',
    dueDate: '',
    notes: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 認証
        await apiClient.authenticate();
        
        // データ取得
        const [materialsData, usersData] = await Promise.all([
          apiClient.getContent(),
          fetch('/api/admin/users').then(res => res.json())
        ]);
        
        setMaterials(materialsData);
        setUsers(usersData);
        
        // アサインメントデータを生成（仮実装）
        const mockAssignments: Assignment[] = materialsData.slice(0, 10).map((material, index) => {
          const assignedUser = usersData[index % usersData.length];
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 30) + 7);
          
          return {
            id: `assignment-${index + 1}`,
            contentId: material.id,
            content: material,
            assignedTo: assignedUser.sid,
            assignedBy: 'S-1-5-21-2432060128-2762725120-1584859402-1001', // 管理者
            assignedDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            dueDate: dueDate.toISOString(),
            status: index % 4 === 0 ? 'completed' : index % 4 === 1 ? 'in_progress' : index % 4 === 2 ? 'overdue' : 'pending',
            progress: index % 4 === 0 ? 100 : index % 4 === 1 ? Math.floor(Math.random() * 80) + 20 : 0,
            notes: index % 3 === 0 ? '重要度の高い課題です' : undefined,
            priority: index % 3 === 0 ? 'high' : index % 3 === 1 ? 'medium' : 'low'
          };
        });
        
        setAssignments(mockAssignments);
        
      } catch (err) {
        console.error('データ取得エラー:', err);
        setError('データの取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredAssignments = assignments.filter(assignment => {
    const matchesStatus = filterStatus === 'all' || assignment.status === filterStatus;
    const matchesUser = filterUser === 'all' || assignment.assignedTo === filterUser;
    return matchesStatus && matchesUser;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-400/10';
      case 'in_progress': return 'text-yellow-400 bg-yellow-400/10';
      case 'pending': return 'text-blue-400 bg-blue-400/10';
      case 'overdue': return 'text-red-400 bg-red-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '完了';
      case 'in_progress': return '進行中';
      case 'pending': return '未着手';
      case 'overdue': return '期限切れ';
      default: return '不明';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.sid === userId);
    return user ? user.display_name : '不明なユーザー';
  };

  const handleCreateAssignment = async () => {
    if (!newAssignment.contentId || !newAssignment.assignedTo || !newAssignment.dueDate) {
      alert('必須項目を入力してください');
      return;
    }

    const content = materials.find(m => m.id === newAssignment.contentId);
    if (!content) return;

    const assignment: Assignment = {
      id: `assignment-${Date.now()}`,
      contentId: newAssignment.contentId,
      content,
      assignedTo: newAssignment.assignedTo,
      assignedBy: 'S-1-5-21-2432060128-2762725120-1584859402-1001',
      assignedDate: new Date().toISOString(),
      dueDate: newAssignment.dueDate,
      status: 'pending',
      progress: 0,
      notes: newAssignment.notes,
      priority: newAssignment.priority
    };

    setAssignments([assignment, ...assignments]);
    setNewAssignment({ contentId: '', assignedTo: '', dueDate: '', notes: '', priority: 'medium' });
    setShowCreateForm(false);
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">アサインメント</h2>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 rounded bg-brand text-white hover:bg-brand-dark transition-colors"
          >
            新しい課題を割り当て
          </button>
        </div>

        {/* 作成フォーム */}
        {showCreateForm && (
          <div className="mb-6 p-4 rounded-lg bg-black/20 ring-1 ring-white/10">
            <h3 className="text-lg font-semibold mb-4">新しい課題を割り当て</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/70 mb-1">コンテンツ</label>
                <select
                  className="w-full rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white"
                  value={newAssignment.contentId}
                  onChange={(e) => setNewAssignment({...newAssignment, contentId: e.target.value})}
                >
                  <option value="">コンテンツを選択</option>
                  {materials.map(material => (
                    <option key={material.id} value={material.id}>{material.title}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-white/70 mb-1">割り当て先</label>
                <select
                  className="w-full rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white"
                  value={newAssignment.assignedTo}
                  onChange={(e) => setNewAssignment({...newAssignment, assignedTo: e.target.value})}
                >
                  <option value="">ユーザーを選択</option>
                  {users.map(user => (
                    <option key={user.sid} value={user.sid}>{user.display_name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-white/70 mb-1">期限</label>
                <input
                  type="date"
                  className="w-full rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white"
                  value={newAssignment.dueDate}
                  onChange={(e) => setNewAssignment({...newAssignment, dueDate: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm text-white/70 mb-1">優先度</label>
                <select
                  className="w-full rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white"
                  value={newAssignment.priority}
                  onChange={(e) => setNewAssignment({...newAssignment, priority: e.target.value as 'low' | 'medium' | 'high'})}
                >
                  <option value="low">低</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm text-white/70 mb-1">メモ</label>
                <textarea
                  className="w-full rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white"
                  rows={3}
                  value={newAssignment.notes}
                  onChange={(e) => setNewAssignment({...newAssignment, notes: e.target.value})}
                  placeholder="追加の指示やメモを入力..."
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleCreateAssignment}
                className="px-4 py-2 rounded bg-brand text-white hover:bg-brand-dark transition-colors"
              >
                割り当て
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

        {/* フィルター */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <select
              className="rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">すべてのステータス</option>
              <option value="pending">未着手</option>
              <option value="in_progress">進行中</option>
              <option value="completed">完了</option>
              <option value="overdue">期限切れ</option>
            </select>
          </div>
          
          <div>
            <select
              className="rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white"
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
            >
              <option value="all">すべてのユーザー</option>
              {users.map(user => (
                <option key={user.sid} value={user.sid}>{user.display_name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* アサインメント一覧 */}
        <div className="space-y-4">
          {filteredAssignments.map((assignment) => (
            <div key={assignment.id} className="rounded-lg bg-black/20 p-4 ring-1 ring-white/10 hover:ring-white/20 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">{assignment.content.title}</h3>
                  <p className="text-white/70 mb-3">{assignment.content.description}</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-white/50 mb-3">
                    <span>割り当て先: {getUserName(assignment.assignedTo)}</span>
                    <span>期限: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                    <span className={`${getPriorityColor(assignment.priority)}`}>
                      優先度: {assignment.priority === 'high' ? '高' : assignment.priority === 'medium' ? '中' : '低'}
                    </span>
                    <span>難易度: {assignment.content.difficulty}</span>
                    <span>{assignment.content.estimated_hours}時間</span>
                  </div>
                  
                  {assignment.notes && (
                    <p className="text-sm text-white/60 italic">メモ: {assignment.notes}</p>
                  )}
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 rounded text-xs font-medium ${getStatusColor(assignment.status)}`}>
                    {getStatusText(assignment.status)}
                  </span>
                  
                  {assignment.status === 'in_progress' && (
                    <div className="w-24 bg-black/20 rounded-full h-2">
                      <div 
                        className="bg-brand h-2 rounded-full transition-all duration-300"
                        style={{ width: `${assignment.progress}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <button className="px-4 py-2 rounded bg-brand text-white text-sm hover:bg-brand-dark transition-colors">
                  詳細
                </button>
                <button className="px-4 py-2 rounded bg-black/40 text-white text-sm hover:bg-white/10 transition-colors">
                  編集
                </button>
                <button className="px-4 py-2 rounded bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30 transition-colors">
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredAssignments.length === 0 && (
          <div className="text-center py-8">
            <p className="text-white/70">該当するアサインメントが見つかりませんでした。</p>
          </div>
        )}
      </div>

      {/* 統計サマリー */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg bg-white/5 p-4 ring-1 ring-white/10 text-center">
          <div className="text-2xl font-bold text-blue-400 mb-1">
            {assignments.filter(a => a.status === 'pending').length}
          </div>
          <div className="text-sm text-white/70">未着手</div>
        </div>
        <div className="rounded-lg bg-white/5 p-4 ring-1 ring-white/10 text-center">
          <div className="text-2xl font-bold text-yellow-400 mb-1">
            {assignments.filter(a => a.status === 'in_progress').length}
          </div>
          <div className="text-sm text-white/70">進行中</div>
        </div>
        <div className="rounded-lg bg-white/5 p-4 ring-1 ring-white/10 text-center">
          <div className="text-2xl font-bold text-green-400 mb-1">
            {assignments.filter(a => a.status === 'completed').length}
          </div>
          <div className="text-sm text-white/70">完了</div>
        </div>
        <div className="rounded-lg bg-white/5 p-4 ring-1 ring-white/10 text-center">
          <div className="text-2xl font-bold text-red-400 mb-1">
            {assignments.filter(a => a.status === 'overdue').length}
          </div>
          <div className="text-sm text-white/70">期限切れ</div>
        </div>
      </div>
    </div>
  );
}
