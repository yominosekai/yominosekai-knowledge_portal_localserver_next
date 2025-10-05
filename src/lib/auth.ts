// 認証関連のユーティリティ関数

export interface User {
  sid: string;
  username: string;
  display_name: string;
  email: string;
  department: string;
  role: 'admin' | 'instructor' | 'user';
  is_active: boolean;
  created_date: string;
  last_login: string;
  avatar?: string;
  bio?: string;
  skills?: string[];
  certifications?: string[];
  mos?: string[];
}

// AuthContext - 削除（Reactフックを含むため）

// 権限チェック関数
export function checkPermission(user: User | null, permission: string): boolean {
  if (!user || !user.is_active) return false;

  switch (permission) {
    case 'admin':
      return user.role === 'admin';
    case 'instructor':
      return user.role === 'admin' || user.role === 'instructor';
    case 'user':
      return true;
    default:
      return false;
  }
}

// SID検証関数（簡易版）
export function validateSID(sid: string): boolean {
  // SIDの基本的な形式チェック
  const sidPattern = /^S-1-5-21-\d+-\d+-\d+-\d+$/;
  return sidPattern.test(sid);
}

// セッション管理（Cookieベースに統一）
export class SessionManager {
  private static instance: SessionManager;
  private sessionKey = 'knowledge_portal_session';

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  setSession(user: User): void {
    if (typeof window !== 'undefined') {
      const cookieValue = encodeURIComponent(JSON.stringify(user));
      document.cookie = `${this.sessionKey}=${cookieValue}; path=/; max-age=86400; SameSite=Lax`;
      console.log(`[SessionManager] Session cookie set for user: ${user.username}`);
    }
  }

  getSession(): User | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const cookies = document.cookie.split(';');
      const sessionCookie = cookies.find(cookie => 
        cookie.trim().startsWith(`${this.sessionKey}=`)
      );
      
      if (!sessionCookie) {
        console.log(`[SessionManager] No session cookie found`);
        return null;
      }
      
      const cookieValue = sessionCookie.split('=')[1];
      const user = JSON.parse(decodeURIComponent(cookieValue));
      console.log(`[SessionManager] Session restored for user: ${user.username}`);
      return user;
    } catch (error) {
      console.error(`[SessionManager] Error parsing session cookie:`, error);
      return null;
    }
  }

  clearSession(): void {
    if (typeof window !== 'undefined') {
      document.cookie = `${this.sessionKey}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      console.log(`[SessionManager] Session cookie cleared`);
    }
  }

  isSessionValid(): boolean {
    const user = this.getSession();
    if (!user) return false;
    
    // is_activeが文字列の場合は適切に変換
    let isActive = user.is_active;
    if (typeof isActive === 'string') {
      isActive = isActive === 'true' || isActive === 'True';
    }
    
    return isActive === true;
  }
}

// 認証ガード（HOC用）- 削除（JSXを含むため）

// 認証フック - 削除（Reactフックを含むため）
