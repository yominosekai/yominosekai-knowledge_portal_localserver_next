const API_BASE_URL = '';

export interface ProgressSummary {
  total: number;
  completed: number;
  in_progress: number;
  not_started: number;
  completion_rate: number;
}

export interface Activity {
  id: number;
  material_id: string;
  activity_type: string;
  status: string;
  start_date: string;
  completion_date?: string;
  score?: number;
  notes: string;
  timestamp: string;
}

export interface ProgressData {
  summary: ProgressSummary;
  activities: Activity[];
}

export interface Material {
  id: string;
  uuid?: string; // UUIDを追加
  title: string;
  description: string;
  category_id: string;
  type: string;
  file_path: string;
  difficulty: string;
  estimated_hours: number;
  created_date: string;
  updated_date: string;
  dataSource?: 'server' | 'local' | 'both';
}

export interface Category {
  id: string;
  name: string;
  description: string;
  parent_id: string;
  level: number;
}

export interface User {
  sid: string;
  username: string;
  display_name: string;
  email: string;
  role: string;
  department: string;
  is_active: string;
  last_login: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  manager_id: string;
  created_date: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          ...options.headers,
        },
        cache: 'no-store',
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // 認証
  async authenticate(): Promise<any> {
    return this.request('/api/auth', { method: 'GET' });
  }

  // 進捗データ取得
  async getProgress(userId: string): Promise<ProgressData> {
    console.log(`[API調査] getProgress 呼び出し開始:`, userId);
    console.log(`[API調査] getProgress 呼び出し時刻:`, new Date().toISOString());
    console.log(`[API調査] getProgress スタックトレース:`, new Error().stack);
    const result = await this.request<ProgressData>(`/api/progress/${userId}`);
    console.log(`[API調査] getProgress 完了:`, result);
    return result;
  }

  // コンテンツ一覧取得
  async getContent(forceRefresh = false): Promise<Material[]> {
    console.log(`[API調査] getContent 呼び出し開始 (forceRefresh: ${forceRefresh})`);
    console.log(`[API調査] getContent 呼び出し時刻:`, new Date().toISOString());
    console.log(`[API調査] getContent スタックトレース:`, new Error().stack);
    try {
      // キャッシュバスティング付きでリクエスト
      const url = forceRefresh ? `/api/content?t=${Date.now()}` : '/api/content';
      const response = await this.request<{ success: boolean; materials: Material[] }>(url);
      console.log('Content API response:', response);
      
      // レスポンスが配列の場合はそのまま返す
      if (Array.isArray(response)) {
        return response;
      }
      
      // レスポンスがオブジェクトでmaterialsプロパティがある場合
      if (response && response.materials && Array.isArray(response.materials)) {
        return response.materials;
      }
      
      // どちらでもない場合は空配列を返す
      console.warn('Unexpected response format:', response);
      return [];
    } catch (error) {
      console.error('Error fetching content:', error);
      return [];
    }
  }

  // カテゴリ一覧取得
  async getCategories(): Promise<Category[]> {
    try {
      const response = await this.request<any>('/api/categories');
      
      // レスポンスが配列の場合はそのまま返す
      if (Array.isArray(response)) {
        return response;
      }
      
      // レスポンスがオブジェクトでcategoriesプロパティがある場合
      if (response && response.categories && Array.isArray(response.categories)) {
        return response.categories;
      }
      
      // どちらでもない場合は空配列を返す
      return [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  // コンテンツタイプ一覧取得
  async getContentTypes(): Promise<any[]> {
    try {
      const response = await this.request<any>('/api/config/content-types');
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error fetching content types:', error);
      return [];
    }
  }

  // 難易度レベル一覧取得
  async getDifficultyLevels(): Promise<any[]> {
    try {
      const response = await this.request<any>('/api/config/difficulty-levels');
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error fetching difficulty levels:', error);
      return [];
    }
  }

  // 進捗更新
  async updateProgress(userId: string, data: {
    material_id: string;
    status: string;
    score?: number;
  }): Promise<any> {
    return this.request(`/api/progress/${userId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient();
