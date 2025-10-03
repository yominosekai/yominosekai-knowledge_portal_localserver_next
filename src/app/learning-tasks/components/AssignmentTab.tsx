'use client';

import { useEffect, useState } from 'react';
import { Assignment } from '../../../lib/data';
import { Material } from '../../../lib/api';
import { apiClient } from '../../../lib/api';
import { ContentModal } from '../../../components/ContentModal';

interface AssignmentTabProps {
  userId: string;
  userRole: string;
  onShowContentDetail: (assignment: Assignment) => void;
  onCloseContentModal: () => void;
  selectedContent: any;
  isContentModalOpen: boolean;
  onProgressUpdate: (contentId: string, progress: number, status: string) => void;
}

export function AssignmentTab({
  userId,
  userRole,
  onShowContentDetail,
  onCloseContentModal,
  selectedContent,
  isContentModalOpen,
  onProgressUpdate
}: AssignmentTabProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAssignments();
  }, [userId]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const [materialsData, assignmentsData, usersData] = await Promise.all([
        apiClient.getContent(),
        fetch(`/api/assignments?t=${Date.now()}`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }).then(res => res.json()),
        fetch(`/api/admin/users?t=${Date.now()}`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }).then(res => res.json())
      ]);
      
      setMaterials(materialsData);
      setUsers(usersData);
      
      console.log('🔍 [AssignmentTab] Raw API response:', assignmentsData);
      
      // APIレスポンスの構造に対応（success: true, assignments: []形式）
      const assignments = assignmentsData.success && Array.isArray(assignmentsData.assignments) ? assignmentsData.assignments : [];
      console.log('🔍 [AssignmentTab] Processed assignments:', assignments);
      
      // 現在のユーザーのアサインメントのみをフィルター
      const userAssignments = assignments.filter((assignment: Assignment) => 
        assignment.assignedTo === userId
      );
      console.log('🔍 [AssignmentTab] User assignments after filter:', userAssignments);
      console.log('🔍 [AssignmentTab] User ID:', userId);
      
      setAssignments(userAssignments);
    } catch (err) {
      console.error('アサインメント取得エラー:', err);
      setError('アサインメントの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAssignment = async (assignmentId: string, updates: Partial<Assignment>) => {
    try {
      const response = await fetch(`/api/assignments/${userId}/${assignmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('アサインメントの更新に失敗しました');
      }

      // リストを再取得してUIを更新
      await fetchAssignments();
    } catch (err) {
      console.error('アサインメント更新エラー:', err);
      setError('アサインメントの更新に失敗しました。');
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('このアサインメントを削除しますか？')) {
      return;
    }

    try {
      const response = await fetch(`/api/assignments/${userId}/${assignmentId}`, {
        method: 'DELETE',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error('アサインメントの削除に失敗しました');
      }

      // リストを再取得してUIを更新
      await fetchAssignments();
    } catch (err) {
      console.error('アサインメント削除エラー:', err);
      setError('アサインメントの削除に失敗しました。');
    }
  };

  const filteredAssignments = assignments.filter(assignment => {
    const matchesStatus = filterStatus === 'all' || assignment.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      '学習指示'.toLowerCase().includes(searchTerm.toLowerCase()) ||
      '学習指示の詳細'.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
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
      case 'pending': return '未開始';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-white/70">アサインメントを読み込み中...</div>
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
      {/* ヘッダーとフィルター */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="text-xl font-semibold">アサインメント</h2>
        
        <div className="flex flex-wrap gap-4 w-full sm:w-auto">
          <div className="flex-1 min-w-64">
            <input
              type="text"
              placeholder="アサインメントを検索..."
              className="w-full rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-brand"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div>
            <select
              className="rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">すべてのステータス</option>
              <option value="pending">未開始</option>
              <option value="in_progress">進行中</option>
              <option value="completed">完了</option>
              <option value="overdue">期限切れ</option>
            </select>
          </div>
        </div>
      </div>

      {/* アサインメント一覧 */}
      <div className="space-y-4">
        {filteredAssignments.map((assignment) => {
          const content = materials.find(m => m.id === assignment.contentId);
          if (!content) return null; // コンテンツが見つからない場合はスキップ
          
          return (
            <div key={assignment.id} className="rounded-lg bg-black/20 p-4 ring-1 ring-white/10 hover:ring-white/20 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">{content.title}</h3>
                  <p className="text-white/70 mb-3">{content.description}</p>
                
                <div className="flex flex-wrap gap-4 text-sm text-white/50 mb-3">
                  <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(assignment.priority)}`}>
                    {assignment.priority}
                  </span>
                  <span>{content.estimated_hours}時間</span>
                  <span>期限: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                  <span>割当元: {users.find(u => u.sid === assignment.assignedBy)?.display_name || assignment.assignedBy}</span>
                </div>
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
                onClick={() => onShowContentDetail(assignment)}
              >
                詳細
              </button>
              
              {assignment.status === 'pending' && (
                <button 
                  className="px-4 py-2 rounded bg-green-500 text-white text-sm hover:bg-green-600 transition-colors"
                  onClick={() => handleUpdateAssignment(assignment.id, { 
                    status: 'in_progress',
                    updated_date: new Date().toISOString()
                  })}
                >
                  開始
                </button>
              )}
              
              {assignment.status === 'in_progress' && (
                <button 
                  className="px-4 py-2 rounded bg-blue-500 text-white text-sm hover:bg-blue-600 transition-colors"
                  onClick={() => handleUpdateAssignment(assignment.id, { 
                    status: 'completed',
                    progress: 100,
                    updated_date: new Date().toISOString()
                  })}
                >
                  完了
                </button>
              )}
              
              {(userRole === 'admin' || userRole === 'instructor') && (
                <button 
                  className="px-4 py-2 rounded bg-red-500 text-white text-sm hover:bg-red-600 transition-colors"
                  onClick={() => handleDeleteAssignment(assignment.id)}
                >
                  削除
                </button>
              )}
            </div>
          </div>
          );
        })}
      </div>

      {filteredAssignments.length === 0 && (
        <div className="text-center py-8">
          <p className="text-white/70">該当するアサインメントが見つかりませんでした。</p>
        </div>
      )}

      {/* ContentModal */}
      <ContentModal
        content={selectedContent}
        isOpen={isContentModalOpen}
        onClose={onCloseContentModal}
        onProgressUpdate={(contentId: string, status: string) => onProgressUpdate(contentId, 100, status)}
      />
    </div>
  );
}
