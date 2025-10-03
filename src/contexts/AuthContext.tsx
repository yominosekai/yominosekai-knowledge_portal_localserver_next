'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
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
  const hasAttemptedAuthRef = useRef(false);

  // セッション復元のためのuseEffect（初回のみ実行）
  useEffect(() => {
    console.log(`[認証ループ調査] ===== セッション復元開始 =====`);
    console.log(`[認証ループ調査] 現在のuser状態:`, user);
    console.log(`[認証ループ調査] 現在のisLoading状態:`, isLoading);
    console.log(`[認証ループ調査] hasAttemptedAuthRef.current:`, hasAttemptedAuthRef.current);
    
    // 既に認証済みの場合はスキップ
    if (user) {
      console.log(`[認証ループ調査] 既に認証済み、セッション復元をスキップ`);
      return;
    }
    
    // 既に認証試行済みの場合はスキップ
    if (hasAttemptedAuthRef.current) {
      console.log(`[認証ループ調査] 認証試行済み、スキップ`);
      return;
    }
    
    // 既存のセッションをチェック
    const sessionManager = SessionManager.getInstance();
    const existingSession = sessionManager.getSession();
    
    if (existingSession && sessionManager.isSessionValid()) {
      console.log(`[認証ループ調査] 既存セッションを復元:`, existingSession.username);
      hasAttemptedAuthRef.current = true;
      
      // 状態更新をバッチ処理
      React.startTransition(() => {
        setUser(existingSession);
        setIsLoading(false);
      });
      return;
    }
    
    // セッションがない場合は自動認証を実行
    const autoAuthenticate = async () => {
      console.log(`[認証ループ調査] ===== 自動認証処理開始 =====`);
      hasAttemptedAuthRef.current = true;
      
      const maxRetries = 5;
      const retryDelay = 2000; // 2秒
      
      // サーバー起動待機（初回のみ）
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`[AuthContext] Auto authentication attempt ${attempt}/${maxRetries}`);
          
          const response = await fetch('/api/auth', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
            },
            signal: AbortSignal.timeout(15000),
          });
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.success && data.user) {
              console.log(`[認証ループ調査] 認証成功`);
              
              // セッションを保存（SessionManagerを使用）
              sessionManager.setSession(data.user);
              
              // 状態更新をバッチ処理
              React.startTransition(() => {
                setUser(data.user);
                setIsLoading(false);
              });
              
              return; // 成功したら終了
            }
          }
        } catch (error) {
          console.error(`[AuthContext] Auto authentication attempt ${attempt} error:`, error);
          
          // 最後の試行でない場合は待機
          if (attempt < maxRetries) {
            const waitTime = retryDelay * attempt;
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      }
      
      console.log(`[AuthContext] Auto authentication failed after all retries`);
      setIsLoading(false);
    };
    
    autoAuthenticate();
  }, []); // 初回のみ実行

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
      
      // 状態更新をバッチ処理
      React.startTransition(() => {
        setUser(user);
      });
      
      console.log(`[AuthContext] Login successful for user: ${user.display_name}`);
    } catch (error) {
      console.error(`[AuthContext] Login error:`, error);
      throw new Error('ログインに失敗しました');
    }
  };

  const logout = (): void => {
    const sessionManager = SessionManager.getInstance();
    sessionManager.clearSession();
    
    // 状態更新をバッチ処理
    React.startTransition(() => {
      setUser(null);
    });
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
