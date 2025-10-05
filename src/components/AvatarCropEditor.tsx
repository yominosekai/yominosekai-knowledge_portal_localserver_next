'use client';

import React, { useState, useRef, useCallback } from 'react';

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface AvatarCropEditorProps {
  imageSrc: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
  onCancel: () => void;
  size?: number;
}

export const AvatarCropEditor: React.FC<AvatarCropEditorProps> = ({
  imageSrc,
  onCropComplete,
  onCancel,
  size = 200
}) => {
  const [cropArea, setCropArea] = useState<CropArea>({
    x: 0,
    y: 0,
    width: size,
    height: size
  });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleImageLoad = useCallback(() => {
    if (imageRef.current) {
      const { naturalWidth, naturalHeight } = imageRef.current;
      setImageDimensions({ width: naturalWidth, height: naturalHeight });
      
      // 初期クロップエリアを中央に設定
      const initialSize = Math.min(naturalWidth, naturalHeight) * 0.8;
      setCropArea({
        x: (naturalWidth - initialSize) / 2,
        y: (naturalHeight - initialSize) / 2,
        width: initialSize,
        height: initialSize
      });
      setImageLoaded(true);
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDragging(true);
    setDragStart({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const deltaX = x - dragStart.x;
    const deltaY = y - dragStart.y;
    
    setCropArea(prev => ({
      ...prev,
      x: Math.max(0, Math.min(prev.x + deltaX, imageDimensions.width - prev.width)),
      y: Math.max(0, Math.min(prev.y + deltaY, imageDimensions.height - prev.height))
    }));
    
    setDragStart({ x, y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(prev => Math.max(0.5, Math.min(3, prev + delta)));
  };

  const cropImage = () => {
    if (!imageRef.current) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // キャンバスサイズを設定
    canvas.width = size;
    canvas.height = size;
    
    // 円形マスクを作成
    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();
    
    // 画像を描画
    ctx.drawImage(
      imageRef.current,
      cropArea.x,
      cropArea.y,
      cropArea.width,
      cropArea.height,
      0,
      0,
      size,
      size
    );
    
    ctx.restore();
    
    // WebP形式でBlobを作成
    canvas.toBlob((blob) => {
      if (blob) {
        onCropComplete(blob);
      }
    }, 'image/webp', 0.9);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          プロフィール画像を編集
        </h3>
        
        <div className="mb-4">
          <div 
            ref={containerRef}
            className="relative overflow-hidden border-2 border-gray-300 dark:border-gray-600 rounded-lg"
            style={{ height: '400px' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          >
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Crop preview"
              className="w-full h-full object-contain"
              style={{
                transform: `scale(${scale})`,
                transformOrigin: 'center'
              }}
              onLoad={handleImageLoad}
            />
            
            {imageLoaded && (
              <div
                className="absolute border-2 border-blue-500 bg-blue-500/20 cursor-move"
                style={{
                  left: `${(cropArea.x / imageDimensions.width) * 100}%`,
                  top: `${(cropArea.y / imageDimensions.height) * 100}%`,
                  width: `${(cropArea.width / imageDimensions.width) * 100}%`,
                  height: `${(cropArea.height / imageDimensions.height) * 100}%`,
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white bg-blue-500 rounded-full"></div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            ズーム: {Math.round(scale * 100)}%
          </label>
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            プレビュー
          </h4>
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-300 dark:border-gray-600">
            {imageLoaded && (
              <img
                src={imageSrc}
                alt="Preview"
                className="w-full h-full object-cover"
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: 'center',
                  clipPath: 'circle(50% at 50% 50%)'
                }}
              />
            )}
          </div>
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={cropImage}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            保存
          </button>
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            キャンセル
          </button>
        </div>
        
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          <p>• マウスドラッグでクロップエリアを移動</p>
          <p>• マウスホイールでズーム</p>
          <p>• 画像は円形に切り抜かれます</p>
        </div>
      </div>
    </div>
  );
};
