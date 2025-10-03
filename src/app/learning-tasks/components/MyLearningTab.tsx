'use client';

import { useEffect, useState } from 'react';
import { UserLearningProgress } from '../../../lib/data';
import { Material, Category } from '../../../lib/api';
import { ContentModal } from '../../../components/ContentModal';

interface MyLearningTabProps {
  userId: string;
  onShowContentDetail: (content: Material) => void;
  onCloseContentModal: () => void;
  selectedContent: any;
  isContentModalOpen: boolean;
  onProgressUpdate: (contentId: string, progress: number, status: string) => void;
}

export function MyLearningTab({
  userId,
  onShowContentDetail,
  onCloseContentModal,
  selectedContent,
  isContentModalOpen,
  onProgressUpdate
}: MyLearningTabProps) {
  const [learningProgress, setLearningProgress] = useState<UserLearningProgress[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'favorites' | 'in_progress' | 'completed'>('favorites');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 学習進捗、コンテンツ、カテゴリを並行取得
      const [progressResponse, materialsResponse, categoriesResponse] = await Promise.all([
        fetch(`/api/learning-progress?userId=${userId}&t=${Date.now()}`, {
          headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        }),
        fetch('/api/content', {
          headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        }),
        fetch('/api/categories', {
          headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        })
      ]);

      if (!progressResponse.ok || !materialsResponse.ok || !categoriesResponse.ok) {
        throw new Error('データの取得に失敗しました');
      }

      const [progressData, materialsData, categoriesData] = await Promise.all([
        progressResponse.json(),
        materialsResponse.json(),
        categoriesResponse.json()
      ]);

      setLearningProgress(progressData);
      setMaterials(materialsData);
      setCategories(categoriesData);
    } catch (err) {
      console.error('データ取得エラー:', err);
      setError('データの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (contentId: string) => {
    try {
      const existingProgress = learningProgress.find(p => p.contentId === contentId);
      const isCurrentlyFavorite = existingProgress?.isFavorite || false;

      const response = await fetch('/api/learning-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({
          userId,
          contentId,
          isFavorite: !isCurrentlyFavorite,
          status: existingProgress?.status || 'not_started',
          progress: existingProgress?.progress || 0
        })
      });

      if (!response.ok) {
        throw new Error('お気に入りの更新に失敗しました');
      }

      await fetchData(); // データを再取得
    } catch (err) {
      console.error('お気に入り更新エラー:', err);
      setError('お気に入りの更新に失敗しました。');
    }
  };

  const handleStartLearning = async (contentId: string) => {
    try {
      const response = await fetch('/api/learning-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({
          userId,
          contentId,
          status: 'in_progress',
          progress: 0
        })
      });

      if (!response.ok) {
        throw new Error('学習開始に失敗しました');
      }

      await fetchData(); // データを再取得
    } catch (err) {
      console.error('学習開始エラー:', err);
      setError('学習開始に失敗しました。');
    }
  };

  const getFilteredContent = () => {
    let filteredProgress = learningProgress;

    // タブによるフィルター
    switch (activeTab) {
      case 'favorites':
        filteredProgress = learningProgress.filter(p => p.isFavorite);
        break;
      case 'in_progress':
        filteredProgress = learningProgress.filter(p => p.status === 'in_progress');
        break;
      case 'completed':
        filteredProgress = learningProgress.filter(p => p.status === 'completed');
        break;
    }

    // 検索によるフィルター
    if (searchTerm) {
      filteredProgress = filteredProgress.filter(progress => {
        const material = materials.find(m => m.id === progress.contentId);
        if (!material) return false;
        
        return material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
               material.description.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    return filteredProgress;
  };

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

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : '不明';
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

  const filteredContent = getFilteredContent();

  return (
    <div className="space-y-6">
      {/* ヘッダーとタブ */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="text-xl font-semibold">マイ学習</h2>
        
        <div className="flex gap-2">
          <button
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              activeTab === 'favorites'
                ? 'bg-brand text-white'
                : 'bg-black/20 text-white/70 hover:bg-black/40'
            }`}
            onClick={() => setActiveTab('favorites')}
          >
            お気に入り
          </button>
          <button
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              activeTab === 'in_progress'
                ? 'bg-brand text-white'
                : 'bg-black/20 text-white/70 hover:bg-black/40'
            }`}
            onClick={() => setActiveTab('in_progress')}
          >
            学習中
          </button>
          <button
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              activeTab === 'completed'
                ? 'bg-brand text-white'
                : 'bg-black/20 text-white/70 hover:bg-black/40'
            }`}
            onClick={() => setActiveTab('completed')}
          >
            完了済み
          </button>
        </div>
      </div>

      {/* 検索 */}
      <div className="flex-1 min-w-64">
        <input
          type="text"
          placeholder="コンテンツを検索..."
          className="w-full rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-brand"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* コンテンツ一覧 */}
      <div className="space-y-4">
        {filteredContent.map((progress) => {
          const material = materials.find(m => m.id === progress.contentId);
          if (!material) return null;

          return (
            <div key={progress.contentId} className="rounded-lg bg-black/20 p-4 ring-1 ring-white/10 hover:ring-white/20 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">{material.title}</h3>
                  <p className="text-white/70 mb-3">{material.description}</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-white/50 mb-3">
                    <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(material.difficulty)}`}>
                      {material.difficulty}
                    </span>
                    <span>{material.estimated_hours}時間</span>
                    <span>{getCategoryName(material.category_id)}</span>
                    <span className="capitalize">{material.type}</span>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 rounded text-xs font-medium ${getStatusColor(progress.status)}`}>
                    {getStatusText(progress.status)}
                  </span>
                  
                  {progress.status === 'in_progress' && (
                    <div className="w-24 bg-black/20 rounded-full h-2">
                      <div 
                        className="bg-brand h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress.progress}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <button 
                  className="px-4 py-2 rounded bg-brand text-white text-sm hover:bg-brand-dark transition-colors"
                  onClick={() => onShowContentDetail(material)}
                >
                  詳細
                </button>
                
                <button 
                  className={`px-4 py-2 rounded text-sm transition-colors ${
                    progress.isFavorite
                      ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                      : 'bg-black/40 text-white hover:bg-white/10'
                  }`}
                  onClick={() => handleToggleFavorite(progress.contentId)}
                >
                  {progress.isFavorite ? '★' : '☆'} お気に入り
                </button>
                
                {progress.status === 'not_started' && (
                  <button 
                    className="px-4 py-2 rounded bg-green-500 text-white text-sm hover:bg-green-600 transition-colors"
                    onClick={() => handleStartLearning(progress.contentId)}
                  >
                    学習開始
                  </button>
                )}
                
                {progress.status === 'in_progress' && (
                  <button 
                    className="px-4 py-2 rounded bg-blue-500 text-white text-sm hover:bg-blue-600 transition-colors"
                    onClick={() => onShowContentDetail(material)}
                  >
                    続行
                  </button>
                )}
                
                {progress.status === 'completed' && (
                  <button 
                    className="px-4 py-2 rounded bg-purple-500 text-white text-sm hover:bg-purple-600 transition-colors"
                    onClick={() => onShowContentDetail(material)}
                  >
                    復習
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredContent.length === 0 && (
        <div className="text-center py-8">
          <p className="text-white/70">
            {activeTab === 'favorites' && 'お気に入りに登録されたコンテンツがありません。'}
            {activeTab === 'in_progress' && '学習中のコンテンツがありません。'}
            {activeTab === 'completed' && '完了済みのコンテンツがありません。'}
          </p>
        </div>
      )}

      {/* ContentModal */}
      <ContentModal
        content={selectedContent}
        isOpen={isContentModalOpen}
        onClose={onCloseContentModal}
        onProgressUpdate={onProgressUpdate}
      />
    </div>
  );
}
