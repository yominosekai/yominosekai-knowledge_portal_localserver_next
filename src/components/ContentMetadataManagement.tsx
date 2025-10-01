'use client';

import React, { useState, useEffect } from 'react';

interface MetadataField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect' | 'url' | 'email';
  label: string;
  description: string;
  required: boolean;
  options?: string[];
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

interface ContentMetadata {
  id: string;
  contentId: string;
  fields: Record<string, any>;
  tags: string[];
  categories: string[];
  customAttributes: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface ContentMetadataManagementProps {
  contentId?: string;
  onMetadataChange?: (metadata: ContentMetadata) => void;
  className?: string;
}

export function ContentMetadataManagement({ 
  contentId, 
  onMetadataChange, 
  className = '' 
}: ContentMetadataManagementProps) {
  const [metadataFields, setMetadataFields] = useState<MetadataField[]>([]);
  const [contentMetadata, setContentMetadata] = useState<ContentMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [editingField, setEditingField] = useState<MetadataField | null>(null);
  const [newField, setNewField] = useState<Partial<MetadataField>>({
    type: 'text',
    required: false
  });
  const [metadataForm, setMetadataForm] = useState<Record<string, any>>({});
  const [tags, setTags] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    loadMetadataFields();
    if (contentId) {
      loadContentMetadata();
    }
  }, [contentId]);

  const loadMetadataFields = async () => {
    try {
      setLoading(true);
      // 実際のAPIからメタデータフィールドを取得
      // const response = await fetch('/api/metadata/fields');
      // const data = await response.json();
      
      // モックデータ
      const mockFields: MetadataField[] = [
        {
          id: '1',
          name: 'difficulty',
          type: 'select',
          label: '難易度',
          description: 'コンテンツの難易度レベル',
          required: true,
          options: ['beginner', 'intermediate', 'advanced'],
          defaultValue: 'beginner'
        },
        {
          id: '2',
          name: 'estimated_hours',
          type: 'number',
          label: '推定学習時間（時間）',
          description: '完了までに必要な時間',
          required: true,
          validation: {
            min: 0.1,
            max: 1000,
            message: '0.1から1000の間で入力してください'
          },
          defaultValue: 1
        },
        {
          id: '3',
          name: 'language',
          type: 'select',
          label: '言語',
          description: 'コンテンツの言語',
          required: false,
          options: ['ja', 'en', 'zh', 'ko'],
          defaultValue: 'ja'
        },
        {
          id: '4',
          name: 'is_featured',
          type: 'boolean',
          label: 'おすすめ',
          description: 'おすすめコンテンツとして表示するか',
          required: false,
          defaultValue: false
        },
        {
          id: '5',
          name: 'target_audience',
          type: 'multiselect',
          label: '対象者',
          description: '対象となる学習者',
          required: false,
          options: ['新入社員', '中級者', '上級者', '管理者', 'エンジニア', 'デザイナー']
        },
        {
          id: '6',
          name: 'last_reviewed',
          type: 'date',
          label: '最終レビュー日',
          description: '最後に内容を確認した日付',
          required: false
        },
        {
          id: '7',
          name: 'external_url',
          type: 'url',
          label: '外部リンク',
          description: '関連する外部リソースのURL',
          required: false
        },
        {
          id: '8',
          name: 'contact_email',
          type: 'email',
          label: '連絡先メール',
          description: '質問やフィードバック用のメールアドレス',
          required: false
        }
      ];
      
      setMetadataFields(mockFields);
    } catch (error) {
      console.error('メタデータフィールドの読み込みに失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadContentMetadata = async () => {
    if (!contentId) return;

    try {
      // 実際のAPIからコンテンツメタデータを取得
      // const response = await fetch(`/api/content/${contentId}/metadata`);
      // const data = await response.json();
      
      // モックデータ
      const mockMetadata: ContentMetadata = {
        id: '1',
        contentId: contentId,
        fields: {
          difficulty: 'intermediate',
          estimated_hours: 2.5,
          language: 'ja',
          is_featured: true,
          target_audience: ['中級者', 'エンジニア'],
          last_reviewed: '2024-01-15',
          external_url: 'https://example.com',
          contact_email: 'support@company.com'
        },
        tags: ['React', 'JavaScript', 'フロントエンド'],
        categories: ['プログラミング', 'Web開発'],
        customAttributes: {
          'custom_field_1': 'カスタム値1',
          'custom_field_2': 'カスタム値2'
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T10:30:00Z'
      };
      
      setContentMetadata(mockMetadata);
      setMetadataForm(mockMetadata.fields);
      setTags(mockMetadata.tags);
      setCategories(mockMetadata.categories);
    } catch (error) {
      console.error('コンテンツメタデータの読み込みに失敗:', error);
    }
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setMetadataForm(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const updatedTags = [...tags, newTag.trim()];
      setTags(updatedTags);
      setNewTag('');
      updateMetadata({ tags: updatedTags });
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = tags.filter(tag => tag !== tagToRemove);
    setTags(updatedTags);
    updateMetadata({ tags: updatedTags });
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      const updatedCategories = [...categories, newCategory.trim()];
      setCategories(updatedCategories);
      setNewCategory('');
      updateMetadata({ categories: updatedCategories });
    }
  };

  const handleRemoveCategory = (categoryToRemove: string) => {
    const updatedCategories = categories.filter(category => category !== categoryToRemove);
    setCategories(updatedCategories);
    updateMetadata({ categories: updatedCategories });
  };

  const updateMetadata = async (updates: Partial<ContentMetadata>) => {
    if (!contentId) return;

    try {
      const response = await fetch(`/api/content/${contentId}/metadata`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const updatedMetadata = { ...contentMetadata, ...updates };
        setContentMetadata(updatedMetadata);
        if (onMetadataChange) {
          onMetadataChange(updatedMetadata);
        }
      } else {
        throw new Error('メタデータの更新に失敗しました');
      }
    } catch (error) {
      console.error('メタデータ更新エラー:', error);
      alert('メタデータの更新に失敗しました');
    }
  };

  const handleSaveField = async () => {
    try {
      const fieldData = editingField || newField;
      
      const response = await fetch('/api/metadata/fields', {
        method: editingField ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fieldData)
      });

      if (response.ok) {
        alert(`フィールドを${editingField ? '更新' : '作成'}しました`);
        setShowFieldModal(false);
        setEditingField(null);
        setNewField({ type: 'text', required: false });
        loadMetadataFields();
      } else {
        throw new Error('フィールドの保存に失敗しました');
      }
    } catch (error) {
      console.error('フィールド保存エラー:', error);
      alert('フィールドの保存に失敗しました');
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    if (!confirm('このフィールドを削除しますか？')) return;

    try {
      const response = await fetch(`/api/metadata/fields/${fieldId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('フィールドを削除しました');
        loadMetadataFields();
      } else {
        throw new Error('フィールドの削除に失敗しました');
      }
    } catch (error) {
      console.error('フィールド削除エラー:', error);
      alert('フィールドの削除に失敗しました');
    }
  };

  const renderFieldInput = (field: MetadataField) => {
    const value = metadataForm[field.name] || field.defaultValue || '';

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="w-full rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white placeholder-white/40"
            placeholder={field.description}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.name, parseFloat(e.target.value))}
            min={field.validation?.min}
            max={field.validation?.max}
            className="w-full rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white placeholder-white/40"
            placeholder={field.description}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="w-full rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white placeholder-white/40"
          />
        );

      case 'boolean':
        return (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => handleFieldChange(field.name, e.target.checked)}
              className="w-4 h-4 text-brand rounded focus:ring-brand"
            />
            <span className="text-white/70 text-sm">{field.description}</span>
          </label>
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="w-full rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white"
          >
            <option value="">選択してください</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'multiselect':
        return (
          <div className="space-y-2">
            <select
              multiple
              value={value || []}
              onChange={(e) => {
                const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                handleFieldChange(field.name, selectedOptions);
              }}
              className="w-full rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white"
            >
              {field.options?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <p className="text-white/50 text-xs">Ctrl+クリックで複数選択</p>
          </div>
        );

      case 'url':
        return (
          <input
            type="url"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="w-full rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white placeholder-white/40"
            placeholder="https://example.com"
          />
        );

      case 'email':
        return (
          <input
            type="email"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="w-full rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white placeholder-white/40"
            placeholder="example@company.com"
          />
        );

      default:
        return null;
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
        <h2 className="text-xl font-semibold text-white">コンテンツメタデータ管理</h2>
        <button
          onClick={() => setShowFieldModal(true)}
          className="px-4 py-2 rounded bg-brand text-white hover:bg-brand-dark transition-colors"
        >
          フィールド管理
        </button>
      </div>

      {/* メタデータフィールド */}
      <div className="rounded-lg bg-white/5 p-6 ring-1 ring-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">メタデータフィールド</h3>
        
        <div className="space-y-4">
          {metadataFields.map((field) => (
            <div key={field.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-white font-medium">
                  {field.label}
                  {field.required && <span className="text-red-400 ml-1">*</span>}
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingField(field);
                      setShowFieldModal(true);
                    }}
                    className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors text-sm"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDeleteField(field.id)}
                    className="px-2 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm"
                  >
                    削除
                  </button>
                </div>
              </div>
              
              {renderFieldInput(field)}
              
              {field.description && (
                <p className="text-white/50 text-sm">{field.description}</p>
              )}
              
              {field.validation?.message && (
                <p className="text-yellow-400 text-sm">{field.validation.message}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* タグ管理 */}
      <div className="rounded-lg bg-white/5 p-6 ring-1 ring-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">タグ管理</h3>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="新しいタグを入力"
              className="flex-1 rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white placeholder-white/40"
              onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
            />
            <button
              onClick={handleAddTag}
              className="px-4 py-2 rounded bg-brand text-white hover:bg-brand-dark transition-colors"
            >
              追加
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="flex items-center gap-2 px-3 py-1 rounded bg-brand/20 text-brand"
              >
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="text-brand hover:text-brand-dark"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* カテゴリ管理 */}
      <div className="rounded-lg bg-white/5 p-6 ring-1 ring-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">カテゴリ管理</h3>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="新しいカテゴリを入力"
              className="flex-1 rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white placeholder-white/40"
              onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
            />
            <button
              onClick={handleAddCategory}
              className="px-4 py-2 rounded bg-brand text-white hover:bg-brand-dark transition-colors"
            >
              追加
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {categories.map((category, index) => (
              <span
                key={index}
                className="flex items-center gap-2 px-3 py-1 rounded bg-green-500/20 text-green-400"
              >
                {category}
                <button
                  onClick={() => handleRemoveCategory(category)}
                  className="text-green-400 hover:text-green-300"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* フィールド管理モーダル */}
      {showFieldModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-800">
                {editingField ? 'フィールドを編集' : '新しいフィールドを作成'}
              </h2>
              <button
                onClick={() => {
                  setShowFieldModal(false);
                  setEditingField(null);
                  setNewField({ type: 'text', required: false });
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    フィールド名
                  </label>
                  <input
                    type="text"
                    value={editingField?.name || newField.name || ''}
                    onChange={(e) => {
                      if (editingField) {
                        setEditingField({...editingField, name: e.target.value});
                      } else {
                        setNewField({...newField, name: e.target.value});
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ラベル
                  </label>
                  <input
                    type="text"
                    value={editingField?.label || newField.label || ''}
                    onChange={(e) => {
                      if (editingField) {
                        setEditingField({...editingField, label: e.target.value});
                      } else {
                        setNewField({...newField, label: e.target.value});
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    タイプ
                  </label>
                  <select
                    value={editingField?.type || newField.type || 'text'}
                    onChange={(e) => {
                      if (editingField) {
                        setEditingField({...editingField, type: e.target.value as any});
                      } else {
                        setNewField({...newField, type: e.target.value as any});
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="text">テキスト</option>
                    <option value="number">数値</option>
                    <option value="date">日付</option>
                    <option value="boolean">真偽値</option>
                    <option value="select">選択</option>
                    <option value="multiselect">複数選択</option>
                    <option value="url">URL</option>
                    <option value="email">メール</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    説明
                  </label>
                  <textarea
                    value={editingField?.description || newField.description || ''}
                    onChange={(e) => {
                      if (editingField) {
                        setEditingField({...editingField, description: e.target.value});
                      } else {
                        setNewField({...newField, description: e.target.value});
                      }
                    }}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingField?.required || newField.required || false}
                    onChange={(e) => {
                      if (editingField) {
                        setEditingField({...editingField, required: e.target.checked});
                      } else {
                        setNewField({...newField, required: e.target.checked});
                      }
                    }}
                    className="w-4 h-4 text-brand rounded focus:ring-brand"
                  />
                  <label className="text-sm text-gray-700">必須フィールド</label>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={() => {
                  setShowFieldModal(false);
                  setEditingField(null);
                  setNewField({ type: 'text', required: false });
                }}
                className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleSaveField}
                className="px-4 py-2 bg-brand text-white rounded-md hover:bg-brand-dark transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


