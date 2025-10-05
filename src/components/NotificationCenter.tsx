'use client';

import { useState, useEffect, useRef } from 'react';
import { useNotifications } from '../contexts/NotificationContext';

export function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    isOnline,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    fetchNotifications,
    isLoading,
    debugInfo,
    showWindowsNotification,
    requestNotificationPermission
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // 通知エリア外クリックで自動閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

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

  const formatTime = (timestamp: string): string => {
    const now = new Date();
    const date = new Date(timestamp);
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
    <div className="relative" ref={notificationRef}>
      {/* 通知ボタン */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-colors"
        title="通知"
      >
        {/* ベルアイコン */}
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.73 21a2 2 0 0 1-3.46 0" />
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
            {isLoading ? (
              <div className="p-6 text-center text-white/50">
                読み込み中...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-white/50">
                <div className="mb-4">
                  通知はありません
                </div>
                
                {/* デバッグ情報 */}
                <div className="text-xs text-white/30 space-y-2 border-t border-white/10 pt-4">
                  <div className="font-mono">
                    <div>ステータス: {debugInfo.lastFetchStatus}</div>
                    {debugInfo.lastFetchTime && (
                      <div>最終取得: {new Date(debugInfo.lastFetchTime).toLocaleTimeString()}</div>
                    )}
                    {debugInfo.lastFetchError && (
                      <div className="text-red-400 mt-2">
                        エラー: {debugInfo.lastFetchError}
                      </div>
                    )}
                    {debugInfo.apiResponse && (
                      <div className="mt-2">
                        <details className="text-left">
                          <summary className="cursor-pointer hover:text-white/50">
                            API応答を表示
                          </summary>
                          <pre className="mt-2 text-xs bg-black/50 p-2 rounded overflow-auto max-h-32">
                            {JSON.stringify(debugInfo.apiResponse, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={fetchNotifications}
                    className="mt-3 px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 rounded text-xs transition-colors"
                  >
                    再読み込み
                  </button>
                </div>
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
                                onClick={() => {
                                  markAsRead(notification.id);
                                  // 既読にするだけで、通知は削除しない
                                }}
                                className="text-xs text-brand hover:text-brand-dark px-2 py-1 rounded bg-brand/20 hover:bg-brand/30 transition-colors"
                              >
                                確認
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
              
              {/* テスト用Windows通知ボタン */}
              <div className="mt-2 flex space-x-2">
                <button
                  onClick={() => {
                    console.log('Testing Windows notification...');
                    showWindowsNotification('テスト通知', 'これはテスト用のWindows通知です');
                  }}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
                >
                  Windows通知テスト
                </button>
                <button
                  onClick={async () => {
                    const granted = await requestNotificationPermission();
                    console.log('Notification permission granted:', granted);
                  }}
                  className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"
                >
                  許可再取得
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}



