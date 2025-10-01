'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, SessionManager, checkPermission } from '../lib/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (sid: string) => Promise<void>;
  logout: () => void;
  checkPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log(`[AuthContext] Initializing authentication context`);
    
    const sessionManager = SessionManager.getInstance();
    const sessionUser = sessionManager.getSession();
    console.log(`[AuthContext] LocalStorage session:`, sessionUser);
    
    // クッキーからもセッションを確認
    let cookieSession = null;
    if (typeof document !== 'undefined') {
      const cookies = document.cookie.split(';');
      console.log(`[AuthContext] All cookies:`, cookies);
      
      const sessionCookie = cookies.find(cookie => cookie.trim().startsWith('knowledge_portal_session='));
      console.log(`[AuthContext] Session cookie found:`, !!sessionCookie);
      
      if (sessionCookie) {
        try {
          const cookieValue = sessionCookie.split('=')[1];
          cookieSession = JSON.parse(decodeURIComponent(cookieValue));
          // is_activeを適切に変換
          if (cookieSession && typeof cookieSession.is_active === 'string') {
            cookieSession.is_active = cookieSession.is_active === 'true' || cookieSession.is_active === 'True';
          }
          console.log(`[AuthContext] Cookie session parsed:`, cookieSession);
        } catch (e) {
          console.error(`[AuthContext] Error parsing cookie session:`, e);
        }
      }
    }
    
    const activeSession = sessionUser || cookieSession;
    console.log(`[AuthContext] Active session:`, activeSession);
    
    if (activeSession && sessionManager.isSessionValid()) {
      console.log(`[AuthContext] Valid session found, setting user`);
      setUser(activeSession);
    } else {
      console.log(`[AuthContext] No valid session, clearing session`);
      sessionManager.clearSession();
    }
    
    setIsLoading(false);
  }, []);

  const login = async (sid: string): Promise<void> => {
    console.log(`[AuthContext] Login attempt with SID: ${sid}`);
    
    if (!/^S-1-5-21-\d+-\d+-\d+-\d+$/.test(sid)) {
      console.log(`[AuthContext] Invalid SID format: ${sid}`);
      throw new Error('無効なSIDです');
    }

    try {
      // ユーザー情報を取得
      console.log(`[AuthContext] Fetching user data for SID: ${sid}`);
      const response = await fetch(`/api/users/${sid}`);
      console.log(`[AuthContext] User API response status: ${response.status}`);
      
      if (!response.ok) {
        throw new Error('ユーザーが見つかりません');
      }

      const userData = await response.json();
      console.log(`[AuthContext] User data received:`, userData);
      
      const user: User = {
        ...userData.user,
        is_active: userData.user.is_active === 'true' || userData.user.is_active === 'True'
      };

      console.log(`[AuthContext] Processed user object:`, user);

      const sessionManager = SessionManager.getInstance();
      sessionManager.setSession(user);
      setUser(user);
      
      // セッションクッキーを設定
      if (typeof document !== 'undefined') {
        const cookieValue = JSON.stringify(user);
        document.cookie = `knowledge_portal_session=${cookieValue}; path=/; max-age=86400; SameSite=Lax`;
        console.log(`[AuthContext] Session cookie set:`, cookieValue);
      }
      
      console.log(`[AuthContext] Login successful for user: ${user.display_name}`);
    } catch (error) {
      console.error(`[AuthContext] Login error:`, error);
      throw new Error('ログインに失敗しました');
    }
  };

  const logout = (): void => {
    const sessionManager = SessionManager.getInstance();
    sessionManager.clearSession();
    setUser(null);
    
    // セッションクッキーを削除
    if (typeof document !== 'undefined') {
      document.cookie = 'knowledge_portal_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  };

  const checkUserPermission = (permission: string): boolean => {
    return checkPermission(user, permission);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    checkPermission: checkUserPermission
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
