'use client';

import { useEffect, useState } from 'react';
import { apiClient, ProgressData, Material } from '../../lib/api';
import { ProgressChart } from '../../components/ProgressChart';

export default function Page() {
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [assignedContent, setAssignedContent] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('my-progress');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 認証
        await apiClient.authenticate();
        
        // 進捗データ取得
        const userId = 'S-1-5-21-2432060128-2762725120-1584859402-1001';
        const progress = await apiClient.getProgress(userId);
        setProgressData(progress);
        
        // 割り当てコンテンツ取得（仮実装）
        const materials = await apiClient.getContent();
        setAssignedContent(materials.slice(0, 10));
        
      } catch (err) {
        console.error('データ取得エラー:', err);
        setError('データの取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-white/70">データを読み込み中...</div>
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
        <h2 className="text-xl font-semibold mb-4">学習進捗</h2>
        
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
            自分の進捗
          </button>
          <button
            className={`px-4 py-2 rounded transition-colors ${
              activeTab === 'assigned-content'
                ? 'bg-brand text-white'
                : 'bg-black/20 text-white/70 hover:bg-white/10'
            }`}
            onClick={() => setActiveTab('assigned-content')}
          >
            割り当てられたコンテンツ
          </button>
        </div>

        {/* 自分の進捗タブ */}
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


            {/* 最近の活動 */}
            <div className="rounded-lg bg-black/20 p-6">
              <h3 className="text-lg font-semibold mb-4">最近の活動</h3>
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
                <p className="text-white/70">活動履歴がありません。</p>
              )}
            </div>
          </div>
        )}

        {/* 割り当てコンテンツタブ */}
        {activeTab === 'assigned-content' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">割り当てられたコンテンツ</h3>
            {assignedContent.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {assignedContent.map((material) => (
                  <div key={material.id} className="rounded-lg bg-black/20 p-4 ring-1 ring-white/10">
                    <h4 className="font-semibold text-white mb-2">{material.title}</h4>
                    <p className="text-sm text-white/70 mb-3">{material.description}</p>
                    <div className="flex items-center justify-between text-xs text-white/50 mb-3">
                      <span className="capitalize">{material.difficulty}</span>
                      <span>{material.estimated_hours}時間</span>
                      <span className="capitalize">{material.type}</span>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 rounded bg-brand px-3 py-2 text-sm hover:bg-brand-dark transition-colors">
                        学習開始
                      </button>
                      <button className="px-3 py-2 rounded bg-black/40 text-sm hover:bg-white/10 transition-colors">
                        詳細
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/70">割り当てられたコンテンツはありません。</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
