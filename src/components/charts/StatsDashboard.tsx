'use client';

import { ProgressChart } from './ProgressChart';
import { LineChart } from './LineChart';
import { BarChart } from './BarChart';
import { HeatmapChart } from './HeatmapChart';

interface StatsData {
  progress: {
    completed: number;
    in_progress: number;
    not_started: number;
  };
  weeklyProgress: Array<{
    x: string;
    y: number;
  }>;
  departmentStats: Array<{
    label: string;
    value: number;
    color?: string;
  }>;
  activityHeatmap: Array<{
    x: string;
    y: string;
    value: number;
  }>;
}

interface StatsDashboardProps {
  data: StatsData;
  className?: string;
}

export function StatsDashboard({ data, className = '' }: StatsDashboardProps) {
  const xLabels = ['月', '火', '水', '木', '金', '土', '日'];
  const yLabels = ['0時', '4時', '8時', '12時', '16時', '20時'];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 進捗サマリー */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg bg-white/5 p-6 ring-1 ring-white/10">
          <h3 className="text-lg font-semibold mb-4">学習進捗</h3>
          <ProgressChart data={data.progress} />
        </div>

        <div className="rounded-lg bg-white/5 p-6 ring-1 ring-white/10">
          <h3 className="text-lg font-semibold mb-4">週間進捗</h3>
          <LineChart 
            data={data.weeklyProgress}
            title="週間学習時間"
            yLabel="時間"
            xLabel="日"
          />
        </div>
      </div>

      {/* 部署別統計 */}
      <div className="rounded-lg bg-white/5 p-6 ring-1 ring-white/10">
        <h3 className="text-lg font-semibold mb-4">部署別学習時間</h3>
        <BarChart 
          data={data.departmentStats}
          title="部署別学習時間"
          yLabel="時間"
          xLabel="部署"
        />
      </div>

      {/* 活動ヒートマップ */}
      <div className="rounded-lg bg-white/5 p-6 ring-1 ring-white/10">
        <h3 className="text-lg font-semibold mb-4">学習活動パターン</h3>
        <HeatmapChart 
          data={data.activityHeatmap}
          xLabels={xLabels}
          yLabels={yLabels}
          title="時間帯別学習活動"
        />
      </div>

      {/* 統計サマリーカード */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg bg-white/5 p-4 ring-1 ring-white/10 text-center">
          <div className="text-2xl font-bold text-brand mb-1">
            {data.progress.completed}
          </div>
          <div className="text-sm text-white/70">完了済み</div>
        </div>
        
        <div className="rounded-lg bg-white/5 p-4 ring-1 ring-white/10 text-center">
          <div className="text-2xl font-bold text-yellow-400 mb-1">
            {data.progress.in_progress}
          </div>
          <div className="text-sm text-white/70">進行中</div>
        </div>
        
        <div className="rounded-lg bg-white/5 p-4 ring-1 ring-white/10 text-center">
          <div className="text-2xl font-bold text-gray-400 mb-1">
            {data.progress.not_started}
          </div>
          <div className="text-sm text-white/70">未開始</div>
        </div>
        
        <div className="rounded-lg bg-white/5 p-4 ring-1 ring-white/10 text-center">
          <div className="text-2xl font-bold text-green-400 mb-1">
            {data.weeklyProgress.reduce((sum, day) => sum + day.y, 0)}
          </div>
          <div className="text-sm text-white/70">今週の学習時間</div>
        </div>
      </div>
    </div>
  );
}
