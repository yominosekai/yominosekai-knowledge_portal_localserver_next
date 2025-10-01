'use client';

import { useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';

export function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    isOnline,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);

  const getNotificationIcon = (type: string): string => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  };

  const getNotificationColor = (type: string): string => {
    switch (type) {
      case 'success': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      case 'info': return 'text-blue-400';
      default: return 'text-white/70';
    }
  };

  const formatTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'たった今';
    if (minutes < 60) return `${minutes}分前`;
    if (hours < 24) return `${hours}時間前`;
    return `${days}日前`;
  };

  return (
    <div className="relative">
      {/* 通知ボタン */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg bg-black/20 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 7H4l5-5v5z" />
        </svg>
        
        {/* 未読バッジ */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* オンライン状態インジケーター */}
        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${
          isOnline ? 'bg-green-500' : 'bg-red-500'
        }`} />
      </button>

      {/* 通知パネル */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-black/90 backdrop-blur-sm rounded-lg ring-1 ring-white/10 z-50 max-h-96 overflow-hidden">
          {/* ヘッダー */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h3 className="text-lg font-semibold text-white">通知</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-brand hover:text-brand-dark"
                >
                  すべて既読
                </button>
              )}
              <button
                onClick={clearAllNotifications}
                className="text-xs text-white/50 hover:text-white"
              >
                クリア
              </button>
            </div>
          </div>

          {/* 通知一覧 */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-white/50">
                通知はありません
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-white/5 transition-colors ${
                      !notification.read ? 'bg-blue-500/5' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-lg">
                        {getNotificationIcon(notification.type)}
                      </span>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h4 className={`text-sm font-medium ${getNotificationColor(notification.type)}`}>
                            {notification.title}
                          </h4>
                          <div className="flex items-center space-x-1">
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            )}
                            <button
                              onClick={() => removeNotification(notification.id)}
                              className="text-white/30 hover:text-white/50"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        
                        <p className="text-sm text-white/70 mt-1">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-white/50">
                            {formatTime(notification.timestamp)}
                          </span>
                          
                          <div className="flex items-center space-x-2">
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="text-xs text-brand hover:text-brand-dark"
                              >
                                既読
                              </button>
                            )}
                            {notification.actionUrl && (
                              <a
                                href={notification.actionUrl}
                                className="text-xs text-blue-400 hover:text-blue-300"
                              >
                                {notification.actionText || '詳細'}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* フッター */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-white/10 bg-black/20">
              <div className="flex items-center justify-between text-xs text-white/50">
                <span>接続状態: {isOnline ? 'オンライン' : 'オフライン'}</span>
                <span>{notifications.length}件の通知</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


