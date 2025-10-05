'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient, ProgressData } from '../lib/api';
import { ProgressChart } from '../components/ProgressChart';
import { LearningHistory } from '../components/LearningHistory';

export default function Page() {
  const { user, isLoading: authLoading } = useAuth();
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('my-progress');

  useEffect(() => {
    const fetchData = async () => {
      // 認証が完了するまで待機
      if (authLoading || !user) {
        return;
      }

      try {
        setLoading(true);
        
        // 進捗データ取得
        const progress = await apiClient.getProgress(user.sid);
        setProgressData(progress);
        
      } catch (err) {
        console.error('データ取得エラー:', err);
        setError('データの取得に失敗しました。しばらく待ってから再度お試しください。');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto mb-4"></div>
          <div className="text-white/70">
            {authLoading ? '認証中...' : 'データを読み込み中...'}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-500/10 p-6 ring-1 ring-red-500/20">
        <h2 className="text-xl font-semibold mb-3 text-red-400">エラー</h2>
        <p className="text-red-300">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white/5 p-6 ring-1 ring-white/10">
        <h2 className="text-xl font-semibold mb-4">学習ダッシュボード</h2>
        
        {/* タブナビゲーション */}
        <div className="flex gap-2 mb-6">
          <button
            className={`px-4 py-2 rounded transition-colors ${
              activeTab === 'my-progress'
                ? 'bg-brand text-white'
                : 'bg-black/20 text-white/70 hover:bg-white/10'
            }`}
            onClick={() => setActiveTab('my-progress')}
          >
            学習進捗
          </button>
          <button
            className={`px-4 py-2 rounded transition-colors ${
              activeTab === 'learning-history'
                ? 'bg-brand text-white'
                : 'bg-black/20 text-white/70 hover:bg-white/10'
            }`}
            onClick={() => setActiveTab('learning-history')}
          >
            学習履歴
          </button>
        </div>

        {/* 学習進捗タブ */}
        {activeTab === 'my-progress' && (
          <div className="space-y-6">
            {/* 進捗サマリー */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 数値サマリー */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-black/20 p-4 text-center">
                  <div className="text-2xl font-bold text-brand mb-1">
                    {progressData?.summary.completed || 0}
                  </div>
                  <div className="text-sm text-white/70">完了</div>
                </div>
                <div className="rounded-lg bg-black/20 p-4 text-center">
                  <div className="text-2xl font-bold text-brand mb-1">
                    {progressData?.summary.in_progress || 0}
                  </div>
                  <div className="text-sm text-white/70">進行中</div>
                </div>
                <div className="rounded-lg bg-black/20 p-4 text-center">
                  <div className="text-2xl font-bold text-brand mb-1">
                    {progressData?.summary.not_started || 0}
                  </div>
                  <div className="text-sm text-white/70">未開始</div>
                </div>
                <div className="rounded-lg bg-black/20 p-4 text-center">
                  <div className="text-2xl font-bold text-brand mb-1">
                    {progressData?.summary.completion_rate || 0}%
                  </div>
                  <div className="text-sm text-white/70">完了率</div>
                </div>
              </div>
              
              {/* 進捗チャート */}
              <div className="flex justify-center">
                <ProgressChart 
                  data={{
                    completed: progressData?.summary.completed || 0,
                    in_progress: progressData?.summary.in_progress || 0,
                    not_started: progressData?.summary.not_started || 0
                  }}
                />
              </div>
            </div>

            {/* 最近の学習活動 */}
            <div className="rounded-lg bg-black/20 p-6">
              <h3 className="text-lg font-semibold mb-4">最近の学習活動</h3>
              {progressData?.activities && progressData.activities.length > 0 ? (
                <div className="space-y-3">
                  {progressData.activities.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 rounded bg-black/20">
                      <div>
                        <div className="font-medium text-white">コンテンツ ID: {activity.material_id}</div>
                        <div className="text-sm text-white/70">
                          ステータス: {activity.status} | スコア: {activity.score || 0}
                        </div>
                      </div>
                      <div className="text-xs text-white/50">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/70">学習活動履歴がありません。</p>
              )}
            </div>
          </div>
        )}


        {/* 学習履歴タブ */}
        {activeTab === 'learning-history' && user && (
          <LearningHistory userId={user.sid} />
        )}
      </div>
    </div>
  );
}