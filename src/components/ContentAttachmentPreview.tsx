'use client';

import React, { useState, useRef } from 'react';

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  mimeType: string;
}

interface ContentAttachmentPreviewProps {
  attachments: Attachment[];
  className?: string;
}

export function ContentAttachmentPreview({ 
  attachments, 
  className = '' 
}: ContentAttachmentPreviewProps) {
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel')) return '📊';
    if (mimeType.includes('powerpoint')) return '📈';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
    return '📎';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handlePreview = (attachment: Attachment) => {
    setSelectedAttachment(attachment);
    setShowPreview(true);
    setPreviewError(null);
  };

  const handleDownload = (attachment: Attachment) => {
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderPreview = () => {
    if (!selectedAttachment) return null;

    const { mimeType, url, name } = selectedAttachment;

    if (mimeType.startsWith('image/')) {
      return (
        <div className="flex items-center justify-center bg-gray-100 rounded-lg">
          <img
            src={url}
            alt={name}
            className="max-w-full max-h-96 object-contain rounded-lg"
            onError={() => setPreviewError('画像の読み込みに失敗しました')}
          />
        </div>
      );
    }

    if (mimeType.startsWith('video/')) {
      return (
        <div className="flex items-center justify-center bg-gray-100 rounded-lg">
          <video
            controls
            className="max-w-full max-h-96 rounded-lg"
            onError={() => setPreviewError('動画の読み込みに失敗しました')}
          >
            <source src={url} type={mimeType} />
            お使いのブラウザは動画タグをサポートしていません。
          </video>
        </div>
      );
    }

    if (mimeType.startsWith('audio/')) {
      return (
        <div className="flex items-center justify-center bg-gray-100 rounded-lg p-8">
          <audio
            controls
            className="w-full max-w-md"
            onError={() => setPreviewError('音声の読み込みに失敗しました')}
          >
            <source src={url} type={mimeType} />
            お使いのブラウザは音声タグをサポートしていません。
          </audio>
        </div>
      );
    }

    if (mimeType.includes('pdf')) {
      return (
        <div className="w-full h-96">
          <iframe
            src={url}
            className="w-full h-full rounded-lg border-0"
            onError={() => setPreviewError('PDFの読み込みに失敗しました')}
          />
        </div>
      );
    }

    // その他のファイルタイプ
    return (
      <div className="flex flex-col items-center justify-center bg-gray-100 rounded-lg p-8">
        <div className="text-6xl mb-4">{getFileIcon(mimeType)}</div>
        <p className="text-gray-600 mb-4">このファイルはプレビューできません</p>
        <button
          onClick={() => handleDownload(selectedAttachment)}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          ダウンロード
        </button>
      </div>
    );
  };

  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-white">添付ファイル</h3>
      
      {/* 添付ファイル一覧 */}
      <div className="grid gap-2">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="flex items-center justify-between p-3 bg-black/20 rounded-lg ring-1 ring-white/10 hover:ring-white/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getFileIcon(attachment.mimeType)}</span>
              <div>
                <p className="text-white font-medium">{attachment.name}</p>
                <p className="text-white/50 text-sm">{formatFileSize(attachment.size)}</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => handlePreview(attachment)}
                className="px-3 py-1 text-sm bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
              >
                プレビュー
              </button>
              <button
                onClick={() => handleDownload(attachment)}
                className="px-3 py-1 text-sm bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors"
              >
                ダウンロード
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* プレビューモーダル */}
      {showPreview && selectedAttachment && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">
                {selectedAttachment.name}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload(selectedAttachment)}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  ダウンロード
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
              {previewError ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="text-6xl mb-4">⚠️</div>
                  <p className="text-red-500 mb-4">{previewError}</p>
                  <button
                    onClick={() => handleDownload(selectedAttachment)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    ダウンロードして確認
                  </button>
                </div>
              ) : (
                renderPreview()
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


