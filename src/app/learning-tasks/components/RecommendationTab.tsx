'use client';

import { useEffect, useState } from 'react';
import { Material, Category } from '../../../lib/api';
import { UserLearningProgress } from '../../../lib/data';
import { ContentModal } from '../../../components/ContentModal';

interface RecommendationTabProps {
  userId: string;
  onShowContentDetail: (content: Material) => void;
  onCloseContentModal: () => void;
  selectedContent: any;
  isContentModalOpen: boolean;
  onProgressUpdate: (contentId: string, progress: number, status: string) => void;
}

export function RecommendationTab({
  userId,
  onShowContentDetail,
  onCloseContentModal,
  selectedContent,
  isContentModalOpen,
  onProgressUpdate
}: RecommendationTabProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [learningProgress, setLearningProgress] = useState<UserLearningProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'category' | 'difficulty' | 'unlearned'>('unlearned');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // コンテンツ、カテゴリ、学習進捗を並行取得
      const [materialsResponse, categoriesResponse, progressResponse] = await Promise.all([
        fetch('/api/content', {
          headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        }),
        fetch('/api/categories', {
          headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        }),
        fetch(`/api/learning-progress?userId=${userId}&t=${Date.now()}`, {
          headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        })
      ]);

      if (!materialsResponse.ok || !categoriesResponse.ok || !progressResponse.ok) {
        throw new Error('データの取得に失敗しました');
      }

      const [materialsData, categoriesData, progressData] = await Promise.all([
        materialsResponse.json(),
        categoriesResponse.json(),
        progressResponse.json()
      ]);

      setMaterials(materialsData);
      setCategories(categoriesData);
      setLearningProgress(progressData);
    } catch (err) {
      console.error('データ取得エラー:', err);
      setError('データの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToFavorites = async (contentId: string) => {
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
          isFavorite: true,
          status: 'not_started',
          progress: 0
        })
      });

      if (!response.ok) {
        throw new Error('お気に入り追加に失敗しました');
      }

      await fetchData(); // データを再取得
    } catch (err) {
      console.error('お気に入り追加エラー:', err);
      setError('お気に入り追加に失敗しました。');
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

  const getFilteredMaterials = () => {
    // materialsが配列でない場合は空配列を設定
    let filtered = Array.isArray(materials) ? materials : [];

    // 学習済みのコンテンツを除外（未学習フィルターの場合）
    if (activeFilter === 'unlearned') {
      const learnedContentIds = learningProgress.map(p => p.contentId);
      filtered = filtered.filter(material => !learnedContentIds.includes(material.id));
    }

    // カテゴリフィルター
    if (activeFilter === 'category' && selectedCategory !== 'all') {
      filtered = filtered.filter(material => material.category_id === selectedCategory);
    }

    // 難易度フィルター
    if (activeFilter === 'difficulty' && selectedDifficulty !== 'all') {
      filtered = filtered.filter(material => material.difficulty === selectedDifficulty);
    }

    // 検索フィルター
    if (searchTerm) {
      filtered = filtered.filter(material =>
        material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
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

  const isAlreadyLearned = (contentId: string) => {
    return learningProgress.some(p => p.contentId === contentId);
  };

  const isFavorite = (contentId: string) => {
    const progress = learningProgress.find(p => p.contentId === contentId);
    return progress?.isFavorite || false;
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

  const filteredMaterials = getFilteredMaterials();

  return (
    <div className="space-y-6">
      {/* ヘッダーとフィルター */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="text-xl font-semibold">推奨コンテンツ</h2>
        
        <div className="flex gap-2">
          <button
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              activeFilter === 'unlearned'
                ? 'bg-brand text-white'
                : 'bg-black/20 text-white/70 hover:bg-black/40'
            }`}
            onClick={() => setActiveFilter('unlearned')}
          >
            未学習
          </button>
          <button
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              activeFilter === 'category'
                ? 'bg-brand text-white'
                : 'bg-black/20 text-white/70 hover:bg-black/40'
            }`}
            onClick={() => setActiveFilter('category')}
          >
            カテゴリ別
          </button>
          <button
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              activeFilter === 'difficulty'
                ? 'bg-brand text-white'
                : 'bg-black/20 text-white/70 hover:bg-black/40'
            }`}
            onClick={() => setActiveFilter('difficulty')}
          >
            難易度別
          </button>
        </div>
      </div>

      {/* 詳細フィルター */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-64">
          <input
            type="text"
            placeholder="コンテンツを検索..."
            className="w-full rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-brand"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {activeFilter === 'category' && (
          <div>
            <select
              className="rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">すべてのカテゴリ</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
        )}
        
        {activeFilter === 'difficulty' && (
          <div>
            <select
              className="rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white"
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
            >
              <option value="all">すべての難易度</option>
              <option value="beginner">初級</option>
              <option value="intermediate">中級</option>
              <option value="advanced">上級</option>
            </select>
          </div>
        )}
      </div>

      {/* コンテンツ一覧 */}
      <div className="space-y-4">
        {filteredMaterials.map((material) => (
          <div key={material.id} className="rounded-lg bg-black/20 p-4 ring-1 ring-white/10 hover:ring-white/20 transition-all">
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
                {isAlreadyLearned(material.id) && (
                  <span className="px-3 py-1 rounded text-xs font-medium bg-green-400/10 text-green-400">
                    学習済み
                  </span>
                )}
                {isFavorite(material.id) && (
                  <span className="px-3 py-1 rounded text-xs font-medium bg-yellow-400/10 text-yellow-400">
                    ★ お気に入り
                  </span>
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
              
              {!isFavorite(material.id) && (
                <button 
                  className="px-4 py-2 rounded bg-yellow-500 text-white text-sm hover:bg-yellow-600 transition-colors"
                  onClick={() => handleAddToFavorites(material.id)}
                >
                  ☆ お気に入り追加
                </button>
              )}
              
              {!isAlreadyLearned(material.id) && (
                <button 
                  className="px-4 py-2 rounded bg-green-500 text-white text-sm hover:bg-green-600 transition-colors"
                  onClick={() => handleStartLearning(material.id)}
                >
                  学習開始
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredMaterials.length === 0 && (
        <div className="text-center py-8">
          <p className="text-white/70">該当するコンテンツが見つかりませんでした。</p>
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
