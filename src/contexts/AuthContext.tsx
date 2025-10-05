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
  updateUser: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasAttemptedAuthRef = useRef(false);

  // セッション復元のためのuseEffect（初回のみ実行）
  useEffect(() => {
    console.log(`[AuthContext] ===== セッション復元開始 =====`);
    console.log(`[AuthContext] 現在のuser状態:`, user);
    console.log(`[AuthContext] 現在のisLoading状態:`, isLoading);
    console.log(`[AuthContext] hasAttemptedAuthRef.current:`, hasAttemptedAuthRef.current);
    
    // 既に認証済みの場合はスキップ
    if (user) {
      console.log(`[AuthContext] 既に認証済み、セッション復元をスキップ`);
      return;
    }
    
    // 既に認証試行済みの場合はスキップ
    if (hasAttemptedAuthRef.current) {
      console.log(`[AuthContext] 認証試行済み、スキップ`);
      return;
    }
    
    // 既存のセッションをチェック
    const sessionManager = SessionManager.getInstance();
    const existingSession = sessionManager.getSession();
    
    console.log(`[AuthContext] 既存セッション:`, existingSession);
    console.log(`[AuthContext] セッション有効性:`, sessionManager.isSessionValid());
    
    if (existingSession && sessionManager.isSessionValid()) {
      console.log(`[AuthContext] 既存セッションを復元:`, existingSession.username);
      console.log(`[AuthContext] セッション詳細:`, {
        display_name: existingSession.display_name,
        email: existingSession.email,
        avatar: existingSession.avatar
      });
      hasAttemptedAuthRef.current = true;
      
      // サーバーから最新のプロフィールデータを取得してセッションを更新
      const refreshSession = async () => {
        try {
          console.log(`[AuthContext] プロフィールデータを再取得中...`);
          const profileResponse = await fetch(`/api/profile/${existingSession.sid}`);
          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            if (profileData.success) {
              const updatedProfile = profileData.profile;
              const enrichedUser = {
                ...existingSession,
                display_name: updatedProfile.display_name || existingSession.display_name,
                email: updatedProfile.email || existingSession.email,
                avatar: updatedProfile.avatar || existingSession.avatar,
                bio: updatedProfile.bio || '',
                skills: updatedProfile.skills || [],
                certifications: updatedProfile.certifications || [],
                mos: updatedProfile.mos || []
              };
              
              console.log(`[AuthContext] プロフィールデータ更新:`, {
                display_name: enrichedUser.display_name,
                avatar: enrichedUser.avatar
              });
              
              // セッションを更新
              sessionManager.setSession(enrichedUser);
              
              // 状態更新をバッチ処理
              React.startTransition(() => {
                setUser(enrichedUser);
                setIsLoading(false);
              });
              return;
            }
          }
        } catch (error) {
          console.error(`[AuthContext] プロフィールデータ取得エラー:`, error);
        }
        
        // エラーの場合は既存セッションを使用
        React.startTransition(() => {
          setUser(existingSession);
          setIsLoading(false);
        });
      };
      
      refreshSession();
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

  const updateUser = (updatedUser: User) => {
    console.log(`[AuthContext] updateUser called:`, updatedUser);
    const sessionManager = SessionManager.getInstance();
    sessionManager.setSession(updatedUser);
    setUser(updatedUser);
    console.log(`[AuthContext] User updated successfully`);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    checkPermission: checkUserPermission,
    updateUser
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
