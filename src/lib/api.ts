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
  title: string;
  description: string;
  category_id: string;
  type: string;
  file_path: string;
  difficulty: string;
  estimated_hours: number;
  created_date: string;
  updated_date: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  parent_id: string;
  level: number;
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
          ...options.headers,
        },
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
    return this.request('/api/auth', { method: 'POST' });
  }

  // 進捗データ取得
  async getProgress(userId: string): Promise<ProgressData> {
    return this.request<ProgressData>(`/api/progress/${userId}`);
  }

  // コンテンツ一覧取得
  async getContent(): Promise<Material[]> {
    return this.request<Material[]>('/api/content');
  }

  // カテゴリ一覧取得
  async getCategories(): Promise<Category[]> {
    return this.request<Category[]>('/api/categories');
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
