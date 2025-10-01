'use client';

import { useState } from 'react';
import { SearchBar } from './SearchBar';

interface SearchFilters {
  type: string[];
  category: string[];
  difficulty: string[];
  department: string[];
  dateRange: {
    start: string;
    end: string;
  };
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'content' | 'user' | 'department';
  category?: string;
  difficulty?: string;
  department?: string;
  createdAt: string;
  updatedAt: string;
  score: number;
}

interface AdvancedSearchProps {
  onSearch: (query: string, filters: SearchFilters) => void;
  onClear: () => void;
  results?: SearchResult[];
  isLoading?: boolean;
  className?: string;
}

export function AdvancedSearch({ 
  onSearch, 
  onClear, 
  results = [], 
  isLoading = false,
  className = "" 
}: AdvancedSearchProps) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    type: [],
    category: [],
    difficulty: [],
    department: [],
    dateRange: {
      start: '',
      end: ''
    },
    sortBy: 'relevance',
    sortOrder: 'desc'
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearch = (searchQuery: string, searchFilters: any) => {
    setQuery(searchQuery);
    setFilters({ ...filters, ...searchFilters });
    onSearch(searchQuery, { ...filters, ...searchFilters });
  };

  const handleClear = () => {
    setQuery('');
    setFilters({
      type: [],
      category: [],
      difficulty: [],
      department: [],
      dateRange: { start: '', end: '' },
      sortBy: 'relevance',
      sortOrder: 'desc'
    });
    onClear();
  };

  const handleFilterChange = (filterType: keyof SearchFilters, value: string | string[]) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    setFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [field]: value
      }
    }));
  };

  const getResultIcon = (type: string): string => {
    switch (type) {
      case 'content': return '📚';
      case 'user': return '👤';
      case 'department': return '🏢';
      default: return '📄';
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  const getDifficultyColor = (difficulty?: string): string => {
    switch (difficulty) {
      case 'beginner': return 'text-green-400';
      case 'intermediate': return 'text-yellow-400';
      case 'advanced': return 'text-red-400';
      default: return 'text-white/50';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 検索バー */}
      <SearchBar
        onSearch={handleSearch}
        onClear={handleClear}
        placeholder="コンテンツ、ユーザー、部署を検索..."
        className="w-full"
      />

      {/* 高度な検索トグル */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center space-x-2 text-white/70 hover:text-white transition-colors"
        >
          <svg 
            className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <span>高度な検索</span>
        </button>

        {results.length > 0 && (
          <div className="text-sm text-white/50">
            {results.length}件の結果
          </div>
        )}
      </div>

      {/* 高度な検索フィルター */}
      {showAdvanced && (
        <div className="p-6 rounded-lg bg-black/20 ring-1 ring-white/10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 日付範囲 */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">作成日</label>
              <div className="space-y-2">
                <input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) => handleDateRangeChange('start', e.target.value)}
                  className="w-full px-3 py-2 rounded bg-black/20 ring-1 ring-white/10 text-white"
                />
                <input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) => handleDateRangeChange('end', e.target.value)}
                  className="w-full px-3 py-2 rounded bg-black/20 ring-1 ring-white/10 text-white"
                />
              </div>
            </div>

            {/* ソート */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">ソート</label>
              <div className="space-y-2">
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="w-full px-3 py-2 rounded bg-black/20 ring-1 ring-white/10 text-white"
                >
                  <option value="relevance">関連度</option>
                  <option value="title">タイトル</option>
                  <option value="createdAt">作成日</option>
                  <option value="updatedAt">更新日</option>
                </select>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => handleFilterChange('sortOrder', e.target.value as 'asc' | 'desc')}
                  className="w-full px-3 py-2 rounded bg-black/20 ring-1 ring-white/10 text-white"
                >
                  <option value="desc">降順</option>
                  <option value="asc">昇順</option>
                </select>
              </div>
            </div>

            {/* アクション */}
            <div className="flex items-end space-x-2">
              <button
                onClick={() => onSearch(query, filters)}
                className="px-4 py-2 rounded bg-brand text-white hover:bg-brand-dark transition-colors"
              >
                検索実行
              </button>
              <button
                onClick={handleClear}
                className="px-4 py-2 rounded bg-black/40 text-white hover:bg-white/10 transition-colors"
              >
                クリア
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 検索結果 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-white/70">検索中...</div>
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-4">
          {results.map((result) => (
            <div key={result.id} className="p-4 rounded-lg bg-black/20 ring-1 ring-white/10 hover:ring-white/20 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <span className="text-2xl">{getResultIcon(result.type)}</span>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">{result.title}</h3>
                    <p className="text-white/70 mb-3">{result.description}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-white/50">
                      <span className="capitalize">{result.type}</span>
                      {result.category && <span>{result.category}</span>}
                      {result.difficulty && (
                        <span className={getDifficultyColor(result.difficulty)}>
                          {result.difficulty === 'beginner' ? '初級' : 
                           result.difficulty === 'intermediate' ? '中級' : '上級'}
                        </span>
                      )}
                      {result.department && <span>{result.department}</span>}
                      <span>作成: {formatDate(result.createdAt)}</span>
                      <span>更新: {formatDate(result.updatedAt)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-white/50">
                    関連度: {Math.round(result.score)}%
                  </span>
                  <button className="px-3 py-1 rounded bg-brand/20 text-brand text-sm hover:bg-brand/30 transition-colors">
                    詳細
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : query && !isLoading ? (
        <div className="text-center py-12">
          <div className="text-white/50 mb-2">検索結果が見つかりませんでした</div>
          <div className="text-sm text-white/30">
            別のキーワードやフィルターを試してみてください
          </div>
        </div>
      ) : null}
    </div>
  );
}
