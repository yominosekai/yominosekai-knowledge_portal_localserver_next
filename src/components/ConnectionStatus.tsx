'use client';

import { useState, useEffect } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';

interface ConnectionStatusProps {
  className?: string;
}

export function ConnectionStatus({ className = '' }: ConnectionStatusProps) {
  const [isOnline, setIsOnline] = useState(true);
  const { debugInfo } = useNotifications();

  useEffect(() => {
    // ブラウザのオンライン状態を監視
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getStatusText = () => {
    if (!isOnline) return 'オフライン';
    // 短時間のloading状態は表示しない（ちらつき防止）
    if (debugInfo.lastFetchStatus === 'loading' && debugInfo.lastFetchTime) {
      const loadingTime = Date.now() - new Date(debugInfo.lastFetchTime).getTime();
      if (loadingTime < 1000) { // 1秒未満のloadingは無視
        return 'サーバー接続済み';
      }
    }
    if (debugInfo.lastFetchStatus === 'loading') return '接続確認中...';
    if (debugInfo.lastFetchStatus === 'success') return 'サーバー接続済み';
    if (debugInfo.lastFetchStatus === 'error') return 'サーバー切断';
    return 'サーバー接続済み';
  };

  const getStatusColor = () => {
    if (!isOnline) return 'text-red-400';
    // 短時間のloading状態は表示しない（ちらつき防止）
    if (debugInfo.lastFetchStatus === 'loading' && debugInfo.lastFetchTime) {
      const loadingTime = Date.now() - new Date(debugInfo.lastFetchTime).getTime();
      if (loadingTime < 1000) { // 1秒未満のloadingは無視
        return 'text-green-400';
      }
    }
    if (debugInfo.lastFetchStatus === 'loading') return 'text-yellow-400';
    if (debugInfo.lastFetchStatus === 'success') return 'text-green-400';
    if (debugInfo.lastFetchStatus === 'error') return 'text-red-400';
    return 'text-green-400';
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${
        !isOnline ? 'bg-red-400' : 
        (debugInfo.lastFetchStatus === 'loading' && debugInfo.lastFetchTime && 
         Date.now() - new Date(debugInfo.lastFetchTime).getTime() >= 1000) ? 'bg-yellow-400 animate-pulse' :
        debugInfo.lastFetchStatus === 'success' ? 'bg-green-400' : 
        debugInfo.lastFetchStatus === 'error' ? 'bg-red-400' : 'bg-green-400'
      }`} />
      <span className={`text-sm ${getStatusColor()}`}>
        {getStatusText()}
      </span>
    </div>
  );
}



