'use client';

import { useEffect, useState } from 'react';
import { apiClient, Material, User } from '../../lib/api';
import { Assignment } from '../../lib/data';
import { ContentModal } from '../../components/ContentModal';

export default function Page() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);
  const [filterUser, setFilterUser] = useState('all');
  const [userRole, setUserRole] = useState<string>('');
  const [userDepartment, setUserDepartment] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    contentId: '',
    assignedTo: '',
    dueDate: '',
    notes: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 認証
        const authResult = await apiClient.authenticate();
        if (authResult?.user) {
          setUserRole(authResult.user.role);
          setUserDepartment(authResult.user.department);
        }
        
        // データ取得
        const [materialsData, usersData, assignmentsData] = await Promise.all([
          apiClient.getContent(),
          fetch('/api/admin/users').then(res => res.json()),
          fetch('/api/assignments').then(res => res.json())
        ]);
        
        setMaterials(materialsData);
        
        // ユーザーフィルタリング（インストラクターは同じ部署のみ、管理者は全員）
        let filteredUsers = usersData;
        if (userRole === 'instructor') {
          filteredUsers = usersData.filter((user: User) => user.department === userDepartment);
        }
        setUsers(filteredUsers);
        
        if (assignmentsData.success) {
          // アサインメントデータにコンテンツ情報を追加
          let enrichedAssignments = assignmentsData.assignments.map((assignment: Assignment) => {
            const content = materialsData.find(m => m.id === assignment.contentId);
            return {
              ...assignment,
              content: content || {
                id: assignment.contentId,
                title: 'Unknown Content',
                description: 'Content not found',
                difficulty: 'unknown',
                estimated_hours: '0'
              }
            };
          });
          
          // アサインメントフィルタリング（インストラクターは同じ部署のみ、管理者は全員）
          if (userRole === 'instructor') {
            enrichedAssignments = enrichedAssignments.filter((assignment: Assignment) => {
              const assignedUser = usersData.find((user: User) => user.sid === assignment.assignedTo);
              return assignedUser?.department === userDepartment;
            });
          }
          
          setAssignments(enrichedAssignments);
        } else {
          console.error('Failed to fetch assignments:', assignmentsData.error);
          setAssignments([]);
        }
        
      } catch (err) {
        console.error('データ取得エラー:', err);
        setError('データの取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userRole, userDepartment]);

  // アサインメント状態の変更を監視
  useEffect(() => {
    console.log('🔄 [useEffect] Assignments state changed:', assignments);
    // 強制的に再レンダリングを促す
    setRefreshKey(prev => prev + 1);
  }, [assignments]);

  // 強制的に再レンダリングを促すためのuseEffect
  useEffect(() => {
    console.log('🔄 [useEffect] RefreshKey changed:', refreshKey);
  }, [refreshKey]);

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

  const handleShowContentDetail = (assignment: Assignment) => {
    console.log('🔍 [handleShowContentDetail] Opening content modal for assignment:', assignment);
    console.log('🔍 [handleShowContentDetail] Content:', assignment.contentId);
    
    // アサインメントのコンテンツ情報をContentModal用に整形
    const contentForModal = {
      id: assignment.contentId,
      title: '学習指示',
      description: '学習指示の詳細',
      difficulty: 'medium',
      estimated_hours: 1,
      type: 'material' // ContentModalで必要なフィールド
    };
    
    setSelectedContent(contentForModal);
    setIsContentModalOpen(true);
  };

  const handleCloseContentModal = () => {
    setIsContentModalOpen(false);
    setSelectedContent(null);
  };

  const handleProgressUpdate = (contentId: string, status: string) => {
    console.log('📊 [handleProgressUpdate] Progress updated for content:', contentId, 'status:', status);
    // 必要に応じてアサインメントの進捗も更新
    // 現在はContentModalの進捗更新のみ
  };

  const handleUpdateAssignment = async (assignmentId: string, updates: any) => {
    try {
      console.log('🔄 [handleUpdateAssignment] Starting update:', assignmentId, updates);
      const assignment = assignments.find(a => a.id === assignmentId);
      if (!assignment) {
        console.log('❌ [handleUpdateAssignment] Assignment not found:', assignmentId);
        return;
      }

      console.log('🔄 [handleUpdateAssignment] Found assignment:', assignment);
      
      // サーバーに更新を送信
      const response = await fetch(`/api/assignments/${assignment.assignedTo}/${assignmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      console.log('🔄 [handleUpdateAssignment] API response status:', response.status);
      const result = await response.json();
      console.log('🔄 [handleUpdateAssignment] API response result:', result);

      if (result.success) {
        console.log('✅ [handleUpdateAssignment] Update successful, refreshing assignments...');
        
             // アサインメント一覧を再取得（キャッシュバスティング付き）
             const assignmentsResponse = await fetch(`/api/assignments?t=${Date.now()}`, {
               method: 'GET',
               headers: {
                 'Cache-Control': 'no-cache',
                 'Pragma': 'no-cache'
               }
             });
             console.log('🔄 [handleUpdateAssignment] Fetching assignments, status:', assignmentsResponse.status);
        
        const assignmentsData = await assignmentsResponse.json();
        console.log('📊 [handleUpdateAssignment] Raw assignments data:', assignmentsData);
        
        if (assignmentsData.success) {
          let enrichedAssignments = assignmentsData.assignments.map((assignment: Assignment) => {
            const content = materials.find(m => m.id === assignment.contentId);
            return {
              ...assignment,
              content: content || {
                id: assignment.contentId,
                title: 'Unknown Content',
                description: 'Content not found',
                difficulty: 'unknown',
                estimated_hours: '0'
              }
            };
          });
          
          console.log('📊 [handleUpdateAssignment] Enriched assignments before filter:', enrichedAssignments);
          
          // アサインメントフィルタリング（インストラクターは同じ部署のみ、管理者は全員）
          if (userRole === 'instructor') {
            enrichedAssignments = enrichedAssignments.filter((assignment: Assignment) => {
              const assignedUser = users.find((user: User) => user.sid === assignment.assignedTo);
              return assignedUser?.department === userDepartment;
            });
            console.log('🏢 [handleUpdateAssignment] Applied instructor filter:', userDepartment, 'Filtered count:', enrichedAssignments.length);
          }
          
          console.log('🔄 [handleUpdateAssignment] Setting assignments state:', enrichedAssignments);
          setAssignments(enrichedAssignments);
          console.log('✅ [handleUpdateAssignment] UI update completed');
        } else {
          console.error('❌ [handleUpdateAssignment] Failed to fetch assignments after update');
        }
        alert('アサインメントが更新されました');
      } else {
        console.error('❌ [handleUpdateAssignment] Update failed:', result.error);
        alert(`エラー: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ [handleUpdateAssignment] Error updating assignment:', error);
      alert('アサインメントの更新に失敗しました');
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('このアサインメントを削除しますか？')) return;

    try {
      console.log('🗑️ [handleDeleteAssignment] Starting delete:', assignmentId);
      const assignment = assignments.find(a => a.id === assignmentId);
      if (!assignment) {
        console.log('❌ [handleDeleteAssignment] Assignment not found:', assignmentId);
        return;
      }

      console.log('🗑️ [handleDeleteAssignment] Found assignment:', assignment);
      
      // サーバーに削除を送信
      const response = await fetch(`/api/assignments/${assignment.assignedTo}/${assignmentId}`, {
        method: 'DELETE',
      });

      console.log('🗑️ [handleDeleteAssignment] API response status:', response.status);
      const result = await response.json();
      console.log('🗑️ [handleDeleteAssignment] API response result:', result);

      if (result.success) {
        console.log('✅ [handleDeleteAssignment] Delete successful, refreshing assignments...');
        
             // アサインメント一覧を再取得（キャッシュバスティング付き）
             const assignmentsResponse = await fetch(`/api/assignments?t=${Date.now()}`, {
               method: 'GET',
               headers: {
                 'Cache-Control': 'no-cache',
                 'Pragma': 'no-cache'
               }
             });
             console.log('🗑️ [handleDeleteAssignment] Fetching assignments, status:', assignmentsResponse.status);
        
        const assignmentsData = await assignmentsResponse.json();
        console.log('📊 [handleDeleteAssignment] Raw assignments data:', assignmentsData);
        
        if (assignmentsData.success) {
          let enrichedAssignments = assignmentsData.assignments.map((assignment: Assignment) => {
            const content = materials.find(m => m.id === assignment.contentId);
            return {
              ...assignment,
              content: content || {
                id: assignment.contentId,
                title: 'Unknown Content',
                description: 'Content not found',
                difficulty: 'unknown',
                estimated_hours: '0'
              }
            };
          });
          
          // アサインメントフィルタリング（インストラクターは同じ部署のみ、管理者は全員）
          if (userRole === 'instructor') {
            enrichedAssignments = enrichedAssignments.filter((assignment: Assignment) => {
              const assignedUser = users.find((user: User) => user.sid === assignment.assignedTo);
              return assignedUser?.department === userDepartment;
            });
            console.log('🏢 [handleDeleteAssignment] Applied instructor filter:', userDepartment, 'Filtered count:', enrichedAssignments.length);
          }
          
          console.log('🗑️ [handleDeleteAssignment] Setting assignments state:', enrichedAssignments);
          setAssignments(enrichedAssignments);
          console.log('✅ [handleDeleteAssignment] UI update completed');
        } else {
          console.error('❌ [handleDeleteAssignment] Failed to fetch assignments after delete');
        }
        alert('アサインメントが削除されました');
      } else {
        alert(`エラー: ${result.error}`);
      }
    } catch (error) {
      console.error('アサインメント削除エラー:', error);
      alert('アサインメントの削除に失敗しました');
    }
  };

  const handleCreateAssignment = async () => {
    if (!newAssignment.contentId || !newAssignment.assignedTo || !newAssignment.dueDate) {
      alert('必須項目を入力してください');
      return;
    }

    try {
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentId: newAssignment.contentId,
          assignedTo: newAssignment.assignedTo,
          assignedBy: 'S-1-5-21-2432060128-2762725120-1584859402-1001', // 管理者
          dueDate: newAssignment.dueDate,
          notes: newAssignment.notes,
          priority: newAssignment.priority
        }),
      });

      const result = await response.json();

      if (result.success) {
        // アサインメント一覧を再取得（キャッシュバスティング付き）
        const assignmentsResponse = await fetch(`/api/assignments?t=${Date.now()}`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        const assignmentsData = await assignmentsResponse.json();
        
        if (assignmentsData.success) {
          let enrichedAssignments = assignmentsData.assignments.map((assignment: Assignment) => {
            const content = materials.find(m => m.id === assignment.contentId);
            return {
              ...assignment,
              content: content || {
                id: assignment.contentId,
                title: 'Unknown Content',
                description: 'Content not found',
                difficulty: 'unknown',
                estimated_hours: '0'
              }
            };
          });
          
          // アサインメントフィルタリング（インストラクターは同じ部署のみ、管理者は全員）
          if (userRole === 'instructor') {
            enrichedAssignments = enrichedAssignments.filter((assignment: Assignment) => {
              const assignedUser = users.find((user: User) => user.sid === assignment.assignedTo);
              return assignedUser?.department === userDepartment;
            });
          }
          
          setAssignments(enrichedAssignments);
        }
        
        setNewAssignment({ contentId: '', assignedTo: '', dueDate: '', notes: '', priority: 'medium' });
        setShowCreateForm(false);
        alert('アサインメントが作成されました');
      } else {
        alert(`エラー: ${result.error}`);
      }
    } catch (error) {
      console.error('アサインメント作成エラー:', error);
      alert('アサインメントの作成に失敗しました');
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">学習指示</h2>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 rounded bg-brand text-white hover:bg-brand-dark transition-colors"
          >
            新しい学習指示を作成
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
                <div className="relative">
                  <input
                    type="date"
                    className="w-full rounded bg-black/20 px-3 py-2 pr-10 ring-1 ring-white/10 text-white focus:ring-2 focus:ring-brand focus:outline-none"
                    value={newAssignment.dueDate}
                    onChange={(e) => setNewAssignment({...newAssignment, dueDate: e.target.value})}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
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
            <div key={`${assignment.id}-${refreshKey}`} className="rounded-lg bg-black/20 p-4 ring-1 ring-white/10 hover:ring-white/20 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">学習指示</h3>
                  <p className="text-white/70 mb-3">学習指示の詳細</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-white/50 mb-3">
                    <span>割り当て先: {getUserName(assignment.assignedTo)}</span>
                    <span>期限: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                    <span className={`${getPriorityColor(assignment.priority)}`}>
                      優先度: {assignment.priority === 'high' ? '高' : assignment.priority === 'medium' ? '中' : '低'}
                    </span>
                    <span>難易度: 中</span>
                    <span>1時間</span>
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
                <button 
                  className="px-4 py-2 rounded bg-brand text-white text-sm hover:bg-brand-dark transition-colors"
                  onClick={() => handleShowContentDetail(assignment)}
                >
                  詳細
                </button>
                <button 
                  className="px-4 py-2 rounded bg-black/40 text-white text-sm hover:bg-white/10 transition-colors"
                  onClick={() => handleUpdateAssignment(assignment.id, { status: 'in_progress' })}
                >
                  開始
                </button>
                <button 
                  className="px-4 py-2 rounded bg-green-500/20 text-green-400 text-sm hover:bg-green-500/30 transition-colors"
                  onClick={() => handleUpdateAssignment(assignment.id, { status: 'completed', progress: 100 })}
                >
                  完了
                </button>
                <button 
                  className="px-4 py-2 rounded bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30 transition-colors"
                  onClick={() => handleDeleteAssignment(assignment.id)}
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredAssignments.length === 0 && (
          <div className="text-center py-8">
            <p className="text-white/70">該当する学習指示が見つかりませんでした。</p>
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

      {/* ContentModal */}
      <ContentModal
        content={selectedContent}
        isOpen={isContentModalOpen}
        onClose={handleCloseContentModal}
        onProgressUpdate={handleProgressUpdate}
      />
    </div>
  );
}
