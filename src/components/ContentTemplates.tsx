'use client';

import React, { useState, useEffect } from 'react';

interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  type: 'article' | 'video' | 'exercise' | 'document';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedHours: number;
  tags: string[];
  template: {
    title: string;
    description: string;
    content: string;
    structure: TemplateStructure[];
  };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
  isPublic: boolean;
}

interface TemplateStructure {
  id: string;
  type: 'section' | 'subsection' | 'text' | 'list' | 'code' | 'image' | 'video' | 'exercise';
  title: string;
  content: string;
  placeholder?: string;
  required: boolean;
  order: number;
}

interface ContentTemplatesProps {
  onTemplateSelect?: (template: ContentTemplate) => void;
  className?: string;
}

export function ContentTemplates({ onTemplateSelect, className = '' }: ContentTemplatesProps) {
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'my' | 'public'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ContentTemplate | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      // 実際のAPIからテンプレートを取得
      // const response = await fetch('/api/content-templates');
      // const data = await response.json();
      
      // モックデータ
      const mockTemplates: ContentTemplate[] = [
        {
          id: '1',
          name: '技術記事テンプレート',
          description: '技術的な内容を説明する記事用のテンプレート',
          category: '技術',
          type: 'article',
          difficulty: 'intermediate',
          estimatedHours: 2,
          tags: ['技術', '記事', 'プログラミング'],
          template: {
            title: '{{技術名}}入門 - {{具体的な内容}}',
            description: '{{技術名}}について、{{学習目標}}を目標に学習していきます。',
            content: '# {{技術名}}入門\n\n## 概要\n{{技術の概要を説明}}\n\n## 前提知識\n- {{前提知識1}}\n- {{前提知識2}}\n\n## 学習内容\n### 1. {{基本概念}}\n{{基本概念の説明}}\n\n### 2. {{実践的な内容}}\n{{実践的な内容の説明}}\n\n## まとめ\n{{学習内容のまとめ}}',
            structure: [
              { id: '1', type: 'section', title: '概要', content: '{{技術の概要を説明}}', required: true, order: 1 },
              { id: '2', type: 'section', title: '前提知識', content: '{{前提知識のリスト}}', required: true, order: 2 },
              { id: '3', type: 'section', title: '学習内容', content: '{{学習内容の詳細}}', required: true, order: 3 },
              { id: '4', type: 'section', title: 'まとめ', content: '{{学習内容のまとめ}}', required: true, order: 4 }
            ]
          },
          createdBy: 'admin',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          usageCount: 15,
          isPublic: true
        },
        {
          id: '2',
          name: '動画学習テンプレート',
          description: '動画コンテンツ用の学習テンプレート',
          category: '教育',
          type: 'video',
          difficulty: 'beginner',
          estimatedHours: 1,
          tags: ['動画', '学習', '教育'],
          template: {
            title: '{{トピック}}学習動画',
            description: '{{トピック}}について学習する動画コンテンツです。',
            content: '# {{トピック}}学習動画\n\n## 学習目標\n- {{目標1}}\n- {{目標2}}\n\n## 動画内容\n### 導入 (5分)\n{{導入内容}}\n\n### 本編 ({{時間}}分)\n{{本編内容}}\n\n### まとめ (5分)\n{{まとめ内容}}\n\n## 復習問題\n1. {{問題1}}\n2. {{問題2}}',
            structure: [
              { id: '1', type: 'section', title: '学習目標', content: '{{学習目標の設定}}', required: true, order: 1 },
              { id: '2', type: 'section', title: '動画内容', content: '{{動画の構成}}', required: true, order: 2 },
              { id: '3', type: 'section', title: '復習問題', content: '{{復習問題の設定}}', required: false, order: 3 }
            ]
          },
          createdBy: 'admin',
          createdAt: '2024-01-02T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
          usageCount: 8,
          isPublic: true
        },
        {
          id: '3',
          name: '実習課題テンプレート',
          description: '実践的な課題や演習用のテンプレート',
          category: '実習',
          type: 'exercise',
          difficulty: 'advanced',
          estimatedHours: 3,
          tags: ['実習', '課題', '演習'],
          template: {
            title: '{{課題名}}実習',
            description: '{{課題名}}について実践的に学習する課題です。',
            content: '# {{課題名}}実習\n\n## 課題概要\n{{課題の概要}}\n\n## 学習目標\n- {{目標1}}\n- {{目標2}}\n- {{目標3}}\n\n## 前提条件\n- {{条件1}}\n- {{条件2}}\n\n## 実習手順\n### ステップ1: {{手順1}}\n{{手順1の詳細}}\n\n### ステップ2: {{手順2}}\n{{手順2の詳細}}\n\n## 評価基準\n- {{基準1}}\n- {{基準2}}',
            structure: [
              { id: '1', type: 'section', title: '課題概要', content: '{{課題の概要}}', required: true, order: 1 },
              { id: '2', type: 'section', title: '学習目標', content: '{{学習目標の設定}}', required: true, order: 2 },
              { id: '3', type: 'section', title: '前提条件', content: '{{前提条件の設定}}', required: true, order: 3 },
              { id: '4', type: 'section', title: '実習手順', content: '{{実習手順の詳細}}', required: true, order: 4 },
              { id: '5', type: 'section', title: '評価基準', content: '{{評価基準の設定}}', required: true, order: 5 }
            ]
          },
          createdBy: 'admin',
          createdAt: '2024-01-03T00:00:00Z',
          updatedAt: '2024-01-03T00:00:00Z',
          usageCount: 5,
          isPublic: true
        }
      ];
      
      setTemplates(mockTemplates);
    } catch (error) {
      console.error('テンプレートの読み込みに失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesFilter = filter === 'all' || 
      (filter === 'my' && template.createdBy === 'current-user') ||
      (filter === 'public' && template.isPublic);
    
    const matchesSearch = !searchTerm || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = !selectedCategory || template.category === selectedCategory;
    
    return matchesFilter && matchesSearch && matchesCategory;
  });

  const categories = [...new Set(templates.map(t => t.category))];

  const handleTemplateSelect = (template: ContentTemplate) => {
    if (onTemplateSelect) {
      onTemplateSelect(template);
    } else {
      setSelectedTemplate(template);
      setShowPreviewModal(true);
    }
  };

  const handleCreateFromTemplate = (template: ContentTemplate) => {
    // テンプレートから新しいコンテンツを作成
    console.log('Creating content from template:', template);
    // 実際の実装では、コンテンツ作成モーダルを開く
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'article': return '📄';
      case 'video': return '🎥';
      case 'exercise': return '💻';
      case 'document': return '📋';
      default: return '📄';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-400 bg-green-400/20';
      case 'intermediate': return 'text-yellow-400 bg-yellow-400/20';
      case 'advanced': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
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
        <h2 className="text-xl font-semibold text-white">コンテンツテンプレート</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded bg-brand text-white hover:bg-brand-dark transition-colors"
        >
          新しいテンプレート
        </button>
      </div>

      {/* フィルター */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'すべて' },
            { key: 'my', label: 'マイテンプレート' },
            { key: 'public', label: '公開テンプレート' }
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

        <input
          type="text"
          placeholder="テンプレートを検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 min-w-64 rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white placeholder-white/40"
        />

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white"
        >
          <option value="">すべてのカテゴリ</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      {/* テンプレート一覧 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className="rounded-lg bg-white/5 p-6 ring-1 ring-white/10 hover:ring-white/20 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getTypeIcon(template.type)}</span>
                <div>
                  <h3 className="font-semibold text-white">{template.name}</h3>
                  <p className="text-white/70 text-sm">{template.category}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(template.difficulty)}`}>
                {template.difficulty}
              </span>
            </div>
            
            <p className="text-white/70 text-sm mb-4 line-clamp-2">{template.description}</p>
            
            <div className="flex flex-wrap gap-1 mb-4">
              {template.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 rounded bg-white/10 text-white/70 text-xs"
                >
                  {tag}
                </span>
              ))}
              {template.tags.length > 3 && (
                <span className="px-2 py-1 rounded bg-white/10 text-white/70 text-xs">
                  +{template.tags.length - 3}
                </span>
              )}
            </div>
            
            <div className="flex items-center justify-between text-sm text-white/50 mb-4">
              <span>{template.estimatedHours}時間</span>
              <span>{template.usageCount}回使用</span>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => handleTemplateSelect(template)}
                className="flex-1 px-3 py-2 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors text-sm"
              >
                プレビュー
              </button>
              <button
                onClick={() => handleCreateFromTemplate(template)}
                className="flex-1 px-3 py-2 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors text-sm"
              >
                使用
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📄</div>
          <p className="text-white/70">該当するテンプレートが見つかりませんでした</p>
        </div>
      )}

      {/* テンプレートプレビューモーダル */}
      {showPreviewModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">{selectedTemplate.name}</h2>
                <p className="text-gray-600 mt-1">{selectedTemplate.description}</p>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* テンプレート情報 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-800">{selectedTemplate.type}</div>
                  <div className="text-sm text-gray-600">タイプ</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-800">{selectedTemplate.estimatedHours}</div>
                  <div className="text-sm text-gray-600">推定時間（時間）</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-800">{selectedTemplate.usageCount}</div>
                  <div className="text-sm text-gray-600">使用回数</div>
                </div>
              </div>

              {/* テンプレート構造 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">テンプレート構造</h3>
                <div className="space-y-3">
                  {selectedTemplate.template.structure.map((section) => (
                    <div
                      key={section.id}
                      className="p-4 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">
                          {section.type === 'section' && '📋'}
                          {section.type === 'subsection' && '📝'}
                          {section.type === 'text' && '📄'}
                          {section.type === 'list' && '📋'}
                          {section.type === 'code' && '💻'}
                          {section.type === 'image' && '🖼️'}
                          {section.type === 'video' && '🎥'}
                          {section.type === 'exercise' && '💪'}
                        </span>
                        <h4 className="font-medium text-gray-800">{section.title}</h4>
                        {section.required && (
                          <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-800">
                            必須
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm">{section.content}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* プレビュー */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">プレビュー</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">{selectedTemplate.template.title}</h4>
                  <p className="text-gray-600 text-sm mb-4">{selectedTemplate.template.description}</p>
                  <div className="bg-white rounded p-4 border">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedTemplate.template.content}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                閉じる
              </button>
              <button
                onClick={() => {
                  handleCreateFromTemplate(selectedTemplate);
                  setShowPreviewModal(false);
                }}
                className="px-4 py-2 bg-brand text-white rounded-md hover:bg-brand-dark transition-colors"
              >
                このテンプレートを使用
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



