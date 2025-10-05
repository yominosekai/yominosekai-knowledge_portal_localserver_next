'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
}

interface RealTimeNotificationsProps {
  userId: string;
  className?: string;
}

export function RealTimeNotifications({ userId, className = '' }: RealTimeNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // WebSocketは現在無効化
    // connectWebSocket();
    
    // 既存の通知を読み込み
    loadNotifications();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [userId]);

  const connectWebSocket = () => {
    // WebSocketは現在実装されていないため、無効化
    setIsConnected(false);
  };

  const loadNotifications = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/notifications`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('通知の読み込みに失敗:', error);
    }
  };

  const handleNotification = (notificationData: any) => {
    if (!notificationData || typeof notificationData !== 'object') {
      console.warn('Invalid notification data:', notificationData);
      return;
    }
    
    const notification: Notification = {
      id: notificationData.id || Date.now().toString(),
      type: notificationData.type || 'info',
      title: notificationData.title || '通知',
      message: notificationData.message || '',
      timestamp: new Date(notificationData.timestamp || Date.now()),
      read: false,
      actionUrl: notificationData.actionUrl || undefined,
      actionText: notificationData.actionText || undefined
    };

    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // ブラウザ通知を表示
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/icons/assignment.png'
      });
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/notifications/${notificationId}/read`, {
        method: 'PUT'
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId ? { ...notif, read: true } : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('通知の既読化に失敗:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/notifications/read-all`, {
        method: 'PUT'
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('全通知の既読化に失敗:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/notifications/${notificationId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('通知の削除に失敗:', error);
    }
  };

  const requestNotificationPermission = async () => {
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('ブラウザ通知が有効になりました');
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-400 bg-green-400/20';
      case 'warning': return 'text-yellow-400 bg-yellow-400/20';
      case 'error': return 'text-red-400 bg-red-400/20';
      default: return 'text-blue-400 bg-blue-400/20';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* 通知ベル */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 text-white/70 hover:text-white transition-colors"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        {!isConnected && (
          <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full"></span>
        )}
      </button>

      {/* 通知パネル */}
      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">通知</h3>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-500 hover:text-blue-700"
                  >
                    すべて既読
                  </button>
                )}
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                通知はありません
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-800 truncate">
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400">
                          {notification.timestamp.toLocaleString('ja-JP')}
                        </span>
                        <div className="flex gap-2">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs text-blue-500 hover:text-blue-700"
                            >
                              既読
                            </button>
                          )}
                          {notification.actionUrl && (
                            <a
                              href={notification.actionUrl}
                              className="text-xs text-green-500 hover:text-green-700"
                            >
                              {notification.actionText || '詳細'}
                            </a>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="text-xs text-red-500 hover:text-red-700"
                          >
                            削除
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-gray-200">
            <button
              onClick={requestNotificationPermission}
              className="w-full text-sm text-blue-500 hover:text-blue-700"
            >
              ブラウザ通知を有効にする
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
