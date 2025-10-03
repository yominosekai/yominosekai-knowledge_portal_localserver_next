'use client';

import React, { useState, useEffect } from 'react';

interface ContentAnalyticsProps {
  contentId: string;
  className?: string;
}

interface AnalyticsData {
  views: number;
  completions: number;
  averageRating: number;
  totalRatings: number;
  completionRate: number;
  averageTimeSpent: number;
  popularityScore: number;
  recentActivity: Activity[];
  userEngagement: EngagementData;
}

interface Activity {
  id: string;
  type: 'view' | 'start' | 'complete' | 'rating';
  userId: string;
  timestamp: string;
  metadata?: any;
}

interface EngagementData {
  dailyViews: { date: string; views: number }[];
  completionTrend: { date: string; completions: number }[];
  ratingDistribution: { rating: number; count: number }[];
  timeSpentDistribution: { range: string; count: number }[];
}

export function ContentAnalytics({ contentId, className = '' }: ContentAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    loadAnalytics();
  }, [contentId, timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      // 実際のAPIから分析データを取得
      // const response = await fetch(`/api/content/${contentId}/analytics?range=${timeRange}`);
      // const data = await response.json();
      
      // モックデータ
      const mockAnalytics: AnalyticsData = {
        views: 1250,
        completions: 342,
        averageRating: 4.2,
        totalRatings: 89,
        completionRate: 27.4,
        averageTimeSpent: 45,
        popularityScore: 8.7,
        recentActivity: [
          { id: '1', type: 'view', userId: 'user1', timestamp: '2024-01-15T10:30:00Z' },
          { id: '2', type: 'complete', userId: 'user2', timestamp: '2024-01-15T11:15:00Z' },
          { id: '3', type: 'rating', userId: 'user3', timestamp: '2024-01-15T12:00:00Z', metadata: { rating: 5 } },
          { id: '4', type: 'start', userId: 'user4', timestamp: '2024-01-15T13:30:00Z' },
          { id: '5', type: 'view', userId: 'user5', timestamp: '2024-01-15T14:45:00Z' }
        ],
        userEngagement: {
          dailyViews: [
            { date: '2024-01-09', views: 45 },
            { date: '2024-01-10', views: 52 },
            { date: '2024-01-11', views: 38 },
            { date: '2024-01-12', views: 61 },
            { date: '2024-01-13', views: 48 },
            { date: '2024-01-14', views: 55 },
            { date: '2024-01-15', views: 42 }
          ],
          completionTrend: [
            { date: '2024-01-09', completions: 12 },
            { date: '2024-01-10', completions: 15 },
            { date: '2024-01-11', completions: 8 },
            { date: '2024-01-12', completions: 18 },
            { date: '2024-01-13', completions: 14 },
            { date: '2024-01-14', completions: 16 },
            { date: '2024-01-15', completions: 11 }
          ],
          ratingDistribution: [
            { rating: 1, count: 2 },
            { rating: 2, count: 5 },
            { rating: 3, count: 12 },
            { rating: 4, count: 28 },
            { rating: 5, count: 42 }
          ],
          timeSpentDistribution: [
            { range: '0-15分', count: 45 },
            { range: '15-30分', count: 78 },
            { range: '30-45分', count: 92 },
            { range: '45-60分', count: 67 },
            { range: '60分以上', count: 60 }
          ]
        }
      };
      
      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('分析データの読み込みに失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderSimpleChart = (data: { label: string; value: number; color: string }[]) => {
    const maxValue = Math.max(...data.map(d => d.value));
    
    return (
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <span className="text-sm text-white/70 w-20">{item.label}</span>
            <div className="flex-1 bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300`}
                style={{ 
                  width: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: item.color
                }}
              />
            </div>
            <span className="text-sm text-white/70 w-8">{item.value}</span>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-64 ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand border-t-transparent"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-white/70">分析データがありません</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">コンテンツ分析</h2>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as any)}
          className="rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white"
        >
          <option value="7d">過去7日</option>
          <option value="30d">過去30日</option>
          <option value="90d">過去90日</option>
          <option value="1y">過去1年</option>
        </select>
      </div>

      {/* 主要指標 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg bg-white/5 p-4 ring-1 ring-white/10 text-center">
          <div className="text-2xl font-bold text-blue-400">{analytics.views.toLocaleString()}</div>
          <div className="text-white/70 text-sm">総閲覧数</div>
        </div>
        <div className="rounded-lg bg-white/5 p-4 ring-1 ring-white/10 text-center">
          <div className="text-2xl font-bold text-green-400">{analytics.completions.toLocaleString()}</div>
          <div className="text-white/70 text-sm">完了数</div>
        </div>
        <div className="rounded-lg bg-white/5 p-4 ring-1 ring-white/10 text-center">
          <div className="text-2xl font-bold text-yellow-400">{analytics.averageRating.toFixed(1)}</div>
          <div className="text-white/70 text-sm">平均評価</div>
        </div>
        <div className="rounded-lg bg-white/5 p-4 ring-1 ring-white/10 text-center">
          <div className="text-2xl font-bold text-purple-400">{analytics.completionRate.toFixed(1)}%</div>
          <div className="text-white/70 text-sm">完了率</div>
        </div>
      </div>

      {/* 詳細分析 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 評価分布 */}
        <div className="rounded-lg bg-white/5 p-6 ring-1 ring-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">評価分布</h3>
          {renderSimpleChart(
            analytics.userEngagement.ratingDistribution.map(r => ({
              label: `${r.rating}星`,
              value: r.count,
              color: r.rating >= 4 ? '#10b981' : r.rating >= 3 ? '#f59e0b' : '#ef4444'
            }))
          )}
        </div>

        {/* 学習時間分布 */}
        <div className="rounded-lg bg-white/5 p-6 ring-1 ring-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">学習時間分布</h3>
          {renderSimpleChart(
            analytics.userEngagement.timeSpentDistribution.map(t => ({
              label: t.range,
              value: t.count,
              color: '#3b82f6'
            }))
          )}
        </div>
      </div>

      {/* トレンド分析 */}
      <div className="rounded-lg bg-white/5 p-6 ring-1 ring-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">閲覧数トレンド</h3>
        <div className="h-64 flex items-end justify-between gap-1">
          {analytics.userEngagement.dailyViews.map((day, index) => {
            const maxViews = Math.max(...analytics.userEngagement.dailyViews.map(d => d.views));
            const height = (day.views / maxViews) * 100;
            
            return (
              <div key={index} className="flex flex-col items-center gap-2">
                <div 
                  className="bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-400"
                  style={{ height: `${height}%`, minHeight: '4px', width: '20px' }}
                />
                <span className="text-xs text-white/50">{day.views}</span>
                <span className="text-xs text-white/50 transform -rotate-45">
                  {new Date(day.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 最近の活動 */}
      <div className="rounded-lg bg-white/5 p-6 ring-1 ring-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">最近の活動</h3>
        <div className="space-y-3">
          {analytics.recentActivity.slice(0, 10).map((activity) => (
            <div key={activity.id} className="flex items-center gap-3 p-3 rounded bg-black/20">
              <div className="text-lg">
                {activity.type === 'view' && '👁️'}
                {activity.type === 'start' && '▶️'}
                {activity.type === 'complete' && '✅'}
                {activity.type === 'rating' && '⭐'}
              </div>
              <div className="flex-1">
                <div className="text-white text-sm">
                  {activity.type === 'view' && '閲覧'}
                  {activity.type === 'start' && '学習開始'}
                  {activity.type === 'complete' && '学習完了'}
                  {activity.type === 'rating' && `評価 ${activity.metadata?.rating}星`}
                </div>
                <div className="text-white/50 text-xs">
                  {new Date(activity.timestamp).toLocaleString('ja-JP')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 人気度スコア */}
      <div className="rounded-lg bg-white/5 p-6 ring-1 ring-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">人気度スコア</h3>
        <div className="flex items-center gap-4">
          <div className="text-4xl font-bold text-white">{analytics.popularityScore.toFixed(1)}</div>
          <div className="flex-1">
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${(analytics.popularityScore / 10) * 100}%` }}
              />
            </div>
            <div className="text-white/70 text-sm mt-2">
              閲覧数、完了率、評価を総合した人気度指標
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



