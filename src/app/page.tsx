'use client';

import { useEffect, useState } from 'react';
import { apiClient, ProgressData, Material } from '../lib/api';

export default function Page() {
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [recentMaterials, setRecentMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 認証
        await apiClient.authenticate();
        
        // 進捗データ取得（仮のユーザーIDを使用）
        const userId = 'S-1-5-21-2432060128-2762725120-1584859402-1001';
        const progress = await apiClient.getProgress(userId);
        setProgressData(progress);
        
        // コンテンツ一覧取得
        const materials = await apiClient.getContent();
        setRecentMaterials(materials.slice(0, 5)); // 最新5件
        
      } catch (err) {
        console.error('データ取得エラー:', err);
        setError('データの取得に失敗しました。PowerShellサーバーが起動しているか確認してください。');
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
    <div className="grid gap-6 md:grid-cols-2">
      <section className="rounded-lg bg-white/5 p-6 ring-1 ring-white/10">
        <h2 className="text-xl font-semibold mb-3">学習サマリー</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded bg-black/20 p-4">
            <div className="text-white/70">完了</div>
            <div className="text-2xl font-bold text-brand">
              {progressData?.summary.completed || 0}
            </div>
          </div>
          <div className="rounded bg-black/20 p-4">
            <div className="text-white/70">進行中</div>
            <div className="text-2xl font-bold text-brand">
              {progressData?.summary.in_progress || 0}
            </div>
          </div>
          <div className="rounded bg-black/20 p-4">
            <div className="text-white/70">未開始</div>
            <div className="text-2xl font-bold text-brand">
              {progressData?.summary.not_started || 0}
            </div>
          </div>
          <div className="rounded bg-black/20 p-4">
            <div className="text-white/70">完了率</div>
            <div className="text-2xl font-bold text-brand">
              {progressData?.summary.completion_rate || 0}%
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-lg bg-white/5 p-6 ring-1 ring-white/10">
        <h2 className="text-xl font-semibold mb-3">最近の学習</h2>
        {recentMaterials.length > 0 ? (
          <div className="space-y-2">
            {recentMaterials.map((material) => (
              <div key={material.id} className="p-3 rounded bg-black/20">
                <div className="font-medium text-white">{material.title}</div>
                <div className="text-sm text-white/70">{material.description}</div>
                <div className="text-xs text-white/50 mt-1">
                  {material.difficulty} • {material.estimated_hours}時間
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-white/70">コンテンツは未取得です。</p>
        )}
      </section>
    </div>
  );
}
