'use client';

import { useState, useRef } from 'react';
import { AvatarCropEditor } from './AvatarCropEditor';

interface AvatarUploadProps {
  currentAvatar?: string;
  currentInitials?: string;
  onAvatarChange: (avatarUrl: string) => void;
  className?: string;
}

export function AvatarUpload({ 
  currentAvatar, 
  currentInitials = 'U', 
  onAvatarChange, 
  className = '' 
}: AvatarUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('ファイルサイズは2MB以下にしてください');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setCropImageSrc(result);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    console.log(`[AvatarUpload] クロップ完了、Base64変換開始`);
    // BlobをBase64に変換して永続化
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      console.log(`[AvatarUpload] アバターをBase64に変換: ${base64String.substring(0, 50)}...`);
      setPreviewUrl(base64String);
      onAvatarChange(base64String);
      setShowCropModal(false);
      console.log(`[AvatarUpload] アバター設定完了`);
    };
    reader.readAsDataURL(croppedImageBlob);
  };

  const handleRemoveAvatar = () => {
    console.log(`[AvatarUpload] アバター削除開始`);
    setPreviewUrl(null);
    onAvatarChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    console.log(`[AvatarUpload] アバター削除完了`);
  };

  const displayAvatar = previewUrl || currentAvatar;
  
  console.log(`[AvatarUpload] Props:`, {
    currentAvatar,
    currentInitials,
    previewUrl,
    displayAvatar
  });

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 現在のアバター表示 */}
      <div className="flex items-center gap-4">
        <div className="w-24 h-24 rounded-full bg-gray-600 flex items-center justify-center text-4xl font-bold text-white overflow-hidden ring-2 ring-white/30 shadow-lg">
          {displayAvatar ? (
            <img 
              src={displayAvatar} 
              alt="Avatar" 
              className="w-full h-full object-cover"
            />
          ) : (
            currentInitials || 'U'
          )}
        </div>
        
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            アバターを変更
          </button>
          
          {displayAvatar && (
            <button
              type="button"
              onClick={handleRemoveAvatar}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
              アバターを削除
            </button>
          )}
        </div>
      </div>

      {/* ドラッグ&ドロップエリア */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-4xl mb-2">📷</div>
        <p className="text-gray-600 mb-2">
          画像をドラッグ&ドロップするか、クリックして選択
        </p>
        <p className="text-sm text-gray-500">
          JPG, PNG形式、最大2MB
        </p>
      </div>

      {/* ファイル入力 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* クロップエディタ */}
      {showCropModal && (
        <AvatarCropEditor
          imageSrc={cropImageSrc}
          onCropComplete={handleCropComplete}
          onCancel={() => setShowCropModal(false)}
        />
      )}
    </div>
  );
}