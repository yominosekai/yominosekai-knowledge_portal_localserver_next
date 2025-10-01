'use client';

import { useEffect, useState } from 'react';
import { apiClient, Material, Category } from '../../lib/api';

export default function Page() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 認証
        await apiClient.authenticate();
        
        // コンテンツとカテゴリを並行取得
        const [materialsData, categoriesData] = await Promise.all([
          apiClient.getContent(),
          apiClient.getCategories()
        ]);
        
        setMaterials(materialsData);
        setCategories(categoriesData);
        
      } catch (err) {
        console.error('データ取得エラー:', err);
        setError('データの取得に失敗しました。PowerShellサーバーが起動しているか確認してください。');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // フィルタリング
  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || material.category_id === selectedCategory;
    const matchesDifficulty = !selectedDifficulty || material.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

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
        <h2 className="text-xl font-semibold mb-4">学習コンテンツ</h2>
        
        {/* 検索・フィルター */}
        <div className="space-y-4 mb-6">
          <div className="flex gap-2">
            <input 
              className="flex-1 rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 placeholder-white/40 text-white" 
              placeholder="コンテンツを検索..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="rounded bg-brand px-4 py-2">検索</button>
          </div>
          
          <div className="flex gap-4">
            <select 
              className="rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">すべてのカテゴリ</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            
            <select 
              className="rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white"
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
            >
              <option value="">すべての難易度</option>
              <option value="beginner">初級</option>
              <option value="intermediate">中級</option>
              <option value="advanced">上級</option>
            </select>
          </div>
        </div>

        {/* コンテンツ一覧 */}
        {filteredMaterials.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredMaterials.map((material) => (
              <div key={material.id} className="rounded-lg bg-black/20 p-4 ring-1 ring-white/10 hover:ring-white/20 transition-colors">
                <h3 className="font-semibold text-white mb-2">{material.title}</h3>
                <p className="text-sm text-white/70 mb-3 line-clamp-2">{material.description}</p>
                <div className="flex items-center justify-between text-xs text-white/50">
                  <span className="capitalize">{material.difficulty}</span>
                  <span>{material.estimated_hours}時間</span>
                  <span className="capitalize">{material.type}</span>
                </div>
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
    </div>
  );
}
