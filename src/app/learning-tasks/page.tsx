'use client';

import { useEffect, useState } from 'react';
import { apiClient, Material, Category } from '../../lib/api';
import { Assignment } from '../../lib/data';
import { AssignmentTab } from './components/AssignmentTab';
import { MyLearningTab } from './components/MyLearningTab';
import { RecommendationTab } from './components/RecommendationTab';
import { ContentModal } from '../../components/ContentModal';

export default function Page() {
  const [activeTab, setActiveTab] = useState<'instructions' | 'my_learning' | 'recommendations'>('instructions');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // ContentModal用の状態
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        
        // 認証とユーザー情報を取得
        const authResult = await apiClient.authenticate();
        if (authResult?.user) {
          setUser(authResult.user);
        } else {
          throw new Error('ユーザー情報の取得に失敗しました');
        }
        
      } catch (err) {
        console.error('ユーザー取得エラー:', err);
        setError('ユーザー情報の取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleShowContentDetail = (content: Material | Assignment) => {
    console.log('🔍 [handleShowContentDetail] Opening content modal for content:', content);
    
    // アサインメントの場合はcontentプロパティから取得
    const material = 'content' in content ? content.content : content;
    
    const contentForModal = {
      id: (material as Material).id,
      title: (material as Material).title,
      description: (material as Material).description,
      difficulty: (material as Material).difficulty,
      estimated_hours: (material as Material).estimated_hours,
      type: 'material' // ContentModalで必要なフィールド
    };
    
    setSelectedContent(contentForModal);
    setIsContentModalOpen(true);
  };

  const handleCloseContentModal = () => {
    setIsContentModalOpen(false);
    setSelectedContent(null);
  };

  const handleProgressUpdate = async (contentId: string, progress: number, status: string) => {
    console.log(`[handleProgressUpdate] Content ID: ${contentId}, Progress: ${progress}, Status: ${status}`);
    
    try {
      const response = await fetch('/api/learning-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({
          userId: user?.sid,
          contentId,
          status,
          progress
        })
      });

      if (!response.ok) {
        throw new Error('進捗の更新に失敗しました');
      }

      console.log('進捗更新成功');
    } catch (err) {
      console.error('進捗更新エラー:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-white/70">データを読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-500/10 p-6 ring-1 ring-red-500/20">
        <h2 className="text-xl font-semibold mb-3 text-red-400">エラー</h2>
        <p className="text-red-300">{error}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-lg bg-red-500/10 p-6 ring-1 ring-red-500/20">
        <h2 className="text-xl font-semibold mb-3 text-red-400">エラー</h2>
        <p className="text-red-300">ユーザー情報が見つかりません。</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white/5 p-6 ring-1 ring-white/10">
        <h2 className="text-xl font-semibold mb-6">学習課題</h2>
        
        {/* タブナビゲーション */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
          <div className="flex gap-2">
                   <button
                     className={`px-6 py-3 rounded-lg text-sm font-medium transition-colors ${
                       activeTab === 'instructions'
                         ? 'bg-brand text-white'
                         : 'bg-black/20 text-white/70 hover:bg-black/40'
                     }`}
                     onClick={() => setActiveTab('instructions')}
                   >
                     学習指示
                   </button>
            <button
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'my_learning'
                  ? 'bg-brand text-white'
                  : 'bg-black/20 text-white/70 hover:bg-black/40'
              }`}
              onClick={() => setActiveTab('my_learning')}
            >
              マイ学習
            </button>
            <button
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'recommendations'
                  ? 'bg-brand text-white'
                  : 'bg-black/20 text-white/70 hover:bg-black/40'
              }`}
              onClick={() => setActiveTab('recommendations')}
            >
              推奨
            </button>
          </div>
          
                 {/* 権限に応じたボタン表示 */}
                 {(user.role === 'admin' || user.role === 'instructor') && (
                   <button
                     className="px-4 py-2 rounded bg-brand text-white text-sm hover:bg-brand-dark transition-colors"
                     onClick={() => window.location.href = '/assignments'}
                   >
                     新しい学習指示を作成
                   </button>
                 )}
        </div>

        {/* タブコンテンツ */}
        {activeTab === 'instructions' && (
          <AssignmentTab
            userId={user.sid}
            userRole={user.role}
            onShowContentDetail={handleShowContentDetail}
            onCloseContentModal={handleCloseContentModal}
            selectedContent={selectedContent}
            isContentModalOpen={isContentModalOpen}
            onProgressUpdate={handleProgressUpdate}
          />
        )}

        {activeTab === 'my_learning' && (
          <MyLearningTab
            userId={user.sid}
            onShowContentDetail={handleShowContentDetail}
            onCloseContentModal={handleCloseContentModal}
            selectedContent={selectedContent}
            isContentModalOpen={isContentModalOpen}
            onProgressUpdate={handleProgressUpdate}
          />
        )}

        {activeTab === 'recommendations' && (
          <RecommendationTab
            userId={user.sid}
            onShowContentDetail={handleShowContentDetail}
            onCloseContentModal={handleCloseContentModal}
            selectedContent={selectedContent}
            isContentModalOpen={isContentModalOpen}
            onProgressUpdate={handleProgressUpdate}
          />
        )}
      </div>
    </div>
  );
}