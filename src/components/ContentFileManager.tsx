'use client';

import { useState, useEffect } from 'react';
import { FileUpload } from './FileUpload';

interface ContentFile {
  id: string;
  contentId: string;
  originalName: string;
  fileName: string;
  filePath: string;
  size: number;
  type: string;
  fileType: string;
  uploadedAt: string;
}

interface ContentFileManagerProps {
  contentId: string;
  onFilesChange?: (files: ContentFile[]) => void;
}

export function ContentFileManager({ contentId, onFilesChange }: ContentFileManagerProps) {
  const [files, setFiles] = useState<ContentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFiles();
  }, [contentId]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      // 実際の実装では、コンテンツに関連するファイル一覧を取得
      // ここでは仮のデータを返す
      const mockFiles: ContentFile[] = [
        {
          id: '1',
          contentId: contentId,
          originalName: 'sample-video.mp4',
          fileName: 'sample-video.mp4',
          filePath: '/uploads/content/1/sample-video.mp4',
          size: 1024000,
          type: 'video/mp4',
          fileType: 'video',
          uploadedAt: new Date().toISOString()
        }
      ];
      setFiles(mockFiles);
      onFilesChange?.(mockFiles);
    } catch (err) {
      setError('ファイル一覧の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (uploadedFiles: File[]) => {
    try {
      setError('');
      
      for (const file of uploadedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('contentId', contentId);
        formData.append('fileType', getFileType(file.type));

        const response = await fetch('/api/upload/content', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'アップロードに失敗しました');
        }

        const result = await response.json();
        const newFile: ContentFile = result.file;
        
        setFiles(prev => [...prev, newFile]);
      }

      onFilesChange?.(files);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'アップロードに失敗しました');
    }
  };

  const handleFileDelete = async (fileId: string) => {
    try {
      // 実際の実装では、ファイル削除APIを呼び出す
      setFiles(prev => prev.filter(file => file.id !== fileId));
      onFilesChange?.(files.filter(file => file.id !== fileId));
    } catch (err) {
      setError('ファイルの削除に失敗しました');
    }
  };

  const getFileType = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType === 'application/pdf') return 'document';
    return 'attachment';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📽️';
    return '📎';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-white/70">ファイルを読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">ファイル管理</h3>
        
        {/* ファイルアップロード */}
        <FileUpload
          onUpload={handleFileUpload}
          accept="image/*,video/*,audio/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.zip,.rar"
          multiple={true}
          maxSize={50}
          className="mb-6"
        />

        {error && (
          <div className="mb-4 p-3 rounded bg-red-500/10 ring-1 ring-red-500/20">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* ファイル一覧 */}
        <div className="space-y-3">
          {files.length === 0 ? (
            <div className="text-center py-8 text-white/50">
              アップロードされたファイルはありません
            </div>
          ) : (
            files.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-4 rounded bg-black/20 ring-1 ring-white/10">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getFileIcon(file.type)}</span>
                  <div>
                    <p className="font-medium text-white">{file.originalName}</p>
                    <div className="flex items-center space-x-4 text-sm text-white/50">
                      <span>{formatFileSize(file.size)}</span>
                      <span className="capitalize">{file.fileType}</span>
                      <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <a
                    href={file.filePath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 rounded bg-blue-500/20 text-blue-400 text-sm hover:bg-blue-500/30 transition-colors"
                  >
                    表示
                  </a>
                  <a
                    href={file.filePath}
                    download={file.originalName}
                    className="px-3 py-1 rounded bg-green-500/20 text-green-400 text-sm hover:bg-green-500/30 transition-colors"
                  >
                    ダウンロード
                  </a>
                  <button
                    onClick={() => handleFileDelete(file.id)}
                    className="px-3 py-1 rounded bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30 transition-colors"
                  >
                    削除
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}



