'use client';

import React, { useState, useEffect } from 'react';

interface Recommendation {
  id: string;
  contentId: string;
  title: string;
  description: string;
  type: 'content' | 'learning_path' | 'skill' | 'user';
  reason: string;
  confidence: number;
  score: number;
  metadata: {
    difficulty: string;
    category: string;
    tags: string[];
    estimatedHours: number;
    author: string;
    views: number;
    rating: number;
  };
}

interface UserProfile {
  userId: string;
  interests: string[];
  skills: string[];
  completedContent: string[];
  inProgressContent: string[];
  searchHistory: string[];
  preferences: {
    difficulty: string[];
    categories: string[];
    contentTypes: string[];
  };
  behavior: {
    averageSessionDuration: number;
    preferredTimeOfDay: string;
    deviceType: string;
  };
}

interface ContentRecommendationEngineProps {
  userId: string;
  onRecommendationClick?: (recommendation: Recommendation) => void;
  className?: string;
}

export function ContentRecommendationEngine({ 
  userId, 
  onRecommendationClick, 
  className = '' 
}: ContentRecommendationEngineProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [recommendationType, setRecommendationType] = useState<'personalized' | 'trending' | 'similar' | 'collaborative'>('personalized');
  const [showProfile, setShowProfile] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadUserProfile();
    loadRecommendations();
  }, [userId, recommendationType, refreshKey]);

  const loadUserProfile = async () => {
    try {
      // 実際のAPIからユーザープロフィールを取得
      // const response = await fetch(`/api/users/${userId}/profile`);
      // const data = await response.json();
      
      // モックデータ
      const mockProfile: UserProfile = {
        userId: userId,
        interests: ['React', 'TypeScript', 'Web開発', 'フロントエンド'],
        skills: ['JavaScript', 'HTML', 'CSS', 'React'],
        completedContent: ['content-1', 'content-3'],
        inProgressContent: ['content-2'],
        searchHistory: ['React', 'TypeScript', 'Next.js', 'JavaScript'],
        preferences: {
          difficulty: ['beginner', 'intermediate'],
          categories: ['プログラミング', 'Web開発'],
          contentTypes: ['article', 'video']
        },
        behavior: {
          averageSessionDuration: 25.5,
          preferredTimeOfDay: 'morning',
          deviceType: 'desktop'
        }
      };
      
      setUserProfile(mockProfile);
    } catch (error) {
      console.error('ユーザープロフィールの読み込みに失敗:', error);
    }
  };

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      // 実際のAPIから推薦を取得
      // const response = await fetch(`/api/recommendations/${userId}?type=${recommendationType}`);
      // const data = await response.json();
      
      // モックデータ
      const mockRecommendations: Recommendation[] = [
        {
          id: '1',
          contentId: 'content-4',
          title: 'Vue.js入門ガイド',
          description: 'Vue.jsの基本的な概念と使い方を学習するためのガイドです。',
          type: 'content',
          reason: 'あなたがReactを学習しているため、他のフロントエンドフレームワークも興味があるかもしれません',
          confidence: 0.85,
          score: 0.92,
          metadata: {
            difficulty: 'beginner',
            category: 'プログラミング',
            tags: ['Vue.js', 'JavaScript', 'フロントエンド'],
            estimatedHours: 3,
            author: '田中太郎',
            views: 67,
            rating: 4.2
          }
        },
        {
          id: '2',
          contentId: 'content-5',
          title: 'TypeScript上級テクニック',
          description: 'TypeScriptの高度な機能とベストプラクティスを学びます。',
          type: 'content',
          reason: 'あなたのTypeScriptスキルレベルに基づいて推薦されています',
          confidence: 0.78,
          score: 0.88,
          metadata: {
            difficulty: 'advanced',
            category: 'プログラミング',
            tags: ['TypeScript', '上級', 'ベストプラクティス'],
            estimatedHours: 5,
            author: '佐藤花子',
            views: 45,
            rating: 4.5
          }
        },
        {
          id: '3',
          contentId: 'learning-path-1',
          title: 'フルスタック開発コース',
          description: 'フロントエンドからバックエンドまで、包括的なWeb開発を学習するコースです。',
          type: 'learning_path',
          reason: 'あなたの学習履歴と興味に基づいて推薦されています',
          confidence: 0.72,
          score: 0.85,
          metadata: {
            difficulty: 'intermediate',
            category: 'Web開発',
            tags: ['フルスタック', 'Node.js', 'データベース'],
            estimatedHours: 20,
            author: '山田次郎',
            views: 123,
            rating: 4.3
          }
        },
        {
          id: '4',
          contentId: 'skill-1',
          title: 'Node.js開発スキル',
          description: 'サーバーサイドJavaScript開発のスキルを身につけましょう。',
          type: 'skill',
          reason: 'あなたのJavaScriptスキルを活かして、バックエンド開発も学習できます',
          confidence: 0.68,
          score: 0.82,
          metadata: {
            difficulty: 'intermediate',
            category: 'プログラミング',
            tags: ['Node.js', 'サーバーサイド', 'JavaScript'],
            estimatedHours: 8,
            author: '鈴木一郎',
            views: 89,
            rating: 4.1
          }
        },
        {
          id: '5',
          contentId: 'content-6',
          title: 'Webパフォーマンス最適化',
          description: 'Webアプリケーションのパフォーマンスを向上させるテクニックを学びます。',
          type: 'content',
          reason: '類似のユーザーが高く評価しているコンテンツです',
          confidence: 0.65,
          score: 0.79,
          metadata: {
            difficulty: 'intermediate',
            category: 'Web開発',
            tags: ['パフォーマンス', '最適化', 'Web'],
            estimatedHours: 4,
            author: '高橋三郎',
            views: 156,
            rating: 4.4
          }
        }
      ];
      
      setRecommendations(mockRecommendations);
    } catch (error) {
      console.error('推薦の読み込みに失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleRecommendationClick = (recommendation: Recommendation) => {
    if (onRecommendationClick) {
      onRecommendationClick(recommendation);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'content': return '📄';
      case 'learning_path': return '🎓';
      case 'skill': return '💡';
      case 'user': return '👤';
      default: return '📄';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'content': return 'コンテンツ';
      case 'learning_path': return '学習パス';
      case 'skill': return 'スキル';
      case 'user': return 'ユーザー';
      default: return 'コンテンツ';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-400 bg-green-400/20';
      case 'intermediate': return 'text-yellow-400 bg-yellow-400/20';
      case 'advanced': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getRecommendationReason = (type: string) => {
    switch (type) {
      case 'personalized': return 'あなたの学習履歴と興味に基づいて推薦されています';
      case 'trending': return '現在人気の高いコンテンツです';
      case 'similar': return '類似のコンテンツを学習したユーザーが興味を持っています';
      case 'collaborative': return 'あなたと似た学習パターンのユーザーが高く評価しています';
      default: return '推薦されています';
    }
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-64 ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">コンテンツ推薦エンジン</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowProfile(true)}
            className="px-4 py-2 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
          >
            プロフィール表示
          </button>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
          >
            更新
          </button>
        </div>
      </div>

      {/* 推薦タイプ選択 */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'personalized', label: 'パーソナライズ' },
          { key: 'trending', label: 'トレンド' },
          { key: 'similar', label: '類似コンテンツ' },
          { key: 'collaborative', label: '協調フィルタリング' }
        ].map(typeOption => (
          <button
            key={typeOption.key}
            onClick={() => setRecommendationType(typeOption.key as any)}
            className={`px-4 py-2 rounded transition-colors ${
              recommendationType === typeOption.key
                ? 'bg-brand text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            {typeOption.label}
          </button>
        ))}
      </div>

      {/* 推薦理由 */}
      <div className="rounded-lg bg-blue-500/10 p-4 ring-1 ring-blue-500/20">
        <p className="text-blue-400 text-sm">
          {getRecommendationReason(recommendationType)}
        </p>
      </div>

      {/* 推薦一覧 */}
      <div className="space-y-4">
        {recommendations.map((recommendation) => (
          <div
            key={recommendation.id}
            className="rounded-lg bg-white/5 p-6 ring-1 ring-white/10 hover:ring-white/20 transition-colors cursor-pointer"
            onClick={() => handleRecommendationClick(recommendation)}
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl">{getTypeIcon(recommendation.type)}</span>
              
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-semibold text-lg">{recommendation.title}</h3>
                      <span className="px-2 py-1 rounded text-xs bg-white/10 text-white/70">
                        {getTypeLabel(recommendation.type)}
                      </span>
                    </div>
                    <p className="text-white/70 text-sm mb-2">{recommendation.description}</p>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-sm font-medium ${getConfidenceColor(recommendation.confidence)}`}>
                      信頼度: {(recommendation.confidence * 100).toFixed(1)}%
                    </div>
                    <div className="text-white/50 text-xs">
                      スコア: {(recommendation.score * 100).toFixed(1)}
                    </div>
                  </div>
                </div>
                
                {/* 推薦理由 */}
                <div className="mb-3">
                  <p className="text-white/60 text-sm bg-black/20 rounded p-2">
                    💡 {recommendation.reason}
                  </p>
                </div>
                
                {/* メタデータ */}
                <div className="flex items-center gap-4 text-sm text-white/50 mb-3">
                  <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(recommendation.metadata.difficulty)}`}>
                    {recommendation.metadata.difficulty}
                  </span>
                  <span>{recommendation.metadata.category}</span>
                  <span>{recommendation.metadata.estimatedHours}時間</span>
                  <span>⭐ {recommendation.metadata.rating}</span>
                  <span>👁️ {recommendation.metadata.views}</span>
                </div>
                
                {/* タグ */}
                <div className="flex flex-wrap gap-1">
                  {recommendation.metadata.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 rounded bg-brand/20 text-brand text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {recommendations.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🤖</div>
          <p className="text-white/70">推薦できるコンテンツがありません</p>
          <p className="text-white/50 text-sm mt-2">
            より多くのコンテンツを学習すると、より良い推薦が可能になります
          </p>
        </div>
      )}

      {/* ユーザープロフィールモーダル */}
      {showProfile && userProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-800">ユーザープロフィール</h2>
              <button
                onClick={() => setShowProfile(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-6">
                {/* 興味・スキル */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">興味・スキル</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-600 mb-2">興味</h4>
                      <div className="flex flex-wrap gap-1">
                        {userProfile.interests.map((interest, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-600 mb-2">スキル</h4>
                      <div className="flex flex-wrap gap-1">
                        {userProfile.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 rounded bg-green-100 text-green-800 text-xs"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 学習履歴 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">学習履歴</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-600 mb-2">完了済み</h4>
                      <div className="text-sm text-gray-800">
                        {userProfile.completedContent.length}件
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-600 mb-2">進行中</h4>
                      <div className="text-sm text-gray-800">
                        {userProfile.inProgressContent.length}件
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 検索履歴 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">検索履歴</h3>
                  <div className="flex flex-wrap gap-1">
                    {userProfile.searchHistory.map((query, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 rounded bg-gray-100 text-gray-800 text-xs"
                      >
                        {query}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* 行動パターン */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">行動パターン</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">平均セッション時間:</span>
                      <span className="ml-2 text-gray-800">{userProfile.behavior.averageSessionDuration}分</span>
                    </div>
                    <div>
                      <span className="text-gray-600">好みの時間帯:</span>
                      <span className="ml-2 text-gray-800">{userProfile.behavior.preferredTimeOfDay}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">デバイス:</span>
                      <span className="ml-2 text-gray-800">{userProfile.behavior.deviceType}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



