'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useTheme } from '@/contexts/ThemeContext';

interface LearningFile {
  id: string;
  name: string;
  safe_name?: string;
  type: 'pdf' | 'pptx' | 'docx' | 'txt' | 'md' | 'video' | 'image' | 'other';
  url: string;
  order: number;
  completed: boolean;
}

interface LearningViewerProps {
  contentId: string;
  contentTitle: string;
  files: LearningFile[];
  onClose: () => void;
}

export function LearningViewer({ contentId, contentTitle, files, onClose }: LearningViewerProps) {
  const [currentFile, setCurrentFile] = useState<LearningFile | null>(null); // 初期は何も選択されていない
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    // 学習開始時の処理
    console.log('学習開始:', contentTitle);
  }, [contentTitle]);

  const handleFileSelect = (file: LearningFile) => {
    setCurrentFile(file);
  };

  const handlePrevious = () => {
    const currentIndex = files.findIndex(f => f.id === currentFile?.id);
    if (currentIndex > 0) {
      setCurrentFile(files[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    const currentIndex = files.findIndex(f => f.id === currentFile?.id);
    if (currentIndex < files.length - 1) {
      setCurrentFile(files[currentIndex + 1]);
    }
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
      {/* ヘッダー */}
      <div className="flex items-center justify-between p-4 bg-black/50 border-b border-white/10">
        <h2 className="text-xl font-semibold text-white">{contentTitle}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-white/10 text-white/70 hover:text-white"
          >
            ×
          </button>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex flex-1">
        {/* 左側: ジャンプタブ */}
        <div className="w-64 bg-black/20 border-r border-white/10 p-4">
          <JumpTabs />
        </div>

        {/* 右側: メイン表示エリア + ファイルタブ */}
        <div className="flex-1 flex flex-col">
          {/* ファイルタブ（右上） */}
          <div className="flex justify-end p-4">
            <FileTabs files={files} onFileSelect={handleFileSelect} currentFile={currentFile} />
          </div>

          {/* メイン表示エリア */}
          <div className="flex-1">
            {currentFile ? (
              <ContentViewer file={currentFile} />
            ) : (
              <div className="flex items-center justify-center h-full text-white/70">
                <div className="text-center">
                  <div className="text-6xl mb-4">📑</div>
                  <h3 className="text-2xl font-semibold mb-2">目次サンプル</h3>
                  <p className="text-white/60">左側のジャンプタブまたは添付ファイルから選択してください</p>
                </div>
              </div>
            )}
          </div>

          {/* 下部コントロール */}
          <LearningControls
            progress={progress}
            isPaused={isPaused}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onPause={handlePause}
            canGoPrevious={files.findIndex(f => f.id === currentFile?.id) > 0}
            canGoNext={files.findIndex(f => f.id === currentFile?.id) < files.length - 1}
          />
        </div>
      </div>
    </div>
  );
}

// ジャンプタブコンポーネント
function JumpTabs() {
  const [activeTab, setActiveTab] = useState('outline');

  const tabs = [
    { id: 'outline', label: '目次', icon: '📑' },
    { id: 'goals', label: '目標', icon: '🎯' },
    { id: 'notes', label: 'メモ', icon: '📝' },
    { id: 'progress', label: '進捗', icon: '⏱️' },
  ];

  return (
    <div className="space-y-2">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded transition-colors ${
            activeTab === tab.id
              ? 'bg-brand text-white'
              : 'bg-black/20 text-white/70 hover:bg-white/10'
          }`}
          onClick={() => setActiveTab(tab.id)}
        >
          <span className="text-lg">{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

// ファイルタブコンポーネント
interface FileTabsProps {
  files: LearningFile[];
  onFileSelect: (file: LearningFile) => void;
  currentFile: LearningFile | null;
}

function FileTabs({ files, onFileSelect, currentFile }: FileTabsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getFileIcon = (type: string) => {
    const icons: Record<string, string> = {
      pdf: '📄',
      pptx: '📊',
      docx: '📝',
      txt: '📄',
      md: '📝',
      video: '🎥',
      image: '🖼️',
    };
    return icons[type] || '📄';
  };

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <button
        className="flex items-center gap-2 px-3 py-2 rounded bg-black/20 hover:bg-black/40 transition-colors text-white/70 hover:text-white"
      >
        <span>📎</span>
        <span>添付ファイル</span>
        <span className="text-xs">({files.length})</span>
      </button>

      {isExpanded && (
        <>
          {/* 見えない橋渡し要素 */}
          <div className="absolute top-full right-0 h-1 w-full bg-transparent" />
          <div className="absolute top-full right-0 w-64 bg-black/90 rounded shadow-lg z-10 border border-white/10">
            <div className="p-2">
              {files.map(file => (
                <button
                  key={file.id}
                  className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 transition-colors ${
                    currentFile?.id === file.id
                      ? 'bg-brand text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                  onClick={() => {
                    onFileSelect(file);
                    setIsExpanded(false);
                  }}
                >
                  <span>{getFileIcon(file.type)}</span>
                  <span className="truncate">{file.name}</span>
                  {file.completed && <span className="text-green-400">✓</span>}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// コンテンツ表示エリア
interface ContentViewerProps {
  file: LearningFile;
}

function ContentViewer({ file }: ContentViewerProps) {
  const [fileContent, setFileContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const fetchFileContent = async () => {
      if (file.type === 'txt' || file.type === 'md') {
        setLoading(true);
        setError(null);
        
        try {
          // ファイル名からコンテンツIDを抽出（URLから）
          const urlParts = file.url.split('/');
          const contentIdIndex = urlParts.findIndex(part => part === 'content');
          const contentId = urlParts[contentIdIndex + 1];
          
          const response = await fetch(`/api/content/${contentId}/file-content/${file.safe_name || file.name}`);
          const data = await response.json();
          
          if (data.success) {
            setFileContent(data.content);
          } else {
            setError('ファイルの読み込みに失敗しました');
          }
        } catch (err) {
          console.error('ファイル内容取得エラー:', err);
          setError('ファイルの読み込みに失敗しました');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchFileContent();
  }, [file]);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 25, 300));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 25, 50));
  };

  const handleResetZoom = () => {
    setZoomLevel(100);
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const renderContent = () => {
    switch (file.type) {
      case 'pdf':
        return (
          <div className={`h-full ${resolvedTheme === 'dark' ? 'bg-gray-900' : 'bg-white'} flex flex-col ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
            {/* コントロールバー */}
            <div className={`flex items-center justify-between p-4 ${resolvedTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'} border-b`}>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleZoomOut}
                  className={`p-2 ${resolvedTheme === 'dark' ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-200 text-gray-700'} rounded transition-colors`}
                  title="縮小"
                >
                  <span className="text-lg">−</span>
                </button>
                <span className={`text-sm font-medium min-w-[60px] text-center ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-700'}`}>
                  {zoomLevel}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className={`p-2 ${resolvedTheme === 'dark' ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-200 text-gray-700'} rounded transition-colors`}
                  title="拡大"
                >
                  <span className="text-lg">+</span>
                </button>
                <button
                  onClick={handleResetZoom}
                  className={`px-3 py-1 text-xs ${resolvedTheme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} rounded transition-colors`}
                  title="リセット"
                >
                  リセット
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleFullscreen}
                  className={`p-2 ${resolvedTheme === 'dark' ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-200 text-gray-700'} rounded transition-colors`}
                  title={isFullscreen ? "フルスクリーン終了" : "フルスクリーン"}
                >
                  <span className="text-lg">{isFullscreen ? '⤓' : '⤢'}</span>
                </button>
              </div>
            </div>
            
            {/* PDF表示エリア */}
            <div className="flex-1 overflow-auto">
              <iframe
                src={file.url}
                className="w-full h-full border-0"
                title={file.name}
                style={{ 
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: 'top left',
                  width: `${100 / (zoomLevel / 100)}%`,
                  height: `${100 / (zoomLevel / 100)}%`
                }}
              />
            </div>
          </div>
        );
      case 'video':
        return (
          <div className="h-full bg-black flex items-center justify-center">
            <video
              src={file.url}
              controls
              className="max-w-full max-h-full"
              title={file.name}
            >
              お使いのブラウザは動画タグをサポートしていません。
            </video>
          </div>
        );
      case 'image':
        return (
          <div className={`h-full ${resolvedTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'} flex flex-col ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
            {/* コントロールバー */}
            <div className={`flex items-center justify-between p-4 ${resolvedTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-200 border-gray-200'} border-b`}>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleZoomOut}
                  className={`p-2 ${resolvedTheme === 'dark' ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-300 text-gray-700'} rounded transition-colors`}
                  title="縮小"
                >
                  <span className="text-lg">−</span>
                </button>
                <span className={`text-sm font-medium min-w-[60px] text-center ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-700'}`}>
                  {zoomLevel}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className={`p-2 ${resolvedTheme === 'dark' ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-300 text-gray-700'} rounded transition-colors`}
                  title="拡大"
                >
                  <span className="text-lg">+</span>
                </button>
                <button
                  onClick={handleResetZoom}
                  className={`px-3 py-1 text-xs ${resolvedTheme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-700'} rounded transition-colors`}
                  title="リセット"
                >
                  リセット
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleFullscreen}
                  className={`p-2 ${resolvedTheme === 'dark' ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-300 text-gray-700'} rounded transition-colors`}
                  title={isFullscreen ? "フルスクリーン終了" : "フルスクリーン"}
                >
                  <span className="text-lg">{isFullscreen ? '⤓' : '⤢'}</span>
                </button>
              </div>
            </div>
            
            {/* 画像表示エリア */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-4">
              <img
                src={file.url}
                alt={file.name}
                className="object-contain"
                style={{ 
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: 'center',
                  maxWidth: '100%',
                  maxHeight: '100%'
                }}
              />
            </div>
          </div>
        );
      case 'txt':
        if (loading) {
          return (
            <div className={`h-full ${resolvedTheme === 'dark' ? 'bg-gray-900' : 'bg-white'} flex items-center justify-center`}>
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto mb-4"></div>
                <p className={resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>ファイルを読み込み中...</p>
              </div>
            </div>
          );
        }
        
        if (error) {
          return (
            <div className={`h-full ${resolvedTheme === 'dark' ? 'bg-gray-900' : 'bg-white'} flex items-center justify-center`}>
              <div className="text-center">
                <div className="text-6xl mb-4">❌</div>
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          );
        }
        
        return (
          <div className={`h-full ${resolvedTheme === 'dark' ? 'bg-gray-900' : 'bg-white'} flex flex-col ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
            {/* コントロールバー */}
            <div className={`flex items-center justify-between p-4 ${resolvedTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'} border-b`}>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleZoomOut}
                  className={`p-2 ${resolvedTheme === 'dark' ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-200 text-gray-700'} rounded transition-colors`}
                  title="縮小"
                >
                  <span className="text-lg">−</span>
                </button>
                <span className={`text-sm font-medium min-w-[60px] text-center ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-700'}`}>
                  {zoomLevel}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className={`p-2 ${resolvedTheme === 'dark' ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-200 text-gray-700'} rounded transition-colors`}
                  title="拡大"
                >
                  <span className="text-lg">+</span>
                </button>
                <button
                  onClick={handleResetZoom}
                  className={`px-3 py-1 text-xs ${resolvedTheme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} rounded transition-colors`}
                  title="リセット"
                >
                  リセット
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleFullscreen}
                  className={`p-2 ${resolvedTheme === 'dark' ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-200 text-gray-700'} rounded transition-colors`}
                  title={isFullscreen ? "フルスクリーン終了" : "フルスクリーン"}
                >
                  <span className="text-lg">{isFullscreen ? '⤓' : '⤢'}</span>
                </button>
              </div>
            </div>
            
            {/* コンテンツ表示エリア */}
            <div className="flex-1 overflow-auto p-6">
              <div 
                className={`whitespace-pre-wrap font-mono text-sm ${resolvedTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}
                style={{ 
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: 'top left',
                  width: `${100 / (zoomLevel / 100)}%`
                }}
              >
                {fileContent}
              </div>
            </div>
          </div>
        );
      case 'md':
        if (loading) {
          return (
            <div className={`h-full ${resolvedTheme === 'dark' ? 'bg-gray-900' : 'bg-white'} flex items-center justify-center`}>
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto mb-4"></div>
                <p className={resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Markdownを読み込み中...</p>
              </div>
            </div>
          );
        }
        
        if (error) {
          return (
            <div className={`h-full ${resolvedTheme === 'dark' ? 'bg-gray-900' : 'bg-white'} flex items-center justify-center`}>
              <div className="text-center">
                <div className="text-6xl mb-4">❌</div>
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          );
        }
        
        return (
          <div className={`h-full ${resolvedTheme === 'dark' ? 'bg-gray-900' : 'bg-white'} flex flex-col ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
            {/* コントロールバー */}
            <div className={`flex items-center justify-between p-4 ${resolvedTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'} border-b`}>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleZoomOut}
                  className={`p-2 ${resolvedTheme === 'dark' ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-200 text-gray-700'} rounded transition-colors`}
                  title="縮小"
                >
                  <span className="text-lg">−</span>
                </button>
                <span className={`text-sm font-medium min-w-[60px] text-center ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-700'}`}>
                  {zoomLevel}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className={`p-2 ${resolvedTheme === 'dark' ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-200 text-gray-700'} rounded transition-colors`}
                  title="拡大"
                >
                  <span className="text-lg">+</span>
                </button>
                <button
                  onClick={handleResetZoom}
                  className={`px-3 py-1 text-xs ${resolvedTheme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} rounded transition-colors`}
                  title="リセット"
                >
                  リセット
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleFullscreen}
                  className={`p-2 ${resolvedTheme === 'dark' ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-200 text-gray-700'} rounded transition-colors`}
                  title={isFullscreen ? "フルスクリーン終了" : "フルスクリーン"}
                >
                  <span className="text-lg">{isFullscreen ? '⤓' : '⤢'}</span>
                </button>
              </div>
            </div>
            
            {/* コンテンツ表示エリア */}
            <div className="flex-1 overflow-auto p-6">
              <div 
                className={`prose prose-lg max-w-none ${resolvedTheme === 'dark' ? 'prose-invert' : ''}`}
                style={{ 
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: 'top left',
                  width: `${100 / (zoomLevel / 100)}%`
                }}
              >
                <ReactMarkdown>{fileContent}</ReactMarkdown>
              </div>
            </div>
          </div>
        );
      case 'pptx':
      case 'docx':
        return (
          <div className={`h-full ${resolvedTheme === 'dark' ? 'bg-gray-900' : 'bg-white'} flex items-center justify-center`}>
            <div className="text-center p-8">
              <div className="text-6xl mb-4">📊</div>
              <h3 className={`text-xl font-semibold mb-2 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{file.name}</h3>
              <p className={resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-4>Officeファイルの表示</p>
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 bg-brand text-white rounded hover:bg-brand-dark transition-colors"
              >
                新しいタブで開く
              </a>
            </div>
          </div>
        );
      default:
        return (
          <div className={`h-full ${resolvedTheme === 'dark' ? 'bg-gray-900' : 'bg-white'} flex items-center justify-center`}>
            <div className="text-center p-8">
              <div className="text-6xl mb-4">📄</div>
              <h3 className={`text-xl font-semibold mb-2 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{file.name}</h3>
              <p className={resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-4>ファイルの表示</p>
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 bg-brand text-white rounded hover:bg-brand-dark transition-colors"
              >
                新しいタブで開く
              </a>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-full">
      {renderContent()}
    </div>
  );
}

// 学習コントロール
interface LearningControlsProps {
  progress: number;
  isPaused: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onPause: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
}

function LearningControls({
  progress,
  isPaused,
  onPrevious,
  onNext,
  onPause,
  canGoPrevious,
  canGoNext
}: LearningControlsProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-black/10 border-t border-white/10">
      <div className="flex-1 mr-4">
        <div className="w-full bg-white/20 rounded-full h-2">
          <div
            className="bg-brand h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-xs text-white/50 mt-1">
          {Math.round(progress)}% 完了
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className={`px-4 py-2 rounded transition-colors ${
            canGoPrevious
              ? 'bg-black/20 text-white/70 hover:bg-black/40 hover:text-white'
              : 'bg-black/10 text-white/30 cursor-not-allowed'
          }`}
        >
          ← 前
        </button>
        <button
          onClick={onPause}
          className="px-4 py-2 rounded bg-black/20 text-white/70 hover:bg-black/40 hover:text-white transition-colors"
        >
          {isPaused ? '▶️ 再開' : '⏸️ 一時停止'}
        </button>
        <button
          onClick={onNext}
          disabled={!canGoNext}
          className={`px-4 py-2 rounded transition-colors ${
            canGoNext
              ? 'bg-black/20 text-white/70 hover:bg-black/40 hover:text-white'
              : 'bg-black/10 text-white/30 cursor-not-allowed'
          }`}
        >
          次 →
        </button>
      </div>
    </div>
  );
}
