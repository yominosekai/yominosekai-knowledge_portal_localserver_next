'use client';

import { useState, useEffect } from 'react';
import { LearningCalendar } from './LearningCalendar';

interface LearningActivity {
  id: string;
  material_id: string;
  material_title: string;
  status: 'completed' | 'in_progress' | 'not_started';
  started_at?: string;
  completed_at?: string;
  duration_minutes?: number;
  progress_percentage: number;
}

interface LearningHistoryProps {
  userId: string;
  className?: string;
}

export function LearningHistory({ userId, className = '' }: LearningHistoryProps) {
  const [activities, setActivities] = useState<LearningActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'in_progress' | 'not_started'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  useEffect(() => {
    loadLearningHistory();
  }, [userId]);

  const loadLearningHistory = async () => {
    try {
      setIsLoading(true);
      // 実際のAPIから学習履歴を取得
      // const response = await fetch(`/api/users/${userId}/activities`);
      // const data = await response.json();
      
      // モックデータ
      const mockActivities: LearningActivity[] = [
        {
          id: '1',
          material_id: '1',
          material_title: 'Python基礎講座',
          status: 'completed',
          started_at: '2024-01-15T09:00:00Z',
          completed_at: '2024-01-20T17:30:00Z',
          duration_minutes: 480,
          progress_percentage: 100
        },
        {
          id: '2',
          material_id: '2',
          material_title: 'React入門',
          status: 'in_progress',
          started_at: '2024-02-01T10:00:00Z',
          duration_minutes: 180,
          progress_percentage: 65
        },
        {
          id: '3',
          material_id: '3',
          material_title: 'Node.js実践',
          status: 'not_started',
          progress_percentage: 0
        },
        {
          id: '4',
          material_id: '4',
          material_title: 'AWS基礎',
          status: 'completed',
          started_at: '2024-01-25T14:00:00Z',
          completed_at: '2024-02-05T16:45:00Z',
          duration_minutes: 600,
          progress_percentage: 100
        }
      ];

      setActivities(mockActivities);
    } catch (error) {
      console.error('学習履歴読み込みエラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true;
    return activity.status === filter;
  });

  const getStatusText = (status: string) => {
    const statusMap = {
      'completed': '完了',
      'in_progress': '進行中',
      'not_started': '未開始'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap = {
      'completed': 'text-green-400 bg-green-400/20',
      'in_progress': 'text-yellow-400 bg-yellow-400/20',
      'not_started': 'text-gray-400 bg-gray-400/20'
    };
    return colorMap[status as keyof typeof colorMap] || 'text-gray-400 bg-gray-400/20';
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}時間${mins}分` : `${mins}分`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-white/20 rounded mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-white/10 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  // カレンダー用のデータを変換
  const calendarActivities = activities.map(activity => ({
    id: activity.id,
    title: activity.material_title,
    date: activity.started_at || activity.completed_at || new Date().toISOString(),
    status: activity.status,
    type: '学習'
  }));

  return (
    <div className={`learning-history ${className}`}>
      {/* フィルターとビューモード */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'すべて' },
            { key: 'completed', label: '完了' },
            { key: 'in_progress', label: '進行中' },
            { key: 'not_started', label: '未開始' }
          ].map(filterOption => (
            <button
              key={filterOption.key}
              onClick={() => setFilter(filterOption.key as any)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                filter === filterOption.key
                  ? 'bg-brand text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {filterOption.label}
            </button>
          ))}
        </div>
        
        <div className="flex border border-white/20 rounded-md">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 text-sm ${
              viewMode === 'list' 
                ? 'bg-brand text-white' 
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            リスト
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1 text-sm ${
              viewMode === 'calendar' 
                ? 'bg-brand text-white' 
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            カレンダー
          </button>
        </div>
      </div>

      {/* ビューモードに応じた表示 */}
      {viewMode === 'list' ? (
        <div className="space-y-4">
          {filteredActivities.map(activity => (
          <div key={activity.id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-medium text-white">{activity.material_title}</h4>
                  <span className={`px-2 py-1 rounded text-xs ${getStatusColor(activity.status)}`}>
                    {getStatusText(activity.status)}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-white/70">
                  <div>
                    <span className="font-medium">開始日:</span>
                    <span className="ml-2">{formatDate(activity.started_at)}</span>
                  </div>
                  
                  {activity.status === 'completed' && (
                    <div>
                      <span className="font-medium">完了日:</span>
                      <span className="ml-2">{formatDate(activity.completed_at)}</span>
                    </div>
                  )}
                  
                  <div>
                    <span className="font-medium">学習時間:</span>
                    <span className="ml-2">{formatDuration(activity.duration_minutes)}</span>
                  </div>
                </div>

                {/* 進捗バー */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm text-white/70 mb-1">
                    <span>進捗</span>
                    <span>{activity.progress_percentage}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-brand to-brand-dark h-2 rounded-full transition-all duration-300"
                      style={{ width: `${activity.progress_percentage}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="ml-4">
                {activity.status === 'not_started' && (
                  <button className="btn btn-primary btn-sm">
                    学習開始
                  </button>
                )}
                {activity.status === 'in_progress' && (
                  <button className="btn btn-warning btn-sm">
                    続行
                  </button>
                )}
                {activity.status === 'completed' && (
                  <button className="btn btn-success btn-sm">
                    再学習
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

          {filteredActivities.length === 0 && (
            <div className="text-center py-8">
              <p className="text-white/50">学習履歴がありません</p>
            </div>
          )}
        </div>
      ) : (
        <LearningCalendar 
          activities={calendarActivities}
          className="bg-white/5"
        />
      )}

      {/* 統計情報 */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-400 mb-1">
            {activities.filter(a => a.status === 'completed').length}
          </div>
          <div className="text-sm text-white/70">完了した学習</div>
        </div>
        
        <div className="card text-center">
          <div className="text-2xl font-bold text-yellow-400 mb-1">
            {activities.filter(a => a.status === 'in_progress').length}
          </div>
          <div className="text-sm text-white/70">進行中の学習</div>
        </div>
        
        <div className="card text-center">
          <div className="text-2xl font-bold text-white mb-1">
            {activities.reduce((total, activity) => total + (activity.duration_minutes || 0), 0)}
          </div>
          <div className="text-sm text-white/70">総学習時間（分）</div>
        </div>
      </div>
    </div>
  );
}
