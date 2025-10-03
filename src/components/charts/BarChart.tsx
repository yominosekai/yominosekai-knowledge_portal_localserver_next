'use client';

import { useEffect, useRef } from 'react';

interface BarData {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarData[];
  title?: string;
  xLabel?: string;
  yLabel?: string;
  className?: string;
}

export function BarChart({ 
  data, 
  title, 
  xLabel, 
  yLabel, 
  className = '' 
}: BarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // キャンバスサイズを設定
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const padding = 40;
    const chartWidth = rect.width - (padding * 2);
    const chartHeight = rect.height - (padding * 2);

    // データの範囲を計算
    const values = data.map(d => d.value);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values, 0);

    // グリッドを描画
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    // 横線
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + chartWidth, y);
      ctx.stroke();
    }

    // バーの幅と間隔を計算
    const barWidth = (chartWidth / data.length) * 0.8;
    const barSpacing = (chartWidth / data.length) * 0.2;

    // バーを描画
    data.forEach((item, index) => {
      const x = padding + (chartWidth / data.length) * index + barSpacing / 2;
      const barHeight = ((item.value - minValue) / (maxValue - minValue)) * chartHeight;
      const y = padding + chartHeight - barHeight;

      // バーの背景
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(x, padding, barWidth, chartHeight);

      // バー
      ctx.fillStyle = item.color || '#667eea';
      ctx.fillRect(x, y, barWidth, barHeight);

      // バーの境界線
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, barWidth, barHeight);
    });

    // Y軸のラベル
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let i = 0; i <= 5; i++) {
      const value = minValue + ((maxValue - minValue) / 5) * i;
      const y = padding + (chartHeight / 5) * i;
      ctx.fillText(value.toString(), padding - 10, y);
    }

    // X軸のラベル
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    data.forEach((item, index) => {
      const x = padding + (chartWidth / data.length) * index + (chartWidth / data.length) / 2;
      ctx.fillText(item.label, x, padding + chartHeight + 10);
    });

    // タイトル
    if (title) {
      ctx.fillStyle = 'white';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(title, rect.width / 2, 20);
    }

    // 軸ラベル
    if (yLabel) {
      ctx.save();
      ctx.translate(15, rect.height / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(yLabel, 0, 0);
      ctx.restore();
    }

    if (xLabel) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(xLabel, rect.width / 2, rect.height - 5);
    }

  }, [data, title, xLabel, yLabel]);

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



