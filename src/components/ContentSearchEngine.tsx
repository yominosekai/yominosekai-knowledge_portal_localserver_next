'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ContentSearchEngine, SearchOptions, SearchResult } from '../lib/search-engine';

interface ContentSearchEngineProps {
  onSearchResult?: (results: SearchResult[]) => void;
  className?: string;
}

export function ContentSearchEngineComponent({ 
  onSearchResult, 
  className = '' 
}: ContentSearchEngineProps) {
  const [searchEngine] = useState(() => new ContentSearchEngine());
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchOptions, setSearchOptions] = useState<SearchOptions>({
    query: '',
    filters: {},
    sortBy: 'relevance',
    sortOrder: 'desc',
    limit: 20,
    offset: 0,
    fuzzy: false,
    exactMatch: false
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [indexStats, setIndexStats] = useState({ totalContent: 0, totalTokens: 0, averageTokensPerContent: 0 });
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadSearchData();
    loadSearchHistory();
    loadIndexStats();
  }, []);

  const loadSearchData = async () => {
    try {
      // 実際のAPIから検索データを取得
      // const response = await fetch('/api/search/index');
      // const data = await response.json();
      
      // モックデータ
      const mockContent = [
        {
          id: '1',
          contentId: 'content-1',
          title: 'React入門ガイド',
          description: 'Reactの基本的な概念と使い方を学習するためのガイドです。',
          content: 'Reactは、ユーザーインターフェースを構築するためのJavaScriptライブラリです。コンポーネントベースのアーキテクチャを採用しており、再利用可能なUIコンポーネントを作成できます。',
          tags: ['React', 'JavaScript', 'フロントエンド', '入門'],
          categories: ['プログラミング', 'Web開発'],
          metadata: {
            difficulty: 'beginner',
            type: 'article',
            author: '田中太郎',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-15T10:30:00Z',
            views: 150
          },
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T10:30:00Z',
          score: 0
        },
        {
          id: '2',
          contentId: 'content-2',
          title: 'Next.js実践講座',
          description: 'Next.jsを使った本格的なWebアプリケーション開発を学びます。',
          content: 'Next.jsは、Reactベースのフレームワークで、サーバーサイドレンダリングや静的サイト生成などの機能を提供します。本格的なWebアプリケーションの開発に最適です。',
          tags: ['Next.js', 'React', 'フレームワーク', 'SSR'],
          categories: ['プログラミング', 'Web開発', 'フレームワーク'],
          metadata: {
            difficulty: 'intermediate',
            type: 'video',
            author: '佐藤花子',
            createdAt: '2024-01-05T00:00:00Z',
            updatedAt: '2024-01-20T14:15:00Z',
            views: 89
          },
          createdAt: '2024-01-05T00:00:00Z',
          updatedAt: '2024-01-20T14:15:00Z',
          score: 0
        },
        {
          id: '3',
          contentId: 'content-3',
          title: 'TypeScript完全ガイド',
          description: 'TypeScriptの基本から応用まで、包括的に学習できるガイドです。',
          content: 'TypeScriptは、JavaScriptに静的型付けを追加したプログラミング言語です。大規模なアプリケーションの開発において、型安全性とコードの可読性を向上させます。',
          tags: ['TypeScript', 'JavaScript', '型安全性', '開発効率'],
          categories: ['プログラミング', 'Web開発', '型システム'],
          metadata: {
            difficulty: 'advanced',
            type: 'document',
            author: '山田次郎',
            createdAt: '2024-01-10T00:00:00Z',
            updatedAt: '2024-01-25T09:45:00Z',
            views: 203
          },
          createdAt: '2024-01-10T00:00:00Z',
          updatedAt: '2024-01-25T09:45:00Z',
          score: 0
        }
      ];

      // 検索エンジンにデータを追加
      mockContent.forEach(content => {
        searchEngine.addContent(content);
      });
    } catch (error) {
      console.error('検索データの読み込みに失敗:', error);
    }
  };

  const loadSearchHistory = () => {
    const history = localStorage.getItem('searchHistory');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  };

  const saveSearchHistory = (query: string) => {
    if (!query.trim()) return;
    
    const newHistory = [query, ...searchHistory.filter(q => q !== query)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  const loadIndexStats = () => {
    const stats = searchEngine.getIndexStats();
    setIndexStats(stats);
  };

  const handleSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const currentSearchOptions: SearchOptions = {
        ...searchOptions,
        query: searchQuery
      };

      const searchResults = searchEngine.search(currentSearchOptions);
      setResults(searchResults);
      
      if (onSearchResult) {
        onSearchResult(searchResults);
      }

      saveSearchHistory(searchQuery);
    } catch (error) {
      console.error('検索エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    
    // デバウンス処理
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      if (value.trim()) {
        handleSearch(value);
      } else {
        setResults([]);
      }
    }, 300);
  };

  const handleFilterChange = (filterType: string, value: any) => {
    setSearchOptions(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [filterType]: value
      }
    }));
  };

  const handleSortChange = (sortBy: string, sortOrder: string) => {
    setSearchOptions(prev => ({
      ...prev,
      sortBy: sortBy as any,
      sortOrder: sortOrder as any
    }));
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    handleSearch(suggestion);
  };

  const handleHistoryClick = (historyItem: string) => {
    setQuery(historyItem);
    setShowSuggestions(false);
    handleSearch(historyItem);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setShowSuggestions(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-400';
    if (score >= 0.6) return 'text-yellow-400';
    if (score >= 0.4) return 'text-orange-400';
    return 'text-red-400';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-400 bg-green-400/20';
      case 'intermediate': return 'text-yellow-400 bg-yellow-400/20';
      case 'advanced': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'article': return '📄';
      case 'video': return '🎥';
      case 'document': return '📋';
      case 'exercise': return '💻';
      default: return '📄';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">コンテンツ検索エンジン</h2>
        <div className="flex items-center gap-4 text-sm text-white/70">
          <span>コンテンツ数: {indexStats.totalContent}</span>
          <span>インデックス: {indexStats.totalTokens}</span>
        </div>
      </div>

      {/* 検索フォーム */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              placeholder="コンテンツを検索..."
              className="w-full rounded bg-black/20 px-4 py-3 ring-1 ring-white/10 text-white placeholder-white/40 focus:ring-brand focus:outline-none"
            />
            
            {query && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
              >
                ×
              </button>
            )}
            
            {/* 検索候補 */}
            {showSuggestions && (suggestions.length > 0 || searchHistory.length > 0) && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                {suggestions.length > 0 && (
                  <div className="p-2">
                    <div className="text-xs text-gray-500 mb-2">検索候補</div>
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-gray-800"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
                
                {searchHistory.length > 0 && (
                  <div className="p-2 border-t border-gray-200">
                    <div className="text-xs text-gray-500 mb-2">検索履歴</div>
                    {searchHistory.map((historyItem, index) => (
                      <button
                        key={index}
                        onClick={() => handleHistoryClick(historyItem)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-gray-800"
                      >
                        {historyItem}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <button
            onClick={() => handleSearch()}
            disabled={loading}
            className="px-6 py-3 rounded bg-brand text-white hover:bg-brand-dark disabled:opacity-50 transition-colors"
          >
            {loading ? '検索中...' : '検索'}
          </button>
        </div>
      </div>

      {/* 高度なフィルター */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="px-4 py-2 rounded bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          {showAdvancedFilters ? 'フィルターを隠す' : '高度なフィルター'}
        </button>
        
        <div className="flex gap-2">
          <select
            value={searchOptions.sortBy}
            onChange={(e) => handleSortChange(e.target.value, searchOptions.sortOrder)}
            className="rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white"
          >
            <option value="relevance">関連度</option>
            <option value="date">日付</option>
            <option value="title">タイトル</option>
            <option value="popularity">人気度</option>
          </select>
          
          <select
            value={searchOptions.sortOrder}
            onChange={(e) => handleSortChange(searchOptions.sortBy, e.target.value)}
            className="rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white"
          >
            <option value="desc">降順</option>
            <option value="asc">昇順</option>
          </select>
        </div>
      </div>

      {/* 高度なフィルター詳細 */}
      {showAdvancedFilters && (
        <div className="rounded-lg bg-white/5 p-6 ring-1 ring-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">検索フィルター</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-white/70 mb-2">カテゴリ</label>
              <select
                multiple
                value={searchOptions.filters?.categories || []}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions, option => option.value);
                  handleFilterChange('categories', values);
                }}
                className="w-full rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white"
              >
                <option value="プログラミング">プログラミング</option>
                <option value="Web開発">Web開発</option>
                <option value="フレームワーク">フレームワーク</option>
                <option value="型システム">型システム</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-white/70 mb-2">難易度</label>
              <select
                multiple
                value={searchOptions.filters?.difficulty || []}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions, option => option.value);
                  handleFilterChange('difficulty', values);
                }}
                className="w-full rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white"
              >
                <option value="beginner">初級</option>
                <option value="intermediate">中級</option>
                <option value="advanced">上級</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-white/70 mb-2">タイプ</label>
              <select
                multiple
                value={searchOptions.filters?.type || []}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions, option => option.value);
                  handleFilterChange('type', values);
                }}
                className="w-full rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white"
              >
                <option value="article">記事</option>
                <option value="video">動画</option>
                <option value="document">文書</option>
                <option value="exercise">演習</option>
              </select>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => handleSearch()}
              className="px-4 py-2 rounded bg-brand text-white hover:bg-brand-dark transition-colors"
            >
              フィルター適用
            </button>
            <button
              onClick={() => {
                setSearchOptions(prev => ({ ...prev, filters: {} }));
                handleSearch();
              }}
              className="px-4 py-2 rounded bg-gray-500/20 text-gray-400 hover:bg-gray-500/30 transition-colors"
            >
              フィルタークリア
            </button>
          </div>
        </div>
      )}

      {/* 検索結果 */}
      <div className="space-y-4">
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-brand border-t-transparent"></div>
          </div>
        )}
        
        {!loading && results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                検索結果 ({results.length}件)
              </h3>
            </div>
            
            {results.map((result, index) => (
              <div
                key={index}
                className="rounded-lg bg-white/5 p-6 ring-1 ring-white/10 hover:ring-white/20 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getTypeIcon(result.metadata.type)}</span>
                    <div>
                      <h4 className="text-white font-semibold text-lg">{result.title}</h4>
                      <p className="text-white/70 text-sm">{result.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${getScoreColor(result.score)}`}>
                      関連度: {(result.score * 100).toFixed(1)}%
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(result.metadata.difficulty)}`}>
                      {result.metadata.difficulty}
                    </span>
                  </div>
                </div>
                
                {/* ハイライト */}
                {result.highlights.length > 0 && (
                  <div className="mb-3">
                    <div className="text-white/70 text-sm mb-1">関連箇所:</div>
                    <div className="space-y-1">
                      {result.highlights.map((highlight, highlightIndex) => (
                        <div
                          key={highlightIndex}
                          className="text-white/60 text-sm bg-black/20 rounded px-2 py-1"
                        >
                          ...{highlight}...
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* タグとカテゴリ */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {result.tags.map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="px-2 py-1 rounded bg-brand/20 text-brand text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                  {result.categories.map((category, categoryIndex) => (
                    <span
                      key={categoryIndex}
                      className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs"
                    >
                      {category}
                    </span>
                  ))}
                </div>
                
                {/* メタデータ */}
                <div className="flex items-center gap-4 text-xs text-white/50">
                  <span>作者: {result.metadata.author}</span>
                  <span>作成日: {new Date(result.metadata.createdAt).toLocaleDateString('ja-JP')}</span>
                  <span>閲覧数: {result.metadata.views}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {!loading && results.length === 0 && query && (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🔍</div>
            <p className="text-white/70">検索結果が見つかりませんでした</p>
            <p className="text-white/50 text-sm mt-2">
              別のキーワードで検索してみてください
            </p>
          </div>
        )}
      </div>
    </div>
  );
}



