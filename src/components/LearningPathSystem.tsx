'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';

interface LearningPath {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedHours: number;
  prerequisites: string[];
  modules: LearningModule[];
  isCompleted: boolean;
  progress: number;
}

interface LearningModule {
  id: string;
  title: string;
  description: string;
  type: 'content' | 'exercise' | 'assessment';
  contentId?: string;
  order: number;
  isCompleted: boolean;
  isUnlocked: boolean;
  estimatedMinutes: number;
}

interface LearningPathSystemProps {
  userId: string;
  className?: string;
}

export function LearningPathSystem({ userId, className = '' }: LearningPathSystemProps) {
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'available' | 'in_progress' | 'completed'>('all');

  useEffect(() => {
    loadLearningPaths();
  }, [userId]);

  const loadLearningPaths = async () => {
    try {
      setLoading(true);
      // 実際のAPIから学習パスを取得
      // const response = await fetch(`/api/users/${userId}/learning-paths`);
      // const data = await response.json();
      
      // モックデータ
      const mockPaths: LearningPath[] = [
        {
          id: '1',
          title: 'Web開発入門コース',
          description: 'HTML、CSS、JavaScriptの基礎から学ぶWeb開発の入門コースです。',
          difficulty: 'beginner',
          estimatedHours: 20,
          prerequisites: [],
          isCompleted: false,
          progress: 35,
          modules: [
            {
              id: '1-1',
              title: 'HTML基礎',
              description: 'HTMLの基本的なタグと構造を学びます',
              type: 'content',
              contentId: 'html-basics',
              order: 1,
              isCompleted: true,
              isUnlocked: true,
              estimatedMinutes: 60
            },
            {
              id: '1-2',
              title: 'CSS基礎',
              description: 'CSSの基本的なスタイリングを学びます',
              type: 'content',
              contentId: 'css-basics',
              order: 2,
              isCompleted: true,
              isUnlocked: true,
              estimatedMinutes: 90
            },
            {
              id: '1-3',
              title: 'JavaScript基礎',
              description: 'JavaScriptの基本的な文法を学びます',
              type: 'content',
              contentId: 'js-basics',
              order: 3,
              isCompleted: false,
              isUnlocked: true,
              estimatedMinutes: 120
            },
            {
              id: '1-4',
              title: '実践演習',
              description: '学んだ知識を使って簡単なWebページを作成します',
              type: 'exercise',
              order: 4,
              isCompleted: false,
              isUnlocked: false,
              estimatedMinutes: 180
            }
          ]
        },
        {
          id: '2',
          title: 'React上級コース',
          description: 'Reactの高度な機能とパフォーマンス最適化を学ぶコースです。',
          difficulty: 'advanced',
          estimatedHours: 30,
          prerequisites: ['Web開発入門コース'],
          isCompleted: false,
          progress: 0,
          modules: [
            {
              id: '2-1',
              title: 'React Hooks深掘り',
              description: 'useEffect、useCallback、useMemoの詳細を学びます',
              type: 'content',
              contentId: 'react-hooks-advanced',
              order: 1,
              isCompleted: false,
              isUnlocked: false,
              estimatedMinutes: 150
            },
            {
              id: '2-2',
              title: 'パフォーマンス最適化',
              description: 'Reactアプリのパフォーマンスを最適化する手法を学びます',
              type: 'content',
              contentId: 'react-performance',
              order: 2,
              isCompleted: false,
              isUnlocked: false,
              estimatedMinutes: 120
            }
          ]
        }
      ];
      
      setLearningPaths(mockPaths);
    } catch (error) {
      console.error('学習パスの読み込みに失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPaths = learningPaths.filter(path => {
    switch (filter) {
      case 'available':
        return path.prerequisites.length === 0 || path.prerequisites.every(prereq => 
          learningPaths.find(p => p.title === prereq)?.isCompleted
        );
      case 'in_progress':
        return path.progress > 0 && path.progress < 100;
      case 'completed':
        return path.isCompleted;
      default:
        return true;
    }
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-400 bg-green-400/20';
      case 'intermediate': return 'text-yellow-400 bg-yellow-400/20';
      case 'advanced': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getModuleIcon = (type: string) => {
    switch (type) {
      case 'content': return '📚';
      case 'exercise': return '💻';
      case 'assessment': return '📝';
      default: return '📄';
    }
  };

  const getModuleStatusColor = (module: LearningModule) => {
    if (module.isCompleted) return 'text-green-400 bg-green-400/20';
    if (module.isUnlocked) return 'text-blue-400 bg-blue-400/20';
    return 'text-gray-400 bg-gray-400/20';
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
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">学習パス</h2>
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'すべて' },
            { key: 'available', label: '受講可能' },
            { key: 'in_progress', label: '進行中' },
            { key: 'completed', label: '完了' }
          ].map(filterOption => (
            <button
              key={filterOption.key}
              onClick={() => setFilter(filterOption.key as any)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                filter === filterOption.key
                  ? 'bg-brand text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {filterOption.label}
            </button>
          ))}
        </div>
      </div>

      {/* 学習パス一覧 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPaths.map((path) => (
          <div
            key={path.id}
            className="rounded-lg bg-white/5 p-6 ring-1 ring-white/10 hover:ring-white/20 transition-colors cursor-pointer"
            onClick={() => setSelectedPath(path)}
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-semibold text-white">{path.title}</h3>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(path.difficulty)}`}>
                {path.difficulty}
              </span>
            </div>
            
            <p className="text-white/70 text-sm mb-4 line-clamp-2">{path.description}</p>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/70">進捗</span>
                <span className="text-white">{path.progress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-brand h-2 rounded-full transition-all duration-300"
                  style={{ width: `${path.progress}%` }}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-4 text-sm text-white/50">
              <span>{path.estimatedHours}時間</span>
              <span>{path.modules.length}モジュール</span>
            </div>
          </div>
        ))}
      </div>

      {/* 学習パス詳細モーダル */}
      {selectedPath && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">{selectedPath.title}</h2>
                <p className="text-gray-600 mt-1">{selectedPath.description}</p>
              </div>
              <button
                onClick={() => setSelectedPath(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* パス情報 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-800">{selectedPath.progress}%</div>
                  <div className="text-sm text-gray-600">進捗率</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-800">{selectedPath.estimatedHours}</div>
                  <div className="text-sm text-gray-600">推定時間（時間）</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-800">{selectedPath.modules.length}</div>
                  <div className="text-sm text-gray-600">モジュール数</div>
                </div>
              </div>

              {/* 前提条件 */}
              {selectedPath.prerequisites.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">前提条件</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedPath.prerequisites.map((prereq, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {prereq}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* モジュール一覧 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">モジュール一覧</h3>
                <div className="space-y-3">
                  {selectedPath.modules.map((module) => (
                    <div
                      key={module.id}
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        module.isUnlocked 
                          ? 'border-gray-200 hover:border-gray-300' 
                          : 'border-gray-100 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">{getModuleIcon(module.type)}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-800">{module.title}</h4>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getModuleStatusColor(module)}`}>
                              {module.isCompleted ? '完了' : module.isUnlocked ? '利用可能' : 'ロック中'}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm mb-2">{module.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>{module.estimatedMinutes}分</span>
                            <span className="capitalize">{module.type}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {module.isUnlocked && !module.isCompleted && (
                            <button className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors">
                              開始
                            </button>
                          )}
                          {module.isCompleted && (
                            <button className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors">
                              再学習
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


