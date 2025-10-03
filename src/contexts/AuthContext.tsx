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
    
    // 元のアプリケーションのように自動認証を実行（リトライ機能付き）
    const autoAuthenticate = async () => {
      const maxRetries = 5;
      const retryDelay = 2000; // 2秒
      
      // サーバー起動待機（初回のみ）
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`[AuthContext] Auto authentication attempt ${attempt}/${maxRetries}`);
          console.log(`[AuthContext] Current URL: ${window.location.href}`);
          console.log(`[AuthContext] Making request to: /api/auth`);
          
          const response = await fetch('/api/auth', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
            },
            // タイムアウト設定
            signal: AbortSignal.timeout(15000), // 15秒タイムアウト
          });
          
          console.log(`[AuthContext] Response status: ${response.status}`);
          console.log(`[AuthContext] Response ok: ${response.ok}`);
          
          if (response.ok) {
            const data = await response.json();
            console.log(`[AuthContext] Auto authentication response:`, data);
            
            if (data.success && data.user) {
              console.log(`[AuthContext] Auto authentication successful:`, data.user);
              setUser(data.user);
              
              // セッションを保存
              const sessionManager = SessionManager.getInstance();
              sessionManager.setSession(data.user);
              
              // クッキーにも保存
              if (typeof document !== 'undefined') {
                document.cookie = `knowledge_portal_session=${encodeURIComponent(JSON.stringify(data.user))}; path=/; max-age=86400`;
              }
              
              setIsLoading(false);
              return; // 成功したら終了
            } else {
              console.error(`[AuthContext] Auto authentication failed:`, data.error || 'Unknown error');
              console.error(`[AuthContext] Response data:`, data);
            }
          } else if (response.status === 500) {
            // サーバーエラーの場合は少し待ってからリトライ
            console.log(`[AuthContext] Server error (500), waiting before retry...`);
            throw new Error(`Server error: ${response.status}`);
          } else {
            console.error(`[AuthContext] Auto authentication request failed:`, response.status);
            const errorData = await response.text();
            console.error(`[AuthContext] Error response:`, errorData);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        } catch (error) {
          console.error(`[AuthContext] Auto authentication attempt ${attempt} error:`, error);
          
          // 最後の試行でない場合は待機
          if (attempt < maxRetries) {
            const waitTime = retryDelay * attempt; // 指数バックオフ
            console.log(`[AuthContext] Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      }
      
      console.log(`[AuthContext] Auto authentication failed after all retries`);
      setIsLoading(false);
    };
    
    autoAuthenticate();
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
