'use client';

import React, { useState, useRef, useCallback } from 'react';
import { apiClient } from '../lib/api';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

interface ContentCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newContent?: any) => void;
}

interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  size: number;
  type: string;
}

export function ContentCreationModal({ isOpen, onClose, onSuccess }: ContentCreationModalProps) {
  const { resolvedTheme } = useTheme();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    category_id: '',
    difficulty: '',
    estimated_hours: 1,
    tags: '',
    content: ''
  });
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<any[]>([]);

  // カテゴリを読み込み
  React.useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const loadCategories = async () => {
    try {
      const cats = await apiClient.getCategories();
      setCategories(cats);
    } catch (error) {
      console.error('カテゴリの読み込みに失敗:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleFiles = (files: File[]) => {
    const newFiles: UploadedFile[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      size: file.size,
      type: file.type,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    }));
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      alert('タイトルを入力してください');
      return false;
    }
    if (!formData.description.trim()) {
      alert('概要を入力してください');
      return false;
    }
    if (!formData.type) {
      alert('タイプを選択してください');
      return false;
    }
    if (!formData.category_id) {
      alert('カテゴリを選択してください');
      return false;
    }
    if (!formData.difficulty) {
      alert('難易度を選択してください');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsUploading(true);
    
    try {
      // FormDataを使用してファイルを送信
      const formDataToSend = new FormData();
      
      // 基本情報を追加
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('type', formData.type);
      formDataToSend.append('category_id', formData.category_id);
      formDataToSend.append('difficulty', formData.difficulty);
      formDataToSend.append('estimated_hours', formData.estimated_hours.toString());
      formDataToSend.append('tags', formData.tags);
      formDataToSend.append('content', formData.content);
      
      // ファイルを追加
      uploadedFiles.forEach(fileObj => {
        formDataToSend.append('files', fileObj.file);
      });
      
      const response = await fetch('/api/content/upload', {
        method: 'POST',
        headers: {
          'x-user-sid': user?.sid || '',
        },
        body: formDataToSend
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('コンテンツが正常にアップロードされました');
        // 新しいコンテンツ情報を返す（実際のサーバーから取得したIDを使用）
        const newContent = {
          id: result.contentId,
          title: formData.title,
          description: formData.description,
          type: formData.type,
          category_id: formData.category_id,
          difficulty: formData.difficulty,
          estimated_hours: formData.estimated_hours,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
          content: formData.content,
          created_date: new Date().toISOString(),
          updated_date: new Date().toISOString(),
          author_name: user?.display_name || 'Unknown Author',
          author_sid: user?.sid || '',
          author_role: user?.role || 'user',
          category: categories.find(cat => cat.id === formData.category_id)?.name || 'Unknown',
          attachments: uploadedFiles.map(file => ({
            id: file.id,
            name: file.file.name,
            size: file.size,
            type: file.type
          }))
        };
        onSuccess(newContent);
        onClose();
        resetForm();
      } else {
        throw new Error(result.message || 'アップロードに失敗しました');
      }
    } catch (error) {
      console.error('アップロードエラー:', error);
      alert('アップロードエラー: ' + (error as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: '',
      category_id: '',
      difficulty: '',
      estimated_hours: 1,
      tags: '',
      content: ''
    });
    setUploadedFiles([]);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden`}>
        <div className={`flex items-center justify-between p-6 border-b ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-xl font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-800'}`}>新しいコンテンツを追加</h2>
          <button
            onClick={onClose}
            className={`${resolvedTheme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'} text-2xl`}
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* 基本情報 */}
          <div className="mb-6">
            <h3 className={`text-lg font-semibold mb-4 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-800'}`}>基本情報</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  タイトル *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    resolvedTheme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  required
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  タイプ *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    resolvedTheme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  required
                >
                  <option value="">選択してください</option>
                  <option value="article">記事</option>
                  <option value="video">動画</option>
                  <option value="exercise">練習</option>
                  <option value="document">文書</option>
                </select>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  カテゴリ *
                </label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    resolvedTheme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  required
                >
                  <option value="">選択してください</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  難易度 *
                </label>
                <select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    resolvedTheme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  required
                >
                  <option value="">選択してください</option>
                  <option value="beginner">初級</option>
                  <option value="intermediate">中級</option>
                  <option value="advanced">上級</option>
                </select>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  推定学習時間（時間）
                </label>
                <input
                  type="number"
                  name="estimated_hours"
                  value={formData.estimated_hours}
                  onChange={handleInputChange}
                  min="0"
                  step="0.5"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    resolvedTheme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  タグ（カンマ区切り）
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="例: HTML, CSS, 基礎"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    resolvedTheme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
            </div>
            
            <div className="mt-4">
              <label className={`block text-sm font-medium mb-1 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                概要 *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  resolvedTheme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                required
              />
            </div>
          </div>

          {/* ファイルアップロード */}
          <div className="mb-6">
            <h3 className={`text-lg font-semibold mb-4 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-800'}`}>ファイルアップロード</h3>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : resolvedTheme === 'dark' 
                    ? 'border-gray-600 bg-gray-700' 
                    : 'border-gray-300 bg-gray-50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="text-4xl mb-4">📁</div>
              <p className={`mb-4 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                ファイルをドラッグ&ドロップするか、クリックして選択してください
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                ファイルを選択
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    handleFiles(Array.from(e.target.files));
                  }
                }}
              />
            </div>
            
            {uploadedFiles.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">選択されたファイル:</h4>
                <div className="space-y-2">
                  {uploadedFiles.map(file => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center space-x-3">
                        {file.preview && (
                          <img src={file.preview} alt="Preview" className="w-8 h-8 object-cover rounded" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{file.file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(file.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* コンテンツ本文 */}
          <div className="mb-6">
            <h3 className={`text-lg font-semibold mb-4 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-800'}`}>コンテンツ本文（Markdown形式）</h3>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              rows={10}
              placeholder="Markdown形式でコンテンツを記述してください..."
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm ${
                resolvedTheme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>

          {/* ボタン */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-md transition-colors ${
                resolvedTheme === 'dark' 
                  ? 'text-gray-300 bg-gray-600 hover:bg-gray-500' 
                  : 'text-gray-600 bg-gray-200 hover:bg-gray-300'
              }`}
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {isUploading && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              )}
              {isUploading ? 'アップロード中...' : 'アップロード'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}



