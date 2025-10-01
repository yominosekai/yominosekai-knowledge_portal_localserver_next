'use client';

import React, { useState, useRef, useCallback } from 'react';

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onCrop: (croppedImageUrl: string) => void;
  onClose: () => void;
}

export function ImageCropModal({ isOpen, imageSrc, onCrop, onClose }: ImageCropModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 200, height: 200 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  const handleImageLoad = useCallback(() => {
    const img = new Image();
    img.onload = () => {
      setImage(img);
      setImageLoaded(true);
      // 初期クロップ位置を中央に設定
      setCrop({
        x: (img.width - 200) / 2,
        y: (img.height - 200) / 2,
        width: 200,
        height: 200
      });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  React.useEffect(() => {
    if (isOpen && imageSrc) {
      handleImageLoad();
    }
  }, [isOpen, imageSrc, handleImageLoad]);

  const drawCanvas = useCallback(() => {
    if (!canvasRef.current || !image || !imageLoaded) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // キャンバスサイズを設定
    canvas.width = 400;
    canvas.height = 400;

    // 画像を描画（ズーム適用）
    const scaledWidth = image.width * zoom;
    const scaledHeight = image.height * zoom;
    const x = (canvas.width - scaledWidth) / 2;
    const y = (canvas.height - scaledHeight) / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, x, y, scaledWidth, scaledHeight);

    // クロップエリアを描画
    const cropX = x + (crop.x * zoom);
    const cropY = y + (crop.y * zoom);
    const cropWidth = crop.width * zoom;
    const cropHeight = crop.height * zoom;

    // クロップエリアの背景（半透明）
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // クロップエリアを切り抜く
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillRect(cropX, cropY, cropWidth, cropHeight);

    // クロップエリアの境界線
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = '#007bff';
    ctx.lineWidth = 2;
    ctx.strokeRect(cropX, cropY, cropWidth, cropHeight);

    // クロップエリアの角にハンドルを描画
    const handleSize = 8;
    ctx.fillStyle = '#007bff';
    ctx.fillRect(cropX - handleSize/2, cropY - handleSize/2, handleSize, handleSize);
    ctx.fillRect(cropX + cropWidth - handleSize/2, cropY - handleSize/2, handleSize, handleSize);
    ctx.fillRect(cropX - handleSize/2, cropY + cropHeight - handleSize/2, handleSize, handleSize);
    ctx.fillRect(cropX + cropWidth - handleSize/2, cropY + cropHeight - handleSize/2, handleSize, handleSize);
  }, [image, imageLoaded, crop, zoom]);

  React.useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!image) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const scaledWidth = image.width * zoom;
    const scaledHeight = image.height * zoom;
    const imageX = (canvas.width - scaledWidth) / 2;
    const imageY = (canvas.height - scaledHeight) / 2;

    const cropX = imageX + (crop.x * zoom);
    const cropY = imageY + (crop.y * zoom);
    const cropWidth = crop.width * zoom;
    const cropHeight = crop.height * zoom;

    // クロップエリア内かチェック
    if (x >= cropX && x <= cropX + cropWidth && y >= cropY && y <= cropY + cropHeight) {
      setIsDragging(true);
      setDragStart({ x: x - cropX, y: y - cropY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !image) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const scaledWidth = image.width * zoom;
    const scaledHeight = image.height * zoom;
    const imageX = (canvas.width - scaledWidth) / 2;
    const imageY = (canvas.height - scaledHeight) / 2;

    const newX = (x - dragStart.x - imageX) / zoom;
    const newY = (y - dragStart.y - imageY) / zoom;

    setCrop(prev => ({
      ...prev,
      x: Math.max(0, Math.min(image.width - prev.width, newX)),
      y: Math.max(0, Math.min(image.height - prev.height, newY))
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(3, prev * 1.2));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(0.5, prev * 0.8));
  };

  const handleZoomFit = () => {
    if (!image) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scaleX = canvas.width / image.width;
    const scaleY = canvas.height / image.height;
    const scale = Math.min(scaleX, scaleY);
    setZoom(scale);
  };

  const handleZoomReset = () => {
    setZoom(1);
  };

  const handleCrop = () => {
    if (!image || !canvasRef.current) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 200;
    canvas.height = 200;

    // クロップした画像を描画
    ctx.drawImage(
      image,
      crop.x, crop.y, crop.width, crop.height,
      0, 0, 200, 200
    );

    const croppedImageUrl = canvas.toDataURL('image/png');
    onCrop(croppedImageUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">画像をクロップ</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="p-6">
          {/* ズームコントロール */}
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={handleZoomOut}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              -
            </button>
            <span className="font-medium">{Math.round(zoom * 100)}%</span>
            <button
              onClick={handleZoomIn}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              +
            </button>
            <button
              onClick={handleZoomFit}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              全体表示
            </button>
            <button
              onClick={handleZoomReset}
              className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              リセット
            </button>
          </div>

          {/* キャンバス */}
          <div className="flex justify-center mb-4">
            <canvas
              ref={canvasRef}
              className="border border-gray-300 cursor-move"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </div>

          {/* 操作説明 */}
          <div className="text-sm text-gray-600 mb-4">
            <p><strong>操作方法:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>ドラッグ: クロップエリアを移動</li>
              <li>マウスホイール: ズームイン/アウト</li>
              <li>+/- ボタン: ズーム調整</li>
            </ul>
          </div>

          {/* ボタン */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              キャンセル
            </button>
            <button
              onClick={handleCrop}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              この画像をクロップして使用
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


