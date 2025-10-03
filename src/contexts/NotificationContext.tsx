'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface Notification {
  id: string;
  type: 'assignment' | 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
  assignedBy?: string;
  assignmentId?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  addAssignmentNotification: (assignmentTitle: string, assignedBy: string, dueDate: string) => void;
  unreadCount: number;
  isOnline: boolean;
  clearAllNotifications: () => void;
  fetchNotifications: () => Promise<void>;
  isLoading: boolean;
  debugInfo: {
    lastFetchStatus: 'success' | 'error' | 'loading' | 'idle';
    lastFetchError: string | null;
    lastFetchTime: string | null;
    apiResponse: any;
  };
  // Windows通知機能
  showWindowsNotification: (title: string, message: string, icon?: string) => void;
  requestNotificationPermission: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState({
    lastFetchStatus: 'idle' as 'success' | 'error' | 'loading' | 'idle',
    lastFetchError: null as string | null,
    lastFetchTime: null as string | null,
    apiResponse: null as any,
  });

  // 通知をサーバーから取得（接続状態も同時にチェック）
  const fetchNotifications = useCallback(async () => {
    console.log(`[認証ループ調査] fetchNotifications 実行開始`);
    try {
      setIsLoading(true);
      setDebugInfo(prev => ({
        ...prev,
        lastFetchStatus: 'loading',
        lastFetchTime: new Date().toISOString(),
        lastFetchError: null,
      }));

      const response = await fetch(`/api/notifications?t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000) // 5秒でタイムアウト
      });

      const responseData = await response.json();
      
      setDebugInfo(prev => ({
        ...prev,
        apiResponse: responseData,
      }));

      if (response.ok) {
        if (responseData.success && Array.isArray(responseData.notifications)) {
          // 新しい通知をチェック（未読の通知のみ）
          const newNotifications = responseData.notifications.filter((notification: Notification) => !notification.read);
          const previousNotificationIds = notifications.map(n => n.id);
          const trulyNewNotifications = newNotifications.filter((notification: Notification) => 
            !previousNotificationIds.includes(notification.id)
          );
          
          // 新しい通知がある場合はWindows通知を表示
          if (trulyNewNotifications.length > 0) {
            console.log(`[NotificationContext] Found ${trulyNewNotifications.length} new notifications`);
            trulyNewNotifications.forEach((notification: Notification) => {
              showWindowsNotification(
                notification.title,
                notification.message,
                '/icons/assignment.png'
              );
            });
          }
          
          setNotifications(responseData.notifications);
          setDebugInfo(prev => ({
            ...prev,
            lastFetchStatus: 'success',
            lastFetchError: null,
          }));
          console.log(`[NotificationContext] Loaded ${responseData.notifications.length} notifications`);
        } else {
          setDebugInfo(prev => ({
            ...prev,
            lastFetchStatus: 'error',
            lastFetchError: `Invalid response format: ${JSON.stringify(responseData)}`,
          }));
        }
      } else {
        setDebugInfo(prev => ({
          ...prev,
          lastFetchStatus: 'error',
          lastFetchError: `HTTP ${response.status}: ${response.statusText} - ${JSON.stringify(responseData)}`,
        }));
        console.error('[NotificationContext] Failed to fetch notifications:', response.statusText);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setDebugInfo(prev => ({
        ...prev,
        lastFetchStatus: 'error',
        lastFetchError: `Network error: ${errorMessage}`,
      }));
      console.error('[NotificationContext] Error fetching notifications:', error);
    } finally {
      console.log(`[認証ループ調査] fetchNotifications 完了`);
      setIsLoading(false);
    }
  }, []);

  // Windows通知機能
  const showWindowsNotification = useCallback((title: string, message: string, icon?: string) => {
    console.log(`[NotificationContext] Attempting to show Windows notification: ${title}`);
    console.log(`[NotificationContext] Notification permission: ${Notification.permission}`);
    console.log(`[NotificationContext] Notification API available: ${'Notification' in window}`);
    
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const notification = new Notification(title, {
          body: message,
          icon: icon || '/favicon.ico',
          tag: 'knowledge-portal',
          requireInteraction: false
        });
        
        // 通知をクリックしたらアプリにフォーカス
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
        
        console.log(`[NotificationContext] Windows notification shown successfully: ${title}`);
      } catch (error) {
        console.error(`[NotificationContext] Error showing Windows notification:`, error);
      }
    } else {
      console.log(`[NotificationContext] Windows notification not available or permission denied`);
      console.log(`[NotificationContext] Permission status: ${Notification.permission}`);
    }
  }, []);

  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        console.log(`[NotificationContext] Notification permission: ${permission}`);
        return permission === 'granted';
      }
      return Notification.permission === 'granted';
    }
    return false;
  }, []);

  // 認証が完了した後に通知を読み込み
  useEffect(() => {
    console.log(`[認証ループ調査] NotificationContext useEffect 実行`);
    console.log(`[認証ループ調査] isAuthenticated:`, isAuthenticated);
    console.log(`[認証ループ調査] user:`, user);
    console.log(`[認証ループ調査] fetchNotifications関数:`, typeof fetchNotifications);
    
    if (isAuthenticated && user) {
      console.log(`[認証ループ調査] 認証済み、通知取得開始`);
      fetchNotifications();
      
      // Windows通知の許可をリクエスト
      requestNotificationPermission();
    } else {
      console.log(`[認証ループ調査] 未認証、通知取得スキップ`);
    }
  }, [isAuthenticated, user]); // fetchNotificationsとrequestNotificationPermissionを依存関係から除外

  // ポーリング機能（30秒間隔で通知をチェック）
  useEffect(() => {
    console.log(`[認証ループ調査] ポーリングuseEffect 実行`);
    console.log(`[認証ループ調査] isAuthenticated:`, isAuthenticated);
    console.log(`[認証ループ調査] user:`, user);
    
    if (!isAuthenticated || !user) {
      console.log(`[認証ループ調査] ポーリングスキップ（未認証）`);
      return;
    }

    console.log(`[認証ループ調査] ポーリング開始`);
    
           const pollInterval = setInterval(() => {
             console.log(`[NotificationContext] Polling notifications...`);
             fetchNotifications();
           }, 30000); // 30秒間隔

    return () => {
      console.log(`[認証ループ調査] ポーリング停止`);
      clearInterval(pollInterval);
    };
  }, [isAuthenticated, user]); // fetchNotificationsを依存関係から除外

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false,
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    
    // 自動削除（5秒後）
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 5000);
  }, []);

  const removeNotification = useCallback(async (id: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          notificationId: id
        })
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id));
        console.log(`[NotificationContext] Deleted notification: ${id}`);
      } else {
        console.error('[NotificationContext] Failed to delete notification:', response.statusText);
      }
    } catch (error) {
      console.error('[NotificationContext] Error deleting notification:', error);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'markAsRead',
          notificationId: id
        })
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
        console.log(`[NotificationContext] Marked notification as read: ${id}`);
      } else {
        console.error('[NotificationContext] Failed to mark notification as read:', response.statusText);
      }
    } catch (error) {
      console.error('[NotificationContext] Error marking notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      // 未読の通知のみを既読にする
      const unreadNotifications = notifications.filter(n => !n.read);
      
      // 各通知を個別に既読にする
      for (const notification of unreadNotifications) {
        const response = await fetch('/api/notifications', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'markAsRead',
            notificationId: notification.id
          })
        });

        if (response.ok) {
          console.log(`[NotificationContext] Marked notification as read: ${notification.id}`);
        } else {
          console.error(`[NotificationContext] Failed to mark notification as read: ${notification.id}`, response.statusText);
        }
      }
      
      // フロントエンドの状態を更新
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      console.log(`[NotificationContext] Marked all notifications as read`);
    } catch (error) {
      console.error('[NotificationContext] Error marking all notifications as read:', error);
    }
  }, [notifications]);

  const clearAll = useCallback(async () => {
    try {
      // 各通知を個別に削除する
      for (const notification of notifications) {
        const response = await fetch('/api/notifications', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'delete',
            notificationId: notification.id
          })
        });

        if (response.ok) {
          console.log(`[NotificationContext] Deleted notification: ${notification.id}`);
        } else {
          console.error(`[NotificationContext] Failed to delete notification: ${notification.id}`, response.statusText);
        }
      }
      
      // フロントエンドの状態を更新
      setNotifications([]);
      console.log(`[NotificationContext] Cleared all notifications`);
    } catch (error) {
      console.error('[NotificationContext] Error clearing all notifications:', error);
    }
  }, [notifications]);

  const addAssignmentNotification = useCallback((assignmentTitle: string, assignedBy: string, dueDate: string) => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      type: 'info',
      title: '新しい学習指示が割り当てられました',
      message: `「${assignmentTitle}」が${assignedBy}さんから割り当てられました。期限: ${new Date(dueDate).toLocaleDateString()}`,
      timestamp: new Date().toISOString(),
      read: false,
      actionUrl: '/learning-tasks',
      actionText: '確認する',
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    
    // Windows通知も表示
    showWindowsNotification(
      '新しい学習指示',
      `「${assignmentTitle}」が割り当てられました`,
      '/icons/assignment.png'
    );
  }, [showWindowsNotification]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const clearAllNotifications = clearAll;

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      markAsRead,
      markAllAsRead,
      clearAll,
      addAssignmentNotification,
      unreadCount,
      isOnline,
      clearAllNotifications,
      fetchNotifications,
      isLoading,
      debugInfo,
      showWindowsNotification,
      requestNotificationPermission,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}