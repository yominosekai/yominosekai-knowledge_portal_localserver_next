'use client';

import React, { useState, useEffect } from 'react';

interface OfflineModeProps {
  className?: string;
}

export function OfflineMode({ className = '' }: OfflineModeProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [offlineData, setOfflineData] = useState<any>(null);
  const [showOfflineIndicator, setShowOfflineIndicator] = useState(false);

  useEffect(() => {
    // オンライン/オフライン状態を監視
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineIndicator(false);
      // オフライン時に保存されたデータを同期
      syncOfflineData();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineIndicator(true);
      // オフライン用データを準備
      prepareOfflineData();
    };

    // 初期状態をチェック
    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Service Workerを登録
    registerServiceWorker();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  };

  const prepareOfflineData = async () => {
    try {
      // 重要なデータをローカルストレージに保存
      const criticalData = {
        user: localStorage.getItem('user'),
        content: localStorage.getItem('content'),
        progress: localStorage.getItem('progress'),
        timestamp: Date.now()
      };
      
      setOfflineData(criticalData);
      
      // IndexedDBにデータを保存
      await saveToIndexedDB(criticalData);
    } catch (error) {
      console.error('オフラインデータの準備に失敗:', error);
    }
  };

  const syncOfflineData = async () => {
    try {
      // オフライン時に保存されたデータをサーバーに同期
      const offlineData = await getFromIndexedDB();
      if (offlineData) {
        // サーバーに同期
        await fetch('/api/sync-offline-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(offlineData)
        });
        
        console.log('オフラインデータを同期しました');
      }
    } catch (error) {
      console.error('オフラインデータの同期に失敗:', error);
    }
  };

  const saveToIndexedDB = async (data: any) => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('KnowledgePortalOffline', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['offlineData'], 'readwrite');
        const store = transaction.objectStore('offlineData');
        
        store.put(data, 'critical');
        resolve(true);
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('offlineData')) {
          db.createObjectStore('offlineData');
        }
      };
    });
  };

  const getFromIndexedDB = async () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('KnowledgePortalOffline', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['offlineData'], 'readonly');
        const store = transaction.objectStore('offlineData');
        const getRequest = store.get('critical');
        
        getRequest.onsuccess = () => resolve(getRequest.result);
        getRequest.onerror = () => reject(getRequest.error);
      };
    });
  };

  const downloadOfflineContent = async () => {
    try {
      // 重要なコンテンツをダウンロード
      const response = await fetch('/api/offline-content');
      const data = await response.json();
      
      // ローカルストレージに保存
      localStorage.setItem('offlineContent', JSON.stringify(data));
      
      alert('オフライン用コンテンツをダウンロードしました');
    } catch (error) {
      console.error('オフラインコンテンツのダウンロードに失敗:', error);
      alert('ダウンロードに失敗しました');
    }
  };

  if (!showOfflineIndicator && isOnline) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 ${className}`}>
      {!isOnline ? (
        <div className="bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <span>📡</span>
          <span>オフラインモード</span>
        </div>
      ) : (
        <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <span>🔄</span>
          <span>データを同期中...</span>
        </div>
      )}
      
      {/* オフライン時の詳細パネル */}
      {!isOnline && (
        <div className="mt-2 bg-white rounded-lg shadow-xl p-4 w-80">
          <h3 className="font-semibold text-gray-800 mb-2">オフラインモード</h3>
          <p className="text-sm text-gray-600 mb-4">
            インターネット接続がありません。一部の機能は制限されます。
          </p>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-green-500">✓</span>
              <span>保存されたコンテンツの閲覧</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-green-500">✓</span>
              <span>学習進捗の記録</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-red-500">✗</span>
              <span>新しいコンテンツのダウンロード</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-red-500">✗</span>
              <span>リアルタイム同期</span>
            </div>
          </div>
          
          <div className="mt-4 flex gap-2">
            <button
              onClick={downloadOfflineContent}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
            >
              コンテンツをダウンロード
            </button>
            <button
              onClick={() => setShowOfflineIndicator(false)}
              className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}



