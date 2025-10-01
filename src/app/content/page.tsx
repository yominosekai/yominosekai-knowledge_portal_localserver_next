'use client';

import { useEffect, useState } from 'react';
import { apiClient, Material, Category } from '../../lib/api';
import { SyncContentModal } from '../../components/SyncContentModal';
import { ContentCreationModal } from '../../components/ContentCreationModal';
import { FavoriteContentSystem } from '../../components/FavoriteContentSystem';
import { AdvancedSearchFilters } from '../../components/AdvancedSearchFilters';
import { ContentModal } from '../../components/ContentModal';

export default function Page() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [searchFilters, setSearchFilters] = useState<any>({});
  const [selectedContent, setSelectedContent] = useState<Material | null>(null);
  const [showContentModal, setShowContentModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 認証
        const user = await apiClient.authenticate();
        if (user) {
          setCurrentUserId(user.sid);
        }
        
        // コンテンツとカテゴリを並行取得
        const [materialsData, categoriesData] = await Promise.all([
          apiClient.getContent(),
          apiClient.getCategories()
        ]);
        
        setMaterials(Array.isArray(materialsData) ? materialsData : []);
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        
      } catch (err) {
        console.error('データ取得エラー:', err);
        setError('データの取得に失敗しました。しばらく待ってから再度お試しください。');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // フィルタリング（重複を防ぐ）
  const filteredMaterials = materials
    .filter((material, index, self) => 
      // 重複を防ぐ（indexで一意性を保証）
      index === self.findIndex(m => 
        (m.id && material.id && m.id === material.id) || 
        (index === self.indexOf(m))
      )
    )
    .filter(material => {
    // 基本フィルター
    const matchesSearch = material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          material.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || material.category_id === selectedCategory;
    const matchesDifficulty = !selectedDifficulty || material.difficulty === selectedDifficulty;
    
    // 詳細フィルター
    const matchesAdvancedSearch = !searchFilters.searchTerm || 
      material.title.toLowerCase().includes(searchFilters.searchTerm.toLowerCase()) ||
      material.description.toLowerCase().includes(searchFilters.searchTerm.toLowerCase());
    
    const matchesAdvancedCategory = !searchFilters.categoryId || material.category_id === searchFilters.categoryId;
    const matchesAdvancedDifficulty = !searchFilters.difficulty || material.difficulty === searchFilters.difficulty;
    const matchesType = !searchFilters.type || material.type === searchFilters.type;
    
    const matchesTags = searchFilters.tags?.length === 0 || 
      searchFilters.tags?.some((tag: string) => 
        material.tags?.toLowerCase().includes(tag.toLowerCase())
      );
    
    const matchesDateRange = !searchFilters.dateRange?.start || !searchFilters.dateRange?.end ||
      (new Date(material.created_date) >= new Date(searchFilters.dateRange.start) &&
       new Date(material.created_date) <= new Date(searchFilters.dateRange.end));
    
    const matchesEstimatedHours = !searchFilters.estimatedHours ||
      (material.estimated_hours >= searchFilters.estimatedHours.min &&
       material.estimated_hours <= searchFilters.estimatedHours.max);
    
    return matchesSearch && matchesCategory && matchesDifficulty &&
           matchesAdvancedSearch && matchesAdvancedCategory && matchesAdvancedDifficulty &&
           matchesType && matchesTags && matchesDateRange && matchesEstimatedHours;
  });

  const handleContentClick = (material: Material) => {
    console.log('Content clicked:', material);
    console.log('Material ID:', material.id);
    setSelectedContent(material);
    setShowContentModal(true);
  };

  const handleProgressUpdate = (contentId: string, status: string) => {
    // 進捗更新後の処理（必要に応じて実装）
    console.log('Progress updated:', contentId, status);
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
          <h2 className="text-xl font-semibold">学習コンテンツ</h2>
                 <div className="flex gap-2">
                   <button
                     onClick={() => setShowCreateModal(true)}
                     className="px-4 py-2 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors flex items-center gap-2"
                   >
                     <span>+</span>
                     新規コンテンツ追加
                   </button>
                   <button
                     onClick={() => setShowSyncModal(true)}
                     className="px-4 py-2 rounded bg-white/10 text-white hover:bg-white/20 transition-colors flex items-center gap-2"
                   >
                     <span>🔄</span>
                     同期
                   </button>
                 </div>
        </div>
        
        {/* 検索・フィルター */}
        <AdvancedSearchFilters
          onFiltersChange={setSearchFilters}
          categories={categories}
        />

        {/* コンテンツ一覧 */}
        {filteredMaterials.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredMaterials.map((material, index) => (
              <div 
                key={`material-${index}-${material.id || 'no-id'}`} 
                className="rounded-lg bg-black/20 p-4 ring-1 ring-white/10 hover:ring-white/20 transition-colors cursor-pointer"
                onClick={() => handleContentClick(material)}
              >
                <h3 className="font-semibold text-white mb-2">{material.title}</h3>
                <p className="text-sm text-white/70 mb-3 line-clamp-2">{material.description}</p>
                <div className="flex items-center justify-between text-xs text-white/50 mb-3">
                  <span className="capitalize">{material.difficulty}</span>
                  <span>{material.estimated_hours}時間</span>
                  <span className="capitalize">{material.type}</span>
                </div>
                
                {/* お気に入り機能 */}
                {currentUserId && (
                  <FavoriteContentSystem
                    contentId={material.id}
                    userId={currentUserId}
                    className="justify-end"
                  />
                )}
                <button className="w-full mt-3 rounded bg-brand px-3 py-2 text-sm hover:bg-brand-dark transition-colors">
                  学習開始
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-white/70 text-center py-8">該当するコンテンツが見つかりませんでした。</p>
        )}
      </div>

             {/* 同期モーダル */}
             <SyncContentModal
               isOpen={showSyncModal}
               onClose={() => setShowSyncModal(false)}
             />
             
             {/* コンテンツ作成モーダル */}
             <ContentCreationModal
               isOpen={showCreateModal}
               onClose={() => setShowCreateModal(false)}
               onSuccess={() => {
                 setShowCreateModal(false);
                 // コンテンツリストを再読み込み
                 fetchData();
               }}
             />

      {/* コンテンツモーダル */}
      <ContentModal
        content={selectedContent}
        isOpen={showContentModal}
        onClose={() => {
          setShowContentModal(false);
          setSelectedContent(null);
        }}
        onProgressUpdate={handleProgressUpdate}
      />
    </div>
  );
}
