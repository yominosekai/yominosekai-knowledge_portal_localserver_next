'use client';

import { useState, useEffect } from 'react';

interface ConnectionStatusProps {
  className?: string;
}

export function ConnectionStatus({ className = '' }: ConnectionStatusProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [serverStatus, setServerStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

  useEffect(() => {
    // ブラウザのオンライン状態を監視
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // サーバー状態を定期的にチェック
    const checkServerStatus = async () => {
      try {
        setServerStatus('checking');
        const response = await fetch('/api/health', { 
          method: 'GET',
          signal: AbortSignal.timeout(5000) // 5秒でタイムアウト
        });
        
        if (response.ok) {
          setServerStatus('connected');
        } else {
          setServerStatus('disconnected');
        }
      } catch (error) {
        setServerStatus('disconnected');
      }
    };

    // 初回チェック
    checkServerStatus();

    // 30秒ごとにチェック
    const interval = setInterval(checkServerStatus, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const getStatusText = () => {
    if (!isOnline) return 'オフライン';
    if (serverStatus === 'checking') return '接続確認中...';
    if (serverStatus === 'connected') return 'サーバー接続済み';
    return 'サーバー切断';
  };

  const getStatusColor = () => {
    if (!isOnline) return 'text-red-400';
    if (serverStatus === 'checking') return 'text-yellow-400';
    if (serverStatus === 'connected') return 'text-green-400';
    return 'text-red-400';
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${
        !isOnline ? 'bg-red-400' : 
        serverStatus === 'checking' ? 'bg-yellow-400 animate-pulse' :
        serverStatus === 'connected' ? 'bg-green-400' : 'bg-red-400'
      }`} />
      <span className={`text-sm ${getStatusColor()}`}>
        {getStatusText()}
      </span>
    </div>
  );
}


