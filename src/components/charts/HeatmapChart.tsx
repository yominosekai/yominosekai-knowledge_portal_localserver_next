'use client';

import { useEffect, useRef } from 'react';

interface HeatmapData {
  x: string;
  y: string;
  value: number;
}

interface HeatmapChartProps {
  data: HeatmapData[];
  xLabels: string[];
  yLabels: string[];
  title?: string;
  className?: string;
}

export function HeatmapChart({ 
  data, 
  xLabels, 
  yLabels, 
  title, 
  className = '' 
}: HeatmapChartProps) {
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

    const padding = 60;
    const chartWidth = rect.width - (padding * 2);
    const chartHeight = rect.height - (padding * 2);

    // セルのサイズを計算
    const cellWidth = chartWidth / xLabels.length;
    const cellHeight = chartHeight / yLabels.length;

    // データの範囲を計算
    const values = data.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue;

    // ヒートマップを描画
    data.forEach(item => {
      const xIndex = xLabels.indexOf(item.x);
      const yIndex = yLabels.indexOf(item.y);
      
      if (xIndex === -1 || yIndex === -1) return;

      const x = padding + xIndex * cellWidth;
      const y = padding + yIndex * cellHeight;

      // 値に基づいて色を計算
      const normalizedValue = (item.value - minValue) / valueRange;
      const intensity = Math.floor(normalizedValue * 255);
      
      // 色のグラデーション（青から赤）
      const red = intensity;
      const blue = 255 - intensity;
      const green = Math.floor(intensity * 0.5);

      ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
      ctx.fillRect(x, y, cellWidth, cellHeight);

      // セルの境界線
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, cellWidth, cellHeight);

      // 値を表示
      if (cellWidth > 30 && cellHeight > 20) {
        ctx.fillStyle = normalizedValue > 0.5 ? 'white' : 'black';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          item.value.toString(), 
          x + cellWidth / 2, 
          y + cellHeight / 2
        );
      }
    });

    // X軸のラベル
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    xLabels.forEach((label, index) => {
      const x = padding + index * cellWidth + cellWidth / 2;
      ctx.fillText(label, x, padding + chartHeight + 10);
    });

    // Y軸のラベル
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    yLabels.forEach((label, index) => {
      const y = padding + index * cellHeight + cellHeight / 2;
      ctx.fillText(label, padding - 10, y);
    });

    // タイトル
    if (title) {
      ctx.fillStyle = 'white';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(title, rect.width / 2, 20);
    }

    // カラーバー
    const colorBarWidth = 200;
    const colorBarHeight = 20;
    const colorBarX = rect.width - colorBarWidth - 20;
    const colorBarY = 20;

    // カラーバーの背景
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(colorBarX, colorBarY, colorBarWidth, colorBarHeight);

    // カラーバーのグラデーション
    for (let i = 0; i < colorBarWidth; i++) {
      const normalizedValue = i / colorBarWidth;
      const intensity = Math.floor(normalizedValue * 255);
      const red = intensity;
      const blue = 255 - intensity;
      const green = Math.floor(intensity * 0.5);

      ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
      ctx.fillRect(colorBarX + i, colorBarY, 1, colorBarHeight);
    }

    // カラーバーの境界線
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(colorBarX, colorBarY, colorBarWidth, colorBarHeight);

    // カラーバーのラベル
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(minValue.toString(), colorBarX, colorBarY + colorBarHeight + 15);
    ctx.fillText(maxValue.toString(), colorBarX + colorBarWidth, colorBarY + colorBarHeight + 15);

  }, [data, xLabels, yLabels, title]);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ maxHeight: '400px' }}
      />
    </div>
  );
}
