'use client';

import { useEffect, useRef } from 'react';

interface ProgressData {
  completed: number;
  in_progress: number;
  not_started: number;
}

interface ProgressChartProps {
  data: ProgressData;
  className?: string;
}

export function ProgressChart({ data, className = '' }: ProgressChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // キャンバスサイズを設定
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // データの準備
    const total = data.completed + data.in_progress + data.not_started;
    if (total === 0) return;

    const completedAngle = (data.completed / total) * 2 * Math.PI;
    const inProgressAngle = (data.in_progress / total) * 2 * Math.PI;
    const notStartedAngle = (data.not_started / total) * 2 * Math.PI;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    // 背景円
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fill();

    // 完了部分
    if (data.completed > 0) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, completedAngle);
      ctx.lineTo(centerX, centerY);
      ctx.fillStyle = '#667eea';
      ctx.fill();
    }

    // 進行中部分
    if (data.in_progress > 0) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, completedAngle, completedAngle + inProgressAngle);
      ctx.lineTo(centerX, centerY);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
    }

    // 未開始部分
    if (data.not_started > 0) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, completedAngle + inProgressAngle, 2 * Math.PI);
      ctx.lineTo(centerX, centerY);
      ctx.fillStyle = '#6b7280';
      ctx.fill();
    }

    // 中央にテキスト
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.round((data.completed / total) * 100)}%`, centerX, centerY);

    // 凡例
    const legendY = centerY + radius + 30;
    const legendItems = [
      { label: '完了', color: '#667eea', value: data.completed },
      { label: '進行中', color: '#f59e0b', value: data.in_progress },
      { label: '未開始', color: '#6b7280', value: data.not_started }
    ];

    legendItems.forEach((item, index) => {
      const x = centerX - 60 + (index * 40);
      
      // 色の四角
      ctx.fillStyle = item.color;
      ctx.fillRect(x - 8, legendY - 8, 16, 16);
      
      // ラベル
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(item.label, x, legendY + 20);
      
      // 値
      ctx.fillText(item.value.toString(), x, legendY + 35);
    });

  }, [data]);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ maxHeight: '300px' }}
      />
    </div>
  );
}



