'use client';

import React, { useEffect, useRef } from 'react';

interface ProgressChartProps {
  data: {
    completed: number;
    in_progress: number;
    not_started: number;
  };
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
    const size = 200;
    canvas.width = size;
    canvas.height = size;

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = 80;

    // データの合計を計算
    const total = data.completed + data.in_progress + data.not_started;
    
    if (total === 0) {
      // データがない場合
      ctx.fillStyle = '#e5e7eb';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.fillStyle = '#6b7280';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('データなし', centerX, centerY);
      return;
    }

    // 各セクションの角度を計算
    const completedAngle = (data.completed / total) * 2 * Math.PI;
    const inProgressAngle = (data.in_progress / total) * 2 * Math.PI;
    const notStartedAngle = (data.not_started / total) * 2 * Math.PI;

    let currentAngle = -Math.PI / 2; // 12時方向から開始

    // 完了済み（緑）
    if (data.completed > 0) {
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + completedAngle);
      ctx.closePath();
      ctx.fill();
      currentAngle += completedAngle;
    }

    // 進行中（黄色）
    if (data.in_progress > 0) {
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + inProgressAngle);
      ctx.closePath();
      ctx.fill();
      currentAngle += inProgressAngle;
    }

    // 未開始（赤）
    if (data.not_started > 0) {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + notStartedAngle);
      ctx.closePath();
      ctx.fill();
    }

    // 中央に円を描画（ドーナツチャート）
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.6, 0, 2 * Math.PI);
    ctx.fill();

    // 中央にパーセンテージを表示
    const completionRate = Math.round((data.completed / total) * 100);
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${completionRate}%`, centerX, centerY + 8);
  }, [data]);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-48 h-48"
        style={{ maxWidth: '200px', maxHeight: '200px' }}
      />
      
      {/* 凡例 */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-sm text-gray-600">完了: {data.completed}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span className="text-sm text-gray-600">進行中: {data.in_progress}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span className="text-sm text-gray-600">未開始: {data.not_started}</span>
        </div>
      </div>
    </div>
  );
}


