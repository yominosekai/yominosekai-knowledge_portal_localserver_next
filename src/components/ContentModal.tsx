'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { checkPermission } from '../lib/auth';

interface ContentModalProps {
  content: any;
  isOpen: boolean;
  onClose: () => void;
  onProgressUpdate?: (contentId: string, status: string) => void;
  onContentDeleted?: (contentId: string) => void;
}

export function ContentModal({ content, isOpen, onClose, onProgressUpdate, onContentDeleted }: ContentModalProps): React.ReactElement | null {
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const [currentStatus, setCurrentStatus] = useState<string>('not_started');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contentDetails, setContentDetails] = useState<any>(null);
  const [attachments, setAttachments] = useState<any[]>([]);

  useEffect(() => {
    console.log('ContentModal - useEffect triggered with content:', content);
    console.log('ContentModal - Content ID from props:', content?.id);
    if (content && user) {
      fetchUserProgress();
      fetchContentDetails();
    }
  }, [content, user]);

  const fetchUserProgress = async () => {
    if (!user || !content) return;

    try {
      const response = await fetch(`/api/progress/${user.sid}`);
      const data = await response.json();
      
      if (data.activities) {
        const userActivity = data.activities.find((activity: any) => 
          activity.material_id === content.id
        );
        
        if (userActivity) {
          setCurrentStatus(userActivity.status);
        }
      }
    } catch (error) {
      console.error('進捗取得エラー:', error);
    }
  };

  const fetchContentDetails = async () => {
    if (!content) return;

    try {
      console.log('ContentModal - Fetching content details for ID:', content.id);
      const response = await fetch(`/api/content/${content.id}`);
      const data = await response.json();
      
      console.log('ContentModal - API Response:', data);
      console.log('ContentModal - Content ID:', content.id);
      
      if (data.success && data.content) {
        setContentDetails(data.content);
        
        console.log('ContentModal - Content details:', data.content);
        console.log('ContentModal - Attachments:', data.content.attachments);
        console.log('ContentModal - File path:', data.content.file_path);
        console.log('ContentModal - Files array:', data.content.files);
        
        // 添付ファイル情報を取得
        if (data.content.attachments && data.content.attachments.length > 0) {
          console.log('ContentModal - Setting attachments from metadata');
          setAttachments(data.content.attachments);
        } else if (data.content.files && data.content.files.length > 0) {
          console.log('ContentModal - Setting attachments from files array');
          setAttachments(data.content.files);
        } else if (data.content.file_path) {
          console.log('ContentModal - Setting single file attachment');
          // 単一ファイルの場合
          setAttachments([{
            name: data.content.title,
            original_name: data.content.title,
            file_path: data.content.file_path,
            size: 0
          }]);
        } else {
          console.log('ContentModal - No attachments found');
          console.log('ContentModal - Available keys:', Object.keys(data.content));
          setAttachments([]);
        }
      } else {
        console.error('コンテンツ詳細の取得に失敗:', data);
        setError('コンテンツの詳細情報を取得できませんでした');
      }
    } catch (error) {
      console.error('コンテンツ詳細取得エラー:', error);
    }
  };

  const updateProgress = async (status: string) => {
    if (!user || !content) return;

    setIsUpdating(true);
    setError(null);

    try {
      const response = await fetch(`/api/progress/${user.sid}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          material_id: content.id,
          status: status,
          score: status === 'completed' ? 100 : status === 'in_progress' ? 50 : 0
        })
      });

      const result = await response.json();

      if (result.success) {
        setCurrentStatus(status);
        if (onProgressUpdate) {
          onProgressUpdate(content.id, status);
        }
      } else {
        setError(result.error || '進捗の更新に失敗しました');
      }
    } catch (error) {
      console.error('進捗更新エラー:', error);
      setError('進捗の更新に失敗しました');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkComplete = () => {
    if (currentStatus === 'completed') {
      updateProgress('not_started');
    } else {
      updateProgress('completed');
    }
  };

  const handleMarkInProgress = () => {
    if (currentStatus === 'in_progress') {
      updateProgress('not_started');
    } else {
      updateProgress('in_progress');
    }
  };

  const handleStartLearning = () => {
    updateProgress('in_progress');
  };

  const handleDeleteLocalContent = async () => {
    if (!user || !content) return;

    // 権限チェック（instructor以上）
    if (!checkPermission(user, 'instructor')) {
      alert('コンテンツの削除にはinstructor以上の権限が必要です');
      return;
    }

    // 確認ダイアログ
    if (!confirm(`「${content.title}」をローカルから削除しますか？この操作は取り消せません。`)) {
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      const response = await fetch(`/api/content/${content.id}/delete-local`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();

      if (result.success) {
        alert('ローカルのコンテンツを削除しました');
        // 削除完了コールバックを呼び出し
        if (onContentDeleted) {
          onContentDeleted(content.id);
        } else {
          onClose(); // モーダルを閉じる
        }
        // ページをリロードしてコンテンツ一覧を更新
        window.location.reload();
      } else {
        setError(result.error || 'ローカルコンテンツの削除に失敗しました');
      }
    } catch (error) {
      console.error('ローカルコンテンツ削除エラー:', error);
      setError('ローカルコンテンツの削除に失敗しました');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteServerContent = async () => {
    if (!user || !content) return;

    // 権限チェック（instructor以上）
    if (!checkPermission(user, 'instructor')) {
      alert('コンテンツの削除にはinstructor以上の権限が必要です');
      return;
    }

    // 確認ダイアログ
    if (!confirm(`「${content.title}」をサーバーから削除しますか？この操作は取り消せません。`)) {
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      const response = await fetch(`/api/content/${content.id}/delete-server`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();

      if (result.success) {
        alert('サーバーのコンテンツを削除しました');
        // 削除完了コールバックを呼び出し
        if (onContentDeleted) {
          onContentDeleted(content.id);
        } else {
          onClose(); // モーダルを閉じる
        }
        // ページをリロードしてコンテンツ一覧を更新
        window.location.reload();
      } else {
        setError(result.error || 'サーバーコンテンツの削除に失敗しました');
      }
    } catch (error) {
      console.error('サーバーコンテンツ削除エラー:', error);
      setError('サーバーコンテンツの削除に失敗しました');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '完了';
      case 'in_progress': return '学習中';
      case 'not_started': return '未開始';
      default: return '不明';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-400/20';
      case 'in_progress': return 'text-yellow-400 bg-yellow-400/20';
      case 'not_started': return 'text-gray-400 bg-gray-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatContent = (content: any) => {
    if (!content || typeof content !== 'string') {
      return '';
    }
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'xls':
      case 'xlsx': return '📊';
      case 'ppt':
      case 'pptx': return '📽️';
      case 'mp4':
      case 'avi':
      case 'mov': return '🎥';
      case 'mp3':
      case 'wav': return '🎵';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return '🖼️';
      case 'zip':
      case 'rar': return '📦';
      default: return '📄';
    }
  };

  if (!isOpen || !content) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className={`${resolvedTheme === 'dark' ? 'bg-gray-900' : 'bg-white'} rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden`}>
        {/* ヘッダー */}
        <div className={`flex items-center justify-between p-6 border-b ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div>
            <h2 className={`text-xl font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{content.title}</h2>
            {content.uuid && (
              <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-1 font-mono`}>
                UUID: {content.uuid}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className={`${resolvedTheme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'} text-2xl`}
          >
            ×
          </button>
        </div>
        
        {/* コンテンツ */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* 基本情報 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-800'} mb-2`}>基本情報</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex">
                    <span className={`font-medium ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} w-20`}>ID:</span>
                    <span className={`${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{content.id}</span>
                  </div>
                  <div className="flex">
                    <span className={`font-medium ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} w-20`}>タイプ:</span>
                    <span className={`${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-800'} capitalize`}>{content.type}</span>
                  </div>
                  <div className="flex">
                    <span className={`font-medium ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} w-20`}>カテゴリ:</span>
                    <span className={`${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{contentDetails?.category || 'Unknown Category'}</span>
                  </div>
                  <div className="flex">
                    <span className={`font-medium ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} w-20`}>難易度:</span>
                    <span className={`${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-800'} capitalize`}>{content.difficulty}</span>
                  </div>
                  <div className="flex">
                    <span className={`font-medium ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} w-20`}>時間:</span>
                    <span className={`${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{content.estimated_hours}時間</span>
                  </div>
                  <div className="flex">
                    <span className={`font-medium ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} w-20`}>作成者:</span>
                    <div className="flex items-center gap-2">
                      <span 
                        className={`${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-800'} cursor-help`}
                        title={contentDetails?.author_sid || 'Unknown SID'}
                      >
                        {contentDetails?.author_name || 'Unknown Author'}
                      </span>
                      {contentDetails?.author_role && (
                        <span 
                          className={`inline-block w-3 h-3 rounded-full ${
                            contentDetails.author_role === 'admin' ? 'bg-red-500' :
                            contentDetails.author_role === 'instructor' ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          title={`Role: ${contentDetails.author_role}`}
                        />
                      )}
                    </div>
                  </div>
                  <div className="flex">
                    <span className={`font-medium ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} w-20`}>作成日:</span>
                    <span className={`${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                      {contentDetails?.created_date ? new Date(contentDetails.created_date).toLocaleDateString('ja-JP') : 'Unknown'}
                    </span>
                  </div>
                  <div className="flex">
                    <span className={`font-medium ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} w-20`}>更新日:</span>
                    <span className={`${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                      {contentDetails?.updated_date ? new Date(contentDetails.updated_date).toLocaleDateString('ja-JP') : 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-800'} mb-2`}>進捗状況</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>現在の状態:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(currentStatus)}`}>
                      {getStatusText(currentStatus)}
                    </span>
                  </div>
                  
                  {error && (
                    <div className={`text-red-500 text-sm ${resolvedTheme === 'dark' ? 'bg-red-900/20' : 'bg-red-50'} p-2 rounded`}>
                      {error}
                    </div>
                  )}
                  
                  {!contentDetails && !error && (
                    <div className={`${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'} text-sm`}>
                      コンテンツ詳細を読み込み中...
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* 添付ファイル */}
            {attachments && attachments.length > 0 ? (
              <div className={`${resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} p-4 rounded-lg`}>
                <h3 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-800'} mb-3`}>📎 添付ファイル</h3>
                <div className="space-y-2">
                  {attachments.map((file, index) => (
                    <div key={index} className={`flex items-center p-3 ${resolvedTheme === 'dark' ? 'bg-gray-700' : 'bg-white'} rounded border ${resolvedTheme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
                      <span className="text-2xl mr-3">{getFileIcon(file.original_name || file.safe_name || file.name)}</span>
                      <div className="flex-1">
                        <div className={`font-medium ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                          {file.original_name || file.safe_name || file.name || 'Unknown'}
                        </div>
                        {file.size && (
                          <div className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            {formatFileSize(file.size)}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          console.log('ContentModal - Download button clicked for file:', file);
                          if (file.path || file.file_path) {
                            const filePath = file.path || file.file_path;
                            console.log('ContentModal - Downloading file with path:', filePath);
                            window.open(`/api/content/${content.id}/download?file=${encodeURIComponent(filePath)}`, '_blank');
                          } else {
                            console.error('ContentModal - No file path available for download');
                          }
                        }}
                        className={`px-3 py-1 rounded text-sm transition-colors ${
                          resolvedTheme === 'dark' 
                            ? 'bg-blue-500 text-white hover:bg-blue-600' 
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                      >
                        ダウンロード
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className={`${resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} p-4 rounded-lg`}>
                <h3 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-800'} mb-3`}>📎 添付ファイル</h3>
                <div className={`${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'} text-sm`}>
                  添付ファイルはありません
                </div>
              </div>
            )}
            
            {/* 説明 */}
            <div>
              <h3 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-800'} mb-2`}>説明</h3>
              <p className={`${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{content.description}</p>
            </div>
            
            {/* コンテンツ本文 */}
            {contentDetails && contentDetails.content && contentDetails.content.trim() !== '' && (
              <div>
                <h3 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-800'} mb-2`}>📝 本文</h3>
                <div 
                  className={`${resolvedTheme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} p-4 rounded border min-h-[100px]`}
                  dangerouslySetInnerHTML={{ __html: formatContent(contentDetails.content) }}
                />
              </div>
            )}
            
            {/* コンテンツ本文（フォールバック） */}
            {(!contentDetails || !contentDetails.content || contentDetails.content.trim() === '') && content.content && content.content.trim() !== '' && (
              <div>
                <h3 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-800'} mb-2`}>📝 本文</h3>
                <div 
                  className={`${resolvedTheme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} p-4 rounded border min-h-[100px]`}
                  dangerouslySetInnerHTML={{ __html: formatContent(content.content) }}
                />
              </div>
            )}
            
            {/* デバッグ情報 */}
            {(!contentDetails || !contentDetails.content || contentDetails.content.trim() === '') && (!content.content || content.content.trim() === '') && (
              <div className={`${resolvedTheme === 'dark' ? 'bg-yellow-900/20' : 'bg-yellow-50'} p-4 rounded border`}>
                <h3 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-800'} mb-2`}>📝 本文</h3>
                <div className={`${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'} text-sm`}>
                  本文が見つかりませんでした
                  <br />
                  <small>Debug: contentDetails = {JSON.stringify(contentDetails)}</small>
                  <br />
                  <small>Debug: content.content = {JSON.stringify(content.content)}</small>
                </div>
              </div>
            )}
            
            {/* タグ */}
            {contentDetails && contentDetails.tags && contentDetails.tags.length > 0 && (
              <div>
                <h3 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-800'} mb-2`}>タグ</h3>
                <div className="flex flex-wrap gap-2">
                  {contentDetails.tags.map((tag: string, index: number) => (
                    <span
                      key={index}
                      className={`px-2 py-1 rounded text-sm ${resolvedTheme === 'dark' ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-800'}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* フッター - 元のアプリケーションと同じボタン配置 */}
        <div className={`flex items-center justify-center gap-3 p-6 border-t ${resolvedTheme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'} flex-wrap`}>
          <button
            id="mark-complete-btn"
            onClick={handleMarkComplete}
            disabled={isUpdating}
            className={`px-4 py-2 rounded transition-colors ${
              currentStatus === 'completed' 
                ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                : 'bg-green-500 text-white hover:bg-green-600'
            } disabled:opacity-50`}
          >
            {isUpdating ? '更新中...' : currentStatus === 'completed' ? '完了を解除' : '完了としてマーク'}
          </button>
          
          <button
            id="mark-in-progress-btn"
            onClick={handleMarkInProgress}
            disabled={isUpdating}
            className={`px-4 py-2 rounded transition-colors ${
              currentStatus === 'in_progress' 
                ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                : 'bg-yellow-500 text-white hover:bg-yellow-600'
            } disabled:opacity-50`}
          >
            {isUpdating ? '更新中...' : currentStatus === 'in_progress' ? '学習中を解除' : '学習中としてマーク'}
          </button>
          
          <button
            id="start-learning-btn"
            onClick={handleStartLearning}
            disabled={isUpdating}
            className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            {isUpdating ? '更新中...' : '学習を開始'}
          </button>
          
          {/* 削除ボタン（instructor以上のみ表示） */}
          {user && checkPermission(user, 'instructor') && (
            <div className="flex gap-2">
              <button
                onClick={handleDeleteLocalContent}
                disabled={isUpdating}
                className="px-3 py-2 rounded bg-yellow-500 text-white hover:bg-yellow-600 disabled:opacity-50 transition-colors text-sm"
                title="ローカルのみ削除"
              >
                {isUpdating ? '削除中...' : 'ローカル削除'}
              </button>
              <button
                onClick={handleDeleteServerContent}
                disabled={isUpdating}
                className="px-3 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 transition-colors text-sm"
                title="サーバーのみ削除"
              >
                {isUpdating ? '削除中...' : 'サーバー削除'}
              </button>
            </div>
          )}
          
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-300 text-gray-700 hover:bg-gray-400 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
