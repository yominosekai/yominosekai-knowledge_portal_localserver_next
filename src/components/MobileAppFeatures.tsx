'use client';

import React, { useState, useEffect } from 'react';

interface MobileAppFeaturesProps {
  className?: string;
}

export function MobileAppFeatures({ className = '' }: MobileAppFeaturesProps) {
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // PWAインストール状態をチェック
    checkPWAStatus();
    
    // オンライン/オフライン状態を監視
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // PWAインストールプロンプトを監視
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkPWAStatus = () => {
    // PWAがインストールされているかチェック
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsPWAInstalled(true);
    }
  };

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWAがインストールされました');
        setIsPWAInstalled(true);
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Knowledge Portal',
          text: '学習ポータルアプリをチェックしてください',
          url: window.location.href
        });
      } catch (error) {
        console.error('シェアエラー:', error);
      }
    } else {
      // フォールバック: クリップボードにコピー
      navigator.clipboard.writeText(window.location.href);
      alert('URLをクリップボードにコピーしました');
    }
  };

  const handleAddToHomeScreen = () => {
    // iOS Safari用の手動インストール手順を表示
    alert('iOS Safariの場合:\n1. 共有ボタンをタップ\n2. "ホーム画面に追加"を選択\n3. "追加"をタップ');
  };

  const getTouchGesture = (gesture: string) => {
    const gestures: Record<string, string> = {
      'swipe_left': '← スワイプ',
      'swipe_right': '→ スワイプ',
      'swipe_up': '↑ スワイプ',
      'swipe_down': '↓ スワイプ',
      'pinch': 'ピンチ',
      'tap': 'タップ',
      'long_press': '長押し',
      'double_tap': 'ダブルタップ'
    };
    return gestures[gesture] || gesture;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">モバイルアプリ機能</h2>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-white/70 text-sm">
            {isOnline ? 'オンライン' : 'オフライン'}
          </span>
        </div>
      </div>

      {/* PWAインストールプロンプト */}
      {showInstallPrompt && !isPWAInstalled && (
        <div className="rounded-lg bg-blue-500/20 p-4 ring-1 ring-blue-500/30">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold">アプリをインストール</h3>
              <p className="text-white/70 text-sm">
                ホーム画面に追加して、ネイティブアプリのように使用できます
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleInstallPWA}
                className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors text-sm"
              >
                インストール
              </button>
              <button
                onClick={() => setShowInstallPrompt(false)}
                className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-600 transition-colors text-sm"
              >
                後で
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PWAステータス */}
      <div className="rounded-lg bg-white/5 p-6 ring-1 ring-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">PWA (Progressive Web App) 機能</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📱</span>
              <div>
                <h4 className="text-white font-medium">インストール状態</h4>
                <p className="text-white/70 text-sm">
                  {isPWAInstalled ? 'インストール済み' : '未インストール'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔔</span>
              <div>
                <h4 className="text-white font-medium">プッシュ通知</h4>
                <p className="text-white/70 text-sm">対応</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-2xl">📶</span>
              <div>
                <h4 className="text-white font-medium">オフライン対応</h4>
                <p className="text-white/70 text-sm">対応</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚡</span>
              <div>
                <h4 className="text-white font-medium">高速読み込み</h4>
                <p className="text-white/70 text-sm">Service Worker対応</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔒</span>
              <div>
                <h4 className="text-white font-medium">セキュア</h4>
                <p className="text-white/70 text-sm">HTTPS必須</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-2xl">📱</span>
              <div>
                <h4 className="text-white font-medium">レスポンシブ</h4>
                <p className="text-white/70 text-sm">全デバイス対応</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* タッチ操作ガイド */}
      <div className="rounded-lg bg-white/5 p-6 ring-1 ring-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">タッチ操作ガイド</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { gesture: 'tap', description: 'アイテムを選択・実行' },
            { gesture: 'long_press', description: 'コンテキストメニューを表示' },
            { gesture: 'double_tap', description: '詳細表示・ズーム' },
            { gesture: 'swipe_left', description: '次のページ・アイテム' },
            { gesture: 'swipe_right', description: '前のページ・アイテム' },
            { gesture: 'swipe_up', description: '上にスクロール' },
            { gesture: 'swipe_down', description: '下にスクロール' },
            { gesture: 'pinch', description: 'ズームイン・アウト' }
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-3 p-3 rounded bg-black/20">
              <div className="w-12 h-12 rounded bg-brand/20 flex items-center justify-center text-brand font-bold">
                {getTouchGesture(item.gesture)}
              </div>
              <div>
                <h4 className="text-white font-medium">{item.gesture}</h4>
                <p className="text-white/70 text-sm">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* モバイル最適化機能 */}
      <div className="rounded-lg bg-white/5 p-6 ring-1 ring-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">モバイル最適化機能</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded bg-black/20">
            <div className="flex items-center gap-3">
              <span className="text-2xl">👆</span>
              <div>
                <h4 className="text-white font-medium">タッチフレンドリーUI</h4>
                <p className="text-white/70 text-sm">指で操作しやすいボタンサイズと間隔</p>
              </div>
            </div>
            <span className="text-green-400 text-sm">✓ 有効</span>
          </div>
          
          <div className="flex items-center justify-between p-4 rounded bg-black/20">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📱</span>
              <div>
                <h4 className="text-white font-medium">レスポンシブデザイン</h4>
                <p className="text-white/70 text-sm">画面サイズに応じたレイアウト調整</p>
              </div>
            </div>
            <span className="text-green-400 text-sm">✓ 有効</span>
          </div>
          
          <div className="flex items-center justify-between p-4 rounded bg-black/20">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚡</span>
              <div>
                <h4 className="text-white font-medium">パフォーマンス最適化</h4>
                <p className="text-white/70 text-sm">モバイル向けの高速読み込み</p>
              </div>
            </div>
            <span className="text-green-400 text-sm">✓ 有効</span>
          </div>
          
          <div className="flex items-center justify-between p-4 rounded bg-black/20">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔔</span>
              <div>
                <h4 className="text-white font-medium">プッシュ通知</h4>
                <p className="text-white/70 text-sm">重要な更新の通知</p>
              </div>
            </div>
            <span className="text-green-400 text-sm">✓ 有効</span>
          </div>
        </div>
      </div>

      {/* アクション */}
      <div className="flex gap-4 flex-wrap">
        {!isPWAInstalled && (
          <button
            onClick={handleInstallPWA}
            className="px-6 py-3 rounded bg-brand text-white hover:bg-brand-dark transition-colors flex items-center gap-2"
          >
            <span>📱</span>
            アプリをインストール
          </button>
        )}
        
        <button
          onClick={handleAddToHomeScreen}
          className="px-6 py-3 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors flex items-center gap-2"
        >
          <span>🏠</span>
          ホーム画面に追加
        </button>
        
        <button
          onClick={handleShare}
          className="px-6 py-3 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors flex items-center gap-2"
        >
          <span>📤</span>
          シェア
        </button>
      </div>

      {/* インストール手順 */}
      <div className="rounded-lg bg-white/5 p-6 ring-1 ring-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">インストール手順</h3>
        
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-brand text-white text-sm flex items-center justify-center font-bold">1</span>
            <div>
              <h4 className="text-white font-medium">Android Chrome</h4>
              <p className="text-white/70 text-sm">
                メニュー → "ホーム画面に追加" → "追加"
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-brand text-white text-sm flex items-center justify-center font-bold">2</span>
            <div>
              <h4 className="text-white font-medium">iOS Safari</h4>
              <p className="text-white/70 text-sm">
                共有ボタン → "ホーム画面に追加" → "追加"
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-brand text-white text-sm flex items-center justify-center font-bold">3</span>
            <div>
              <h4 className="text-white font-medium">デスクトップ</h4>
              <p className="text-white/70 text-sm">
                アドレスバーのインストールアイコンをクリック
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


