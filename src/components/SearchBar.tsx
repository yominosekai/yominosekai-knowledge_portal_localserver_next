'use client';

import { useState, useEffect, useRef } from 'react';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'content' | 'user' | 'department';
  category?: string;
  difficulty?: string;
  department?: string;
  score: number;
}

interface SearchBarProps {
  onSearch: (query: string, filters: SearchFilters) => void;
  onClear: () => void;
  placeholder?: string;
  className?: string;
}

interface SearchFilters {
  type: string[];
  category: string[];
  difficulty: string[];
  department: string[];
}

export function SearchBar({ onSearch, onClear, placeholder = "検索...", className = "" }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    type: [],
    category: [],
    difficulty: [],
    department: []
  });
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 外部クリックでドロップダウンを閉じる
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 検索候補を取得
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions || []);
        }
      } catch (error) {
        console.error('検索候補の取得に失敗:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query.trim(), filters);
      setIsOpen(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSuggestionClick = (suggestion: SearchResult) => {
    setQuery(suggestion.title);
    onSearch(suggestion.title, filters);
    setIsOpen(false);
  };

  const handleFilterChange = (filterType: keyof SearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType].includes(value)
        ? prev[filterType].filter(item => item !== value)
        : [...prev[filterType], value]
    }));
  };

  const clearFilters = () => {
    setFilters({
      type: [],
      category: [],
      difficulty: [],
      department: []
    });
  };

  const clearSearch = () => {
    setQuery('');
    setSuggestions([]);
    onClear();
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* 検索バー */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="w-full px-4 py-2 pl-10 rounded-lg bg-black/20 ring-1 ring-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </div>
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        <button
          onClick={handleSearch}
          className="px-4 py-2 rounded-lg bg-brand text-white hover:bg-brand-dark transition-colors"
        >
          検索
        </button>
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-3 py-2 rounded-lg bg-black/20 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
          </svg>
        </button>
      </div>

      {/* ドロップダウンメニュー */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-black/90 backdrop-blur-sm rounded-lg ring-1 ring-white/10 z-50 max-h-96 overflow-y-auto">
          {/* 検索候補 */}
          {suggestions.length > 0 && (
            <div className="p-2">
              <h4 className="text-sm font-medium text-white/70 mb-2">検索候補</h4>
              <div className="space-y-1">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left p-2 rounded hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">
                        {suggestion.type === 'content' ? '📚' : 
                         suggestion.type === 'user' ? '👤' : '🏢'}
                      </span>
                      <div>
                        <p className="text-white font-medium">{suggestion.title}</p>
                        <p className="text-white/50 text-sm">{suggestion.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* フィルター */}
          <div className="border-t border-white/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-white/70">フィルター</h4>
              <button
                onClick={clearFilters}
                className="text-xs text-brand hover:text-brand-dark"
              >
                クリア
              </button>
            </div>

            <div className="space-y-4">
              {/* タイプフィルター */}
              <div>
                <label className="block text-xs text-white/50 mb-2">タイプ</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'content', label: 'コンテンツ' },
                    { value: 'user', label: 'ユーザー' },
                    { value: 'department', label: '部署' }
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => handleFilterChange('type', type.value)}
                      className={`px-2 py-1 rounded text-xs transition-colors ${
                        filters.type.includes(type.value)
                          ? 'bg-brand text-white'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* カテゴリフィルター */}
              <div>
                <label className="block text-xs text-white/50 mb-2">カテゴリ</label>
                <div className="flex flex-wrap gap-2">
                  {['技術', 'ビジネス', 'デザイン', 'マーケティング'].map((category) => (
                    <button
                      key={category}
                      onClick={() => handleFilterChange('category', category)}
                      className={`px-2 py-1 rounded text-xs transition-colors ${
                        filters.category.includes(category)
                          ? 'bg-brand text-white'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* 難易度フィルター */}
              <div>
                <label className="block text-xs text-white/50 mb-2">難易度</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'beginner', label: '初級' },
                    { value: 'intermediate', label: '中級' },
                    { value: 'advanced', label: '上級' }
                  ].map((difficulty) => (
                    <button
                      key={difficulty.value}
                      onClick={() => handleFilterChange('difficulty', difficulty.value)}
                      className={`px-2 py-1 rounded text-xs transition-colors ${
                        filters.difficulty.includes(difficulty.value)
                          ? 'bg-brand text-white'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {difficulty.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
