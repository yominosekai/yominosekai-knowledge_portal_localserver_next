'use client';

import React, { useState, useEffect } from 'react';

interface BulkOperationsProps {
  items: any[];
  onSelectionChange: (selectedIds: string[]) => void;
  onBulkAction: (action: string, selectedIds: string[]) => void;
  className?: string;
}

interface BulkAction {
  id: string;
  label: string;
  icon: string;
  color: string;
  confirmMessage?: string;
}

export function BulkOperations({ 
  items, 
  onSelectionChange, 
  onBulkAction, 
  className = '' 
}: BulkOperationsProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const bulkActions: BulkAction[] = [
    {
      id: 'delete',
      label: '削除',
      icon: '🗑️',
      color: 'bg-red-500 hover:bg-red-600',
      confirmMessage: '選択したアイテムを削除しますか？'
    },
    {
      id: 'archive',
      label: 'アーカイブ',
      icon: '📦',
      color: 'bg-yellow-500 hover:bg-yellow-600'
    },
    {
      id: 'export',
      label: 'エクスポート',
      icon: '📤',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      id: 'tag',
      label: 'タグ追加',
      icon: '🏷️',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      id: 'move',
      label: '移動',
      icon: '📁',
      color: 'bg-purple-500 hover:bg-purple-600'
    }
  ];

  useEffect(() => {
    onSelectionChange(selectedItems);
    setShowActions(selectedItems.length > 0);
  }, [selectedItems, onSelectionChange]);

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
      setSelectAll(false);
    } else {
      const allIds = items.map(item => item.id);
      setSelectedItems(allIds);
      setSelectAll(true);
    }
  };

  const handleSelectItem = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };

  const handleBulkAction = async (action: BulkAction) => {
    if (selectedItems.length === 0) return;

    if (action.confirmMessage) {
      if (!confirm(action.confirmMessage)) return;
    }

    try {
      await onBulkAction(action.id, selectedItems);
      setSelectedItems([]);
      setSelectAll(false);
    } catch (error) {
      console.error('一括操作エラー:', error);
      alert('一括操作に失敗しました');
    }
  };

  const getSelectedCount = () => {
    return selectedItems.length;
  };

  const getTotalCount = () => {
    return items.length;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 選択コントロール */}
      <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg ring-1 ring-white/10">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectAll}
              onChange={handleSelectAll}
              className="w-4 h-4 text-brand rounded focus:ring-brand"
            />
            <span className="text-white/70 text-sm">
              {selectAll ? 'すべて選択解除' : 'すべて選択'}
            </span>
          </label>
          
          {selectedItems.length > 0 && (
            <span className="text-white text-sm">
              {getSelectedCount()} / {getTotalCount()} 件選択中
            </span>
          )}
        </div>

        {showActions && (
          <div className="flex items-center gap-2">
            <span className="text-white/70 text-sm">一括操作:</span>
            <div className="flex gap-1">
              {bulkActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleBulkAction(action)}
                  className={`px-3 py-1 rounded text-white text-sm transition-colors ${action.color}`}
                  title={action.label}
                >
                  <span className="mr-1">{action.icon}</span>
                  {action.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setSelectedItems([]);
                setSelectAll(false);
              }}
              className="px-3 py-1 rounded bg-gray-500 text-white text-sm hover:bg-gray-600 transition-colors"
            >
              キャンセル
            </button>
          </div>
        )}
      </div>

      {/* アイテム一覧 */}
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
              selectedItems.includes(item.id)
                ? 'bg-brand/20 ring-1 ring-brand'
                : 'bg-white/5 ring-1 ring-white/10 hover:ring-white/20'
            }`}
          >
            <input
              type="checkbox"
              checked={selectedItems.includes(item.id)}
              onChange={() => handleSelectItem(item.id)}
              className="w-4 h-4 text-brand rounded focus:ring-brand"
            />
            
            <div className="flex-1">
              <h4 className="text-white font-medium">{item.title || item.name}</h4>
              {item.description && (
                <p className="text-white/70 text-sm mt-1">{item.description}</p>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {item.status && (
                <span className={`px-2 py-1 rounded text-xs ${
                  item.status === 'active' ? 'bg-green-500/20 text-green-400' :
                  item.status === 'inactive' ? 'bg-gray-500/20 text-gray-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {item.status}
                </span>
              )}
              
              {item.createdAt && (
                <span className="text-white/50 text-xs">
                  {new Date(item.createdAt).toLocaleDateString('ja-JP')}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 選択されたアイテムの詳細表示 */}
      {selectedItems.length > 0 && (
        <div className="rounded-lg bg-brand/10 p-4 ring-1 ring-brand/20">
          <h3 className="text-white font-semibold mb-2">選択されたアイテム</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {selectedItems.map((itemId) => {
              const item = items.find(i => i.id === itemId);
              return item ? (
                <div key={itemId} className="flex items-center gap-2 p-2 bg-white/5 rounded">
                  <span className="text-brand">✓</span>
                  <span className="text-white text-sm truncate">{item.title || item.name}</span>
                </div>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* 一括操作のヒント */}
      {selectedItems.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📋</div>
          <p className="text-white/70">アイテムを選択して一括操作を実行できます</p>
        </div>
      )}
    </div>
  );
}



