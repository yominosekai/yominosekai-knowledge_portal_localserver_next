'use client';

import { useEffect, useState } from 'react';
import { apiClient, Material, Category } from '../../lib/api';

interface LearningTask {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  estimatedHours: number;
  type: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress: number;
  dueDate?: string;
  assignedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export default function Page() {
  const [tasks, setTasks] = useState<LearningTask[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 認証
        await apiClient.authenticate();
        
        // コンテンツとカテゴリを取得
        const [materials, categoriesData] = await Promise.all([
          apiClient.getContent(),
          apiClient.getCategories()
        ]);
        
        setCategories(categoriesData);
        
        // コンテンツを学習課題に変換
        const learningTasks: LearningTask[] = materials.map((material, index) => ({
          id: material.id,
          title: material.title,
          description: material.description,
          category: material.category_id,
          difficulty: material.difficulty,
          estimatedHours: material.estimated_hours,
          type: material.type,
          status: index % 3 === 0 ? 'completed' : index % 3 === 1 ? 'in_progress' : 'not_started',
          progress: index % 3 === 0 ? 100 : index % 3 === 1 ? Math.floor(Math.random() * 80) + 20 : 0,
          dueDate: index % 4 === 0 ? new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined,
          assignedBy: index % 5 === 0 ? '管理者' : undefined,
          createdAt: material.created_date,
          updatedAt: material.updated_date
        }));
        
        setTasks(learningTasks);
        
      } catch (err) {
        console.error('データ取得エラー:', err);
        setError('データの取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredTasks = tasks.filter(task => {
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || task.category === filterCategory;
    const matchesDifficulty = filterDifficulty === 'all' || task.difficulty === filterDifficulty;
    const matchesSearch = searchTerm === '' || 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesCategory && matchesDifficulty && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-400/10';
      case 'in_progress': return 'text-yellow-400 bg-yellow-400/10';
      case 'not_started': return 'text-gray-400 bg-gray-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '完了';
      case 'in_progress': return '進行中';
      case 'not_started': return '未開始';
      default: return '不明';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-400';
      case 'intermediate': return 'text-yellow-400';
      case 'advanced': return 'text-red-400';
      default: return 'text-gray-400';
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
        <h2 className="text-xl font-semibold mb-4">学習課題</h2>
        
        {/* フィルターと検索 */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-64">
            <input
              type="text"
              placeholder="課題を検索..."
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
              <option value="not_started">未開始</option>
              <option value="in_progress">進行中</option>
              <option value="completed">完了</option>
            </select>
          </div>
          
          <div>
            <select
              className="rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">すべてのカテゴリ</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <select
              className="rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white"
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
            >
              <option value="all">すべての難易度</option>
              <option value="beginner">初級</option>
              <option value="intermediate">中級</option>
              <option value="advanced">上級</option>
            </select>
          </div>
        </div>

        {/* 課題一覧 */}
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <div key={task.id} className="rounded-lg bg-black/20 p-4 ring-1 ring-white/10 hover:ring-white/20 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">{task.title}</h3>
                  <p className="text-white/70 mb-3">{task.description}</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-white/50 mb-3">
                    <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(task.difficulty)}`}>
                      {task.difficulty}
                    </span>
                    <span>{task.estimatedHours}時間</span>
                    <span className="capitalize">{task.type}</span>
                    {task.dueDate && (
                      <span>期限: {new Date(task.dueDate).toLocaleDateString()}</span>
                    )}
                    {task.assignedBy && (
                      <span>割り当て: {task.assignedBy}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 rounded text-xs font-medium ${getStatusColor(task.status)}`}>
                    {getStatusText(task.status)}
                  </span>
                  
                  {task.status === 'in_progress' && (
                    <div className="w-24 bg-black/20 rounded-full h-2">
                      <div 
                        className="bg-brand h-2 rounded-full transition-all duration-300"
                        style={{ width: `${task.progress}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                {task.status === 'not_started' && (
                  <button className="px-4 py-2 rounded bg-brand text-white text-sm hover:bg-brand-dark transition-colors">
                    学習開始
                  </button>
                )}
                {task.status === 'in_progress' && (
                  <button className="px-4 py-2 rounded bg-yellow-500 text-white text-sm hover:bg-yellow-600 transition-colors">
                    続行
                  </button>
                )}
                {task.status === 'completed' && (
                  <button className="px-4 py-2 rounded bg-green-500 text-white text-sm hover:bg-green-600 transition-colors">
                    復習
                  </button>
                )}
                
                <button className="px-4 py-2 rounded bg-black/40 text-white text-sm hover:bg-white/10 transition-colors">
                  詳細
                </button>
                
                <button className="px-4 py-2 rounded bg-black/40 text-white text-sm hover:bg-white/10 transition-colors">
                  お気に入り
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredTasks.length === 0 && (
          <div className="text-center py-8">
            <p className="text-white/70">該当する課題が見つかりませんでした。</p>
          </div>
        )}
      </div>

      {/* 統計サマリー */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg bg-white/5 p-4 ring-1 ring-white/10 text-center">
          <div className="text-2xl font-bold text-brand mb-1">
            {tasks.filter(t => t.status === 'completed').length}
          </div>
          <div className="text-sm text-white/70">完了済み</div>
        </div>
        <div className="rounded-lg bg-white/5 p-4 ring-1 ring-white/10 text-center">
          <div className="text-2xl font-bold text-yellow-400 mb-1">
            {tasks.filter(t => t.status === 'in_progress').length}
          </div>
          <div className="text-sm text-white/70">進行中</div>
        </div>
        <div className="rounded-lg bg-white/5 p-4 ring-1 ring-white/10 text-center">
          <div className="text-2xl font-bold text-gray-400 mb-1">
            {tasks.filter(t => t.status === 'not_started').length}
          </div>
          <div className="text-sm text-white/70">未開始</div>
        </div>
        <div className="rounded-lg bg-white/5 p-4 ring-1 ring-white/10 text-center">
          <div className="text-2xl font-bold text-brand mb-1">
            {Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) || 0}%
          </div>
          <div className="text-sm text-white/70">完了率</div>
        </div>
      </div>
    </div>
  );
}
