'use client';

import React, { useState, useEffect } from 'react';

interface ActivityEvent {
  id: string;
  userId: string;
  type: 'page_view' | 'content_view' | 'content_complete' | 'search' | 'download' | 'login' | 'logout' | 'error';
  action: string;
  details: Record<string, any>;
  timestamp: string;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  duration?: number;
}

interface ActivityStats {
  totalEvents: number;
  uniqueUsers: number;
  pageViews: number;
  contentViews: number;
  searches: number;
  downloads: number;
  averageSessionDuration: number;
  topPages: { page: string; views: number }[];
  topContent: { contentId: string; title: string; views: number }[];
  topSearches: { query: string; count: number }[];
  hourlyActivity: { hour: number; events: number }[];
  dailyActivity: { date: string; events: number }[];
  userEngagement: {
    activeUsers: number;
    returningUsers: number;
    newUsers: number;
    bounceRate: number;
  };
}

interface UserActivityTrackingProps {
  className?: string;
}

export function UserActivityTracking({ className = '' }: UserActivityTrackingProps) {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [filterType, setFilterType] = useState<'all' | 'page_view' | 'content_view' | 'search' | 'error'>('all');
  const [showDetails, setShowDetails] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityEvent | null>(null);

  useEffect(() => {
    loadActivities();
    loadStats();
  }, [timeRange]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      // 実際のAPIからアクティビティを取得
      // const response = await fetch(`/api/analytics/activities?range=${timeRange}`);
      // const data = await response.json();
      
      // モックデータ
      const mockActivities: ActivityEvent[] = [
        {
          id: '1',
          userId: 'user-1',
          type: 'page_view',
          action: 'viewed_dashboard',
          details: { page: '/dashboard', referrer: 'https://google.com' },
          timestamp: '2024-01-15T10:30:00Z',
          sessionId: 'session-1',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          duration: 45
        },
        {
          id: '2',
          userId: 'user-1',
          type: 'content_view',
          action: 'viewed_content',
          details: { contentId: 'content-1', title: 'React入門ガイド', category: 'プログラミング' },
          timestamp: '2024-01-15T10:32:00Z',
          sessionId: 'session-1',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          duration: 120
        },
        {
          id: '3',
          userId: 'user-2',
          type: 'search',
          action: 'searched_content',
          details: { query: 'React', results: 15, filters: { category: 'プログラミング' } },
          timestamp: '2024-01-15T10:35:00Z',
          sessionId: 'session-2',
          ipAddress: '192.168.1.101',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          duration: 30
        },
        {
          id: '4',
          userId: 'user-1',
          type: 'content_complete',
          action: 'completed_content',
          details: { contentId: 'content-1', title: 'React入門ガイド', score: 85, timeSpent: 1800 },
          timestamp: '2024-01-15T10:45:00Z',
          sessionId: 'session-1',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        {
          id: '5',
          userId: 'user-3',
          type: 'download',
          action: 'downloaded_file',
          details: { contentId: 'content-2', fileName: 'nextjs-guide.pdf', fileSize: 2048576 },
          timestamp: '2024-01-15T11:00:00Z',
          sessionId: 'session-3',
          ipAddress: '192.168.1.102',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15',
          duration: 15
        },
        {
          id: '6',
          userId: 'user-2',
          type: 'error',
          action: 'api_error',
          details: { error: 'Network timeout', endpoint: '/api/content/load', statusCode: 500 },
          timestamp: '2024-01-15T11:15:00Z',
          sessionId: 'session-2',
          ipAddress: '192.168.1.101',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      ];
      
      setActivities(mockActivities);
    } catch (error) {
      console.error('アクティビティの読み込みに失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // 実際のAPIから統計を取得
      // const response = await fetch(`/api/analytics/stats?range=${timeRange}`);
      // const data = await response.json();
      
      // モックデータ
      const mockStats: ActivityStats = {
        totalEvents: 1250,
        uniqueUsers: 45,
        pageViews: 890,
        contentViews: 320,
        searches: 85,
        downloads: 45,
        averageSessionDuration: 25.5,
        topPages: [
          { page: '/dashboard', views: 234 },
          { page: '/content', views: 189 },
          { page: '/progress', views: 156 },
          { page: '/profile', views: 98 }
        ],
        topContent: [
          { contentId: 'content-1', title: 'React入門ガイド', views: 89 },
          { contentId: 'content-2', title: 'Next.js実践講座', views: 67 },
          { contentId: 'content-3', title: 'TypeScript完全ガイド', views: 54 }
        ],
        topSearches: [
          { query: 'React', count: 23 },
          { query: 'TypeScript', count: 18 },
          { query: 'Next.js', count: 15 },
          { query: 'JavaScript', count: 12 }
        ],
        hourlyActivity: [
          { hour: 9, events: 45 },
          { hour: 10, events: 78 },
          { hour: 11, events: 92 },
          { hour: 12, events: 65 },
          { hour: 13, events: 58 },
          { hour: 14, events: 73 },
          { hour: 15, events: 89 },
          { hour: 16, events: 95 },
          { hour: 17, events: 67 },
          { hour: 18, events: 43 }
        ],
        dailyActivity: [
          { date: '2024-01-09', events: 234 },
          { date: '2024-01-10', events: 267 },
          { date: '2024-01-11', events: 189 },
          { date: '2024-01-12', events: 312 },
          { date: '2024-01-13', events: 298 },
          { date: '2024-01-14', events: 156 },
          { date: '2024-01-15', events: 289 }
        ],
        userEngagement: {
          activeUsers: 32,
          returningUsers: 28,
          newUsers: 4,
          bounceRate: 15.2
        }
      };
      
      setStats(mockStats);
    } catch (error) {
      console.error('統計の読み込みに失敗:', error);
    }
  };

  const filteredActivities = activities.filter(activity => {
    if (filterType === 'all') return true;
    return activity.type === filterType;
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'page_view': return '👁️';
      case 'content_view': return '📄';
      case 'content_complete': return '✅';
      case 'search': return '🔍';
      case 'download': return '📥';
      case 'login': return '🔑';
      case 'logout': return '🚪';
      case 'error': return '❌';
      default: return '📊';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'page_view': return 'text-blue-400 bg-blue-400/20';
      case 'content_view': return 'text-green-400 bg-green-400/20';
      case 'content_complete': return 'text-green-500 bg-green-500/20';
      case 'search': return 'text-yellow-400 bg-yellow-400/20';
      case 'download': return 'text-purple-400 bg-purple-400/20';
      case 'login': return 'text-green-400 bg-green-400/20';
      case 'logout': return 'text-gray-400 bg-gray-400/20';
      case 'error': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-';
    if (seconds < 60) return `${seconds}秒`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}分${remainingSeconds}秒`;
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-64 ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">ユーザー活動追跡</h2>
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white"
          >
            <option value="1h">過去1時間</option>
            <option value="24h">過去24時間</option>
            <option value="7d">過去7日</option>
            <option value="30d">過去30日</option>
          </select>
        </div>
      </div>

      {/* 統計サマリー */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg bg-white/5 p-4 ring-1 ring-white/10 text-center">
            <div className="text-2xl font-bold text-blue-400">{stats.totalEvents}</div>
            <div className="text-white/70 text-sm">総イベント数</div>
          </div>
          <div className="rounded-lg bg-white/5 p-4 ring-1 ring-white/10 text-center">
            <div className="text-2xl font-bold text-green-400">{stats.uniqueUsers}</div>
            <div className="text-white/70 text-sm">ユニークユーザー</div>
          </div>
          <div className="rounded-lg bg-white/5 p-4 ring-1 ring-white/10 text-center">
            <div className="text-2xl font-bold text-yellow-400">{stats.pageViews}</div>
            <div className="text-white/70 text-sm">ページビュー</div>
          </div>
          <div className="rounded-lg bg-white/5 p-4 ring-1 ring-white/10 text-center">
            <div className="text-2xl font-bold text-purple-400">{stats.averageSessionDuration.toFixed(1)}分</div>
            <div className="text-white/70 text-sm">平均セッション時間</div>
          </div>
        </div>
      )}

      {/* フィルター */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all', label: 'すべて' },
          { key: 'page_view', label: 'ページビュー' },
          { key: 'content_view', label: 'コンテンツ閲覧' },
          { key: 'search', label: '検索' },
          { key: 'error', label: 'エラー' }
        ].map(filterOption => (
          <button
            key={filterOption.key}
            onClick={() => setFilterType(filterOption.key as any)}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              filterType === filterOption.key
                ? 'bg-brand text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            {filterOption.label}
          </button>
        ))}
      </div>

      {/* 活動一覧 */}
      <div className="space-y-3">
        {filteredActivities.map((activity) => (
          <div
            key={activity.id}
            className="rounded-lg bg-white/5 p-4 ring-1 ring-white/10 hover:ring-white/20 transition-colors cursor-pointer"
            onClick={() => {
              setSelectedActivity(activity);
              setShowDetails(true);
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getActivityIcon(activity.type)}</span>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getActivityColor(activity.type)}`}>
                    {activity.type}
                  </span>
                  <span className="text-white font-medium">{activity.action}</span>
                </div>
                
                <div className="text-white/70 text-sm mb-1">
                  {activity.details.page && `ページ: ${activity.details.page}`}
                  {activity.details.contentId && `コンテンツ: ${activity.details.title || activity.details.contentId}`}
                  {activity.details.query && `検索: "${activity.details.query}"`}
                  {activity.details.error && `エラー: ${activity.details.error}`}
                </div>
                
                <div className="flex items-center gap-4 text-xs text-white/50">
                  <span>ユーザー: {activity.userId}</span>
                  <span>セッション: {activity.sessionId}</span>
                  <span>{new Date(activity.timestamp).toLocaleString('ja-JP')}</span>
                  {activity.duration && (
                    <span>継続時間: {formatDuration(activity.duration)}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredActivities.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-white/70">該当する活動がありません</p>
        </div>
      )}

      {/* 詳細モーダル */}
      {showDetails && selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-800">活動詳細</h2>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">基本情報</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">ID:</span>
                      <span className="ml-2 text-gray-800">{selectedActivity.id}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">タイプ:</span>
                      <span className="ml-2 text-gray-800">{selectedActivity.type}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">アクション:</span>
                      <span className="ml-2 text-gray-800">{selectedActivity.action}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">ユーザーID:</span>
                      <span className="ml-2 text-gray-800">{selectedActivity.userId}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">セッションID:</span>
                      <span className="ml-2 text-gray-800">{selectedActivity.sessionId}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">タイムスタンプ:</span>
                      <span className="ml-2 text-gray-800">
                        {new Date(selectedActivity.timestamp).toLocaleString('ja-JP')}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">IPアドレス:</span>
                      <span className="ml-2 text-gray-800">{selectedActivity.ipAddress}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">継続時間:</span>
                      <span className="ml-2 text-gray-800">
                        {formatDuration(selectedActivity.duration)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">詳細情報</h3>
                  <pre className="bg-gray-50 rounded p-4 text-sm text-gray-700 overflow-x-auto">
                    {JSON.stringify(selectedActivity.details, null, 2)}
                  </pre>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">ユーザーエージェント</h3>
                  <p className="text-sm text-gray-700 break-all">{selectedActivity.userAgent}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



