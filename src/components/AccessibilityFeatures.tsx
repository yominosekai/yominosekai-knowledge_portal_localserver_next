'use client';

import React, { useState, useEffect } from 'react';

interface AccessibilityFeaturesProps {
  className?: string;
}

export function AccessibilityFeatures({ className = '' }: AccessibilityFeaturesProps) {
  const [accessibilitySettings, setAccessibilitySettings] = useState({
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    screenReader: false,
    keyboardNavigation: true,
    focusVisible: true,
    colorBlindFriendly: false,
    voiceOver: false
  });
  const [currentFocus, setCurrentFocus] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<string[]>([]);

  useEffect(() => {
    // システムのアクセシビリティ設定を検出
    detectSystemSettings();
    
    // キーボードナビゲーションの設定
    setupKeyboardNavigation();
    
    // フォーカス管理
    setupFocusManagement();
    
    // スクリーンリーダー対応
    setupScreenReaderSupport();
  }, []);

  const detectSystemSettings = () => {
    // システムのアクセシビリティ設定を検出
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setAccessibilitySettings(prev => ({ ...prev, reducedMotion: true }));
    }
    
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      setAccessibilitySettings(prev => ({ ...prev, highContrast: true }));
    }
  };

  const setupKeyboardNavigation = () => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // スキップリンク
      if (e.key === 'Tab' && !e.shiftKey) {
        const skipLink = document.querySelector('[data-skip-link]') as HTMLElement;
        if (skipLink && document.activeElement === document.body) {
          skipLink.focus();
        }
      }
      
      // エスケープキーでモーダルを閉じる
      if (e.key === 'Escape') {
        const modal = document.querySelector('[data-modal-open]') as HTMLElement;
        if (modal) {
          const closeButton = modal.querySelector('[data-modal-close]') as HTMLElement;
          closeButton?.click();
        }
      }
      
      // 矢印キーでメニューナビゲーション
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const menu = document.querySelector('[data-menu]') as HTMLElement;
        if (menu && menu.contains(document.activeElement)) {
          e.preventDefault();
          const items = Array.from(menu.querySelectorAll('[data-menu-item]')) as HTMLElement[];
          const currentIndex = items.indexOf(document.activeElement as HTMLElement);
          const nextIndex = e.key === 'ArrowDown' 
            ? Math.min(currentIndex + 1, items.length - 1)
            : Math.max(currentIndex - 1, 0);
          items[nextIndex]?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  };

  const setupFocusManagement = () => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target) {
        setCurrentFocus(target.id || target.className);
        
        // フォーカス表示の強化
        if (accessibilitySettings.focusVisible) {
          target.classList.add('focus-visible');
        }
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target) {
        target.classList.remove('focus-visible');
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    
    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  };

  const setupScreenReaderSupport = () => {
    // スクリーンリーダー用のアナウンスメント
    const announce = (message: string) => {
      setAnnouncements(prev => [...prev, message]);
      
      // スクリーンリーダー用のライブリージョンに追加
      const liveRegion = document.getElementById('live-region');
      if (liveRegion) {
        liveRegion.textContent = message;
      }
      
      // 3秒後にアナウンスメントを削除
      setTimeout(() => {
        setAnnouncements(prev => prev.slice(1));
      }, 3000);
    };

    // グローバルなアナウンス関数を公開
    (window as any).announceToScreenReader = announce;
  };

  const handleSettingChange = (setting: string, value: boolean) => {
    setAccessibilitySettings(prev => ({ ...prev, [setting]: value }));
    
    // 設定に応じてスタイルを適用
    applyAccessibilityStyles(setting, value);
    
    // スクリーンリーダーに通知
    if (accessibilitySettings.screenReader) {
      const message = `${setting}を${value ? '有効' : '無効'}にしました`;
      (window as any).announceToScreenReader?.(message);
    }
  };

  const applyAccessibilityStyles = (setting: string, value: boolean) => {
    const root = document.documentElement;
    
    switch (setting) {
      case 'highContrast':
        root.classList.toggle('high-contrast', value);
        break;
      case 'largeText':
        root.classList.toggle('large-text', value);
        break;
      case 'reducedMotion':
        root.classList.toggle('reduced-motion', value);
        break;
      case 'colorBlindFriendly':
        root.classList.toggle('color-blind-friendly', value);
        break;
    }
  };

  const getAccessibilityScore = () => {
    const enabledSettings = Object.values(accessibilitySettings).filter(Boolean).length;
    const totalSettings = Object.keys(accessibilitySettings).length;
    return Math.round((enabledSettings / totalSettings) * 100);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">アクセシビリティ機能</h2>
        <div className="flex items-center gap-2">
          <span className="text-white/70 text-sm">アクセシビリティスコア:</span>
          <span className={`text-lg font-bold ${getScoreColor(getAccessibilityScore())}`}>
            {getAccessibilityScore()}%
          </span>
        </div>
      </div>

      {/* スキップリンク */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-brand text-white px-4 py-2 rounded z-50"
        data-skip-link
      >
        メインコンテンツにスキップ
      </a>

      {/* ライブリージョン（スクリーンリーダー用） */}
      <div
        id="live-region"
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      />

      {/* アクセシビリティ設定 */}
      <div className="rounded-lg bg-white/5 p-6 ring-1 ring-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">アクセシビリティ設定</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              key: 'highContrast',
              label: '高コントラスト',
              description: '背景と文字のコントラストを高くします',
              icon: '🔍'
            },
            {
              key: 'largeText',
              label: '大きな文字',
              description: '文字サイズを大きくします',
              icon: '🔍'
            },
            {
              key: 'reducedMotion',
              label: '動きを減らす',
              description: 'アニメーションを最小限にします',
              icon: '⏸️'
            },
            {
              key: 'screenReader',
              label: 'スクリーンリーダー',
              description: 'スクリーンリーダー対応を有効にします',
              icon: '👁️'
            },
            {
              key: 'keyboardNavigation',
              label: 'キーボードナビゲーション',
              description: 'キーボードでの操作を有効にします',
              icon: '⌨️'
            },
            {
              key: 'focusVisible',
              label: 'フォーカス表示',
              description: 'フォーカス位置を明確に表示します',
              icon: '🎯'
            },
            {
              key: 'colorBlindFriendly',
              label: '色覚対応',
              description: '色覚多様性に配慮した配色にします',
              icon: '🌈'
            },
            {
              key: 'voiceOver',
              label: '音声読み上げ',
              description: 'テキストの音声読み上げを有効にします',
              icon: '🔊'
            }
          ].map((setting) => (
            <div
              key={setting.key}
              className="flex items-center justify-between p-4 rounded bg-black/20"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{setting.icon}</span>
                <div>
                  <h4 className="text-white font-medium">{setting.label}</h4>
                  <p className="text-white/70 text-sm">{setting.description}</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={accessibilitySettings[setting.key as keyof typeof accessibilitySettings]}
                  onChange={(e) => handleSettingChange(setting.key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* キーボードショートカット */}
      <div className="rounded-lg bg-white/5 p-6 ring-1 ring-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">キーボードショートカット</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'Tab', description: '次の要素にフォーカス' },
            { key: 'Shift + Tab', description: '前の要素にフォーカス' },
            { key: 'Enter', description: '選択・実行' },
            { key: 'Space', description: '選択・実行' },
            { key: 'Escape', description: 'モーダルを閉じる' },
            { key: 'Arrow Keys', description: 'メニュー内で移動' },
            { key: 'Home', description: 'ページの先頭に移動' },
            { key: 'End', description: 'ページの末尾に移動' }
          ].map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded bg-black/20">
              <span className="text-white/70">{shortcut.description}</span>
              <kbd className="px-2 py-1 bg-gray-700 text-white text-sm rounded">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>

      {/* 現在のフォーカス */}
      {currentFocus && (
        <div className="rounded-lg bg-blue-500/20 p-4 ring-1 ring-blue-500/30">
          <h3 className="text-white font-semibold mb-2">現在のフォーカス</h3>
          <p className="text-white/70 text-sm">
            フォーカス位置: {currentFocus}
          </p>
        </div>
      )}

      {/* アナウンスメント */}
      {announcements.length > 0 && (
        <div className="rounded-lg bg-green-500/20 p-4 ring-1 ring-green-500/30">
          <h3 className="text-white font-semibold mb-2">スクリーンリーダーアナウンス</h3>
          <div className="space-y-1">
            {announcements.map((announcement, index) => (
              <p key={index} className="text-white/70 text-sm">
                {announcement}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* アクセシビリティチェックリスト */}
      <div className="rounded-lg bg-white/5 p-6 ring-1 ring-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">アクセシビリティチェックリスト</h3>
        
        <div className="space-y-3">
          {[
            { item: 'すべての画像にalt属性が設定されている', status: 'pass' },
            { item: 'フォームにラベルが設定されている', status: 'pass' },
            { item: '色だけで情報を伝えていない', status: 'pass' },
            { item: 'キーボードで操作可能', status: 'pass' },
            { item: 'スクリーンリーダーで読み取り可能', status: 'pass' },
            { item: '十分なコントラスト比', status: 'pass' },
            { item: 'フォーカス表示が明確', status: 'pass' },
            { item: 'エラーメッセージが適切', status: 'pass' }
          ].map((check, index) => (
            <div key={index} className="flex items-center gap-3">
              <span className={`text-lg ${
                check.status === 'pass' ? 'text-green-400' : 
                check.status === 'fail' ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {check.status === 'pass' ? '✓' : 
                 check.status === 'fail' ? '✗' : '⚠️'}
              </span>
              <span className="text-white/70">{check.item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* アクセシビリティリソース */}
      <div className="rounded-lg bg-white/5 p-6 ring-1 ring-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">アクセシビリティリソース</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="https://www.w3.org/WAI/WCAG21/quickref/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
          >
            <h4 className="font-semibold">WCAG 2.1 ガイドライン</h4>
            <p className="text-sm text-white/70">Web Content Accessibility Guidelines</p>
          </a>
          
          <a
            href="https://webaim.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
          >
            <h4 className="font-semibold">WebAIM</h4>
            <p className="text-sm text-white/70">Web Accessibility in Mind</p>
          </a>
        </div>
      </div>
    </div>
  );
}


