'use client';

import React, { useState, useEffect } from 'react';

interface AdvancedSearchFiltersProps {
  onFiltersChange: (filters: SearchFilters) => void;
  categories: any[];
  className?: string;
}

interface SearchFilters {
  searchTerm: string;
  categoryId: string;
  difficulty: string;
  type: string;
  tags: string[];
  dateRange: {
    start: string;
    end: string;
  };
  estimatedHours: {
    min: number;
    max: number;
  };
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export function AdvancedSearchFilters({ 
  onFiltersChange, 
  categories, 
  className = '' 
}: AdvancedSearchFiltersProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    categoryId: '',
    difficulty: '',
    type: '',
    tags: [],
    dateRange: {
      start: '',
      end: ''
    },
    estimatedHours: {
      min: 0,
      max: 100
    },
    sortBy: 'created_date',
    sortOrder: 'desc'
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const handleInputChange = (field: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedInputChange = (parentField: string, childField: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [parentField]: {
        ...prev[parentField as keyof SearchFilters],
        [childField]: value
      }
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !filters.tags.includes(newTag.trim())) {
      setFilters(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      categoryId: '',
      difficulty: '',
      type: '',
      tags: [],
      dateRange: {
        start: '',
        end: ''
      },
      estimatedHours: {
        min: 0,
        max: 100
      },
      sortBy: 'created_date',
      sortOrder: 'desc'
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 基本検索 */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="キーワードで検索..."
          value={filters.searchTerm}
          onChange={(e) => handleInputChange('searchTerm', e.target.value)}
          className="flex-1 rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white placeholder-white/40"
        />
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="px-4 py-2 rounded bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          {showAdvanced ? '詳細を閉じる' : '詳細検索'}
        </button>
      </div>

      {/* 詳細検索フィルター */}
      {showAdvanced && (
        <div className="rounded-lg bg-black/20 p-4 ring-1 ring-white/10 space-y-4">
          <h3 className="text-lg font-semibold text-white">詳細検索</h3>
          
          {/* カテゴリと難易度 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/70 mb-1">カテゴリ</label>
              <select
                value={filters.categoryId}
                onChange={(e) => handleInputChange('categoryId', e.target.value)}
                className="w-full rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white"
              >
                <option value="">すべてのカテゴリ</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-white/70 mb-1">難易度</label>
              <select
                value={filters.difficulty}
                onChange={(e) => handleInputChange('difficulty', e.target.value)}
                className="w-full rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white"
              >
                <option value="">すべての難易度</option>
                <option value="beginner">初級</option>
                <option value="intermediate">中級</option>
                <option value="advanced">上級</option>
              </select>
            </div>
          </div>

          {/* タイプとタグ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/70 mb-1">タイプ</label>
              <select
                value={filters.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="w-full rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white"
              >
                <option value="">すべてのタイプ</option>
                <option value="article">記事</option>
                <option value="video">動画</option>
                <option value="exercise">練習</option>
                <option value="document">文書</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-white/70 mb-1">タグ</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="タグを入力"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  className="flex-1 rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white placeholder-white/40"
                />
                <button
                  onClick={addTag}
                  className="px-3 py-2 rounded bg-brand text-white hover:bg-brand-dark transition-colors"
                >
                  追加
                </button>
              </div>
              {filters.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {filters.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-brand/20 text-brand text-sm"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="text-brand hover:text-brand-dark"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 日付範囲 */}
          <div>
            <label className="block text-sm text-white/70 mb-2">作成日範囲</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-white/50 mb-1">開始日</label>
                <input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) => handleNestedInputChange('dateRange', 'start', e.target.value)}
                  className="w-full rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">終了日</label>
                <input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) => handleNestedInputChange('dateRange', 'end', e.target.value)}
                  className="w-full rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white"
                />
              </div>
            </div>
          </div>

          {/* 推定学習時間 */}
          <div>
            <label className="block text-sm text-white/70 mb-2">推定学習時間（時間）</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-white/50 mb-1">最小</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={filters.estimatedHours.min}
                  onChange={(e) => handleNestedInputChange('estimatedHours', 'min', parseFloat(e.target.value) || 0)}
                  className="w-full rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">最大</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={filters.estimatedHours.max}
                  onChange={(e) => handleNestedInputChange('estimatedHours', 'max', parseFloat(e.target.value) || 100)}
                  className="w-full rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white"
                />
              </div>
            </div>
          </div>

          {/* ソート */}
          <div>
            <label className="block text-sm text-white/70 mb-2">並び順</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-white/50 mb-1">項目</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleInputChange('sortBy', e.target.value)}
                  className="w-full rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white"
                >
                  <option value="created_date">作成日</option>
                  <option value="updated_date">更新日</option>
                  <option value="title">タイトル</option>
                  <option value="estimated_hours">学習時間</option>
                  <option value="difficulty">難易度</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">順序</label>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => handleInputChange('sortOrder', e.target.value as 'asc' | 'desc')}
                  className="w-full rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white"
                >
                  <option value="desc">降順（新しい順）</option>
                  <option value="asc">昇順（古い順）</option>
                </select>
              </div>
            </div>
          </div>

          {/* フィルタークリア */}
          <div className="flex justify-end">
            <button
              onClick={clearFilters}
              className="px-4 py-2 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
            >
              フィルターをクリア
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


