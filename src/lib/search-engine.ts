// コンテンツ検索エンジン

export interface SearchIndex {
  id: string;
  contentId: string;
  title: string;
  description: string;
  content: string;
  tags: string[];
  categories: string[];
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  score: number;
}

export interface SearchResult {
  contentId: string;
  title: string;
  description: string;
  content: string;
  score: number;
  highlights: string[];
  metadata: Record<string, any>;
  tags: string[];
  categories: string[];
}

export interface SearchOptions {
  query: string;
  filters?: {
    categories?: string[];
    tags?: string[];
    dateRange?: {
      start: string;
      end: string;
    };
    difficulty?: string[];
    type?: string[];
    author?: string[];
  };
  sortBy?: 'relevance' | 'date' | 'title' | 'popularity';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  fuzzy?: boolean;
  exactMatch?: boolean;
}

export class ContentSearchEngine {
  private index: Map<string, SearchIndex> = new Map();
  private invertedIndex: Map<string, Set<string>> = new Map();
  private stopWords: Set<string> = new Set([
    'の', 'に', 'は', 'を', 'が', 'で', 'と', 'から', 'まで', 'より', 'も', 'か', 'や', 'など',
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'
  ]);

  constructor() {
    this.initializeIndex();
  }

  private initializeIndex() {
    // インデックスの初期化
    this.index = new Map();
    this.invertedIndex = new Map();
  }

  // インデックスにコンテンツを追加
  addContent(content: SearchIndex): void {
    this.index.set(content.id, content);
    this.updateInvertedIndex(content);
  }

  // インデックスからコンテンツを削除
  removeContent(contentId: string): void {
    const content = this.index.get(contentId);
    if (content) {
      this.removeFromInvertedIndex(content);
      this.index.delete(contentId);
    }
  }

  // インデックスを更新
  updateContent(content: SearchIndex): void {
    const existing = this.index.get(content.id);
    if (existing) {
      this.removeFromInvertedIndex(existing);
    }
    this.addContent(content);
  }

  // 全文検索を実行
  search(options: SearchOptions): SearchResult[] {
    const {
      query,
      filters = {},
      sortBy = 'relevance',
      sortOrder = 'desc',
      limit = 20,
      offset = 0,
      fuzzy = false,
      exactMatch = false
    } = options;

    if (!query.trim()) {
      return this.getAllContent(filters, sortBy, sortOrder, limit, offset);
    }

    // クエリをトークン化
    const tokens = this.tokenize(query);
    
    // 検索結果を取得
    let results = this.searchByTokens(tokens, fuzzy, exactMatch);
    
    // フィルターを適用
    results = this.applyFilters(results, filters);
    
    // スコアリング
    results = this.calculateScores(results, tokens);
    
    // ソート
    results = this.sortResults(results, sortBy, sortOrder);
    
    // ページネーション
    results = results.slice(offset, offset + limit);
    
    // ハイライトを生成
    results = this.generateHighlights(results, query);
    
    return results;
  }

  // クエリをトークン化
  private tokenize(query: string): string[] {
    return query
      .toLowerCase()
      .replace(/[^\w\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 0 && !this.stopWords.has(token));
  }

  // トークンで検索
  private searchByTokens(tokens: string[], fuzzy: boolean, exactMatch: boolean): SearchResult[] {
    const contentIds = new Set<string>();
    
    for (const token of tokens) {
      if (exactMatch) {
        // 完全一致検索
        const exactMatches = this.invertedIndex.get(token) || new Set();
        exactMatches.forEach(id => contentIds.add(id));
      } else if (fuzzy) {
        // あいまい検索
        const fuzzyMatches = this.findFuzzyMatches(token);
        fuzzyMatches.forEach(id => contentIds.add(id));
      } else {
        // 部分一致検索
        const partialMatches = this.findPartialMatches(token);
        partialMatches.forEach(id => contentIds.add(id));
      }
    }
    
    return Array.from(contentIds).map(id => {
      const content = this.index.get(id);
      if (!content) return null;
      
      return {
        contentId: content.contentId,
        title: content.title,
        description: content.description,
        content: content.content,
        score: 0,
        highlights: [],
        metadata: content.metadata,
        tags: content.tags,
        categories: content.categories
      };
    }).filter(Boolean) as SearchResult[];
  }

  // 部分一致検索
  private findPartialMatches(token: string): Set<string> {
    const matches = new Set<string>();
    
    for (const [indexToken, contentIds] of this.invertedIndex) {
      if (indexToken.includes(token)) {
        contentIds.forEach(id => matches.add(id));
      }
    }
    
    return matches;
  }

  // あいまい検索
  private findFuzzyMatches(token: string): Set<string> {
    const matches = new Set<string>();
    const maxDistance = Math.max(1, Math.floor(token.length * 0.3));
    
    for (const [indexToken, contentIds] of this.invertedIndex) {
      if (this.levenshteinDistance(token, indexToken) <= maxDistance) {
        contentIds.forEach(id => matches.add(id));
      }
    }
    
    return matches;
  }

  // レーベンシュタイン距離を計算
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + cost
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  // フィルターを適用
  private applyFilters(results: SearchResult[], filters: any): SearchResult[] {
    return results.filter(result => {
      // カテゴリフィルター
      if (filters.categories && filters.categories.length > 0) {
        if (!filters.categories.some((cat: string) => result.categories.includes(cat))) {
          return false;
        }
      }
      
      // タグフィルター
      if (filters.tags && filters.tags.length > 0) {
        if (!filters.tags.some((tag: string) => result.tags.includes(tag))) {
          return false;
        }
      }
      
      // 日付範囲フィルター
      if (filters.dateRange) {
        const contentDate = new Date(result.metadata.createdAt || result.metadata.updatedAt);
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        
        if (contentDate < startDate || contentDate > endDate) {
          return false;
        }
      }
      
      // 難易度フィルター
      if (filters.difficulty && filters.difficulty.length > 0) {
        if (!filters.difficulty.includes(result.metadata.difficulty)) {
          return false;
        }
      }
      
      // タイプフィルター
      if (filters.type && filters.type.length > 0) {
        if (!filters.type.includes(result.metadata.type)) {
          return false;
        }
      }
      
      // 作者フィルター
      if (filters.author && filters.author.length > 0) {
        if (!filters.author.includes(result.metadata.author)) {
          return false;
        }
      }
      
      return true;
    });
  }

  // スコアを計算
  private calculateScores(results: SearchResult[], tokens: string[]): SearchResult[] {
    return results.map(result => {
      let score = 0;
      
      // タイトルマッチ（重み: 3）
      const titleMatches = this.countMatches(result.title, tokens);
      score += titleMatches * 3;
      
      // 説明マッチ（重み: 2）
      const descriptionMatches = this.countMatches(result.description, tokens);
      score += descriptionMatches * 2;
      
      // コンテンツマッチ（重み: 1）
      const contentMatches = this.countMatches(result.content, tokens);
      score += contentMatches * 1;
      
      // タグマッチ（重み: 2）
      const tagMatches = result.tags.reduce((acc, tag) => 
        acc + this.countMatches(tag, tokens), 0);
      score += tagMatches * 2;
      
      // カテゴリマッチ（重み: 1.5）
      const categoryMatches = result.categories.reduce((acc, category) => 
        acc + this.countMatches(category, tokens), 0);
      score += categoryMatches * 1.5;
      
      // 正規化（0-1の範囲）
      const maxPossibleScore = tokens.length * 10; // 最大可能スコア
      score = Math.min(score / maxPossibleScore, 1);
      
      return { ...result, score };
    });
  }

  // マッチ数をカウント
  private countMatches(text: string, tokens: string[]): number {
    const lowerText = text.toLowerCase();
    return tokens.reduce((count, token) => {
      return count + (lowerText.split(token).length - 1);
    }, 0);
  }

  // 結果をソート
  private sortResults(results: SearchResult[], sortBy: string, sortOrder: string): SearchResult[] {
    return results.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'relevance':
          comparison = a.score - b.score;
          break;
        case 'date':
          const dateA = new Date(a.metadata.createdAt || a.metadata.updatedAt);
          const dateB = new Date(b.metadata.createdAt || b.metadata.updatedAt);
          comparison = dateA.getTime() - dateB.getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'popularity':
          comparison = (a.metadata.views || 0) - (b.metadata.views || 0);
          break;
        default:
          comparison = a.score - b.score;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  // ハイライトを生成
  private generateHighlights(results: SearchResult[], query: string): SearchResult[] {
    const tokens = this.tokenize(query);
    
    return results.map(result => {
      const highlights: string[] = [];
      
      // タイトルからハイライトを抽出
      const titleHighlight = this.extractHighlight(result.title, tokens);
      if (titleHighlight) highlights.push(titleHighlight);
      
      // 説明からハイライトを抽出
      const descriptionHighlight = this.extractHighlight(result.description, tokens);
      if (descriptionHighlight) highlights.push(descriptionHighlight);
      
      // コンテンツからハイライトを抽出
      const contentHighlights = this.extractContentHighlights(result.content, tokens, 3);
      highlights.push(...contentHighlights);
      
      return { ...result, highlights };
    });
  }

  // ハイライトを抽出
  private extractHighlight(text: string, tokens: string[]): string | null {
    const lowerText = text.toLowerCase();
    
    for (const token of tokens) {
      const index = lowerText.indexOf(token);
      if (index !== -1) {
        const start = Math.max(0, index - 20);
        const end = Math.min(text.length, index + token.length + 20);
        return text.substring(start, end);
      }
    }
    
    return null;
  }

  // コンテンツからハイライトを抽出
  private extractContentHighlights(content: string, tokens: string[], maxHighlights: number): string[] {
    const highlights: string[] = [];
    const sentences = content.split(/[.!?。！？]/);
    
    for (const sentence of sentences) {
      if (highlights.length >= maxHighlights) break;
      
      const lowerSentence = sentence.toLowerCase();
      const hasToken = tokens.some(token => lowerSentence.includes(token));
      
      if (hasToken) {
        highlights.push(sentence.trim());
      }
    }
    
    return highlights;
  }

  // 全コンテンツを取得（フィルター適用）
  private getAllContent(filters: any, sortBy: string, sortOrder: string, limit: number, offset: number): SearchResult[] {
    const results = Array.from(this.index.values()).map(content => ({
      contentId: content.contentId,
      title: content.title,
      description: content.description,
      content: content.content,
      score: 0,
      highlights: [],
      metadata: content.metadata,
      tags: content.tags,
      categories: content.categories
    }));
    
    const filteredResults = this.applyFilters(results, filters);
    const sortedResults = this.sortResults(filteredResults, sortBy, sortOrder);
    
    return sortedResults.slice(offset, offset + limit);
  }

  // インデックスを更新
  private updateInvertedIndex(content: SearchIndex): void {
    const tokens = [
      ...this.tokenize(content.title),
      ...this.tokenize(content.description),
      ...this.tokenize(content.content),
      ...content.tags.map(tag => tag.toLowerCase()),
      ...content.categories.map(cat => cat.toLowerCase())
    ];
    
    for (const token of tokens) {
      if (!this.invertedIndex.has(token)) {
        this.invertedIndex.set(token, new Set());
      }
      this.invertedIndex.get(token)!.add(content.id);
    }
  }

  // インデックスから削除
  private removeFromInvertedIndex(content: SearchIndex): void {
    const tokens = [
      ...this.tokenize(content.title),
      ...this.tokenize(content.description),
      ...this.tokenize(content.content),
      ...content.tags.map(tag => tag.toLowerCase()),
      ...content.categories.map(cat => cat.toLowerCase())
    ];
    
    for (const token of tokens) {
      const contentIds = this.invertedIndex.get(token);
      if (contentIds) {
        contentIds.delete(content.id);
        if (contentIds.size === 0) {
          this.invertedIndex.delete(token);
        }
      }
    }
  }

  // インデックス統計を取得
  getIndexStats(): { totalContent: number; totalTokens: number; averageTokensPerContent: number } {
    const totalContent = this.index.size;
    const totalTokens = this.invertedIndex.size;
    const averageTokensPerContent = totalContent > 0 ? totalTokens / totalContent : 0;
    
    return {
      totalContent,
      totalTokens,
      averageTokensPerContent
    };
  }

  // インデックスをクリア
  clearIndex(): void {
    this.index.clear();
    this.invertedIndex.clear();
  }

  // インデックスをエクスポート
  exportIndex(): { index: SearchIndex[]; invertedIndex: Record<string, string[]> } {
    const indexArray = Array.from(this.index.values());
    const invertedIndexObj: Record<string, string[]> = {};
    
    for (const [token, contentIds] of this.invertedIndex) {
      invertedIndexObj[token] = Array.from(contentIds);
    }
    
    return { index: indexArray, invertedIndex: invertedIndexObj };
  }

  // インデックスをインポート
  importIndex(data: { index: SearchIndex[]; invertedIndex: Record<string, string[]> }): void {
    this.clearIndex();
    
    for (const content of data.index) {
      this.index.set(content.id, content);
    }
    
    for (const [token, contentIds] of Object.entries(data.invertedIndex)) {
      this.invertedIndex.set(token, new Set(contentIds));
    }
  }
}



