'use client';

import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => setTheme('light')}
        className={`p-2 rounded transition-colors ${
          theme === 'light' 
            ? 'bg-blue-500 text-white' 
            : resolvedTheme === 'light' 
              ? 'bg-white/20 text-white' 
              : 'bg-white/10 text-white/70 hover:bg-white/20'
        }`}
        title="ライトテーマ"
      >
        ☀️
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`p-2 rounded transition-colors ${
          theme === 'dark' 
            ? 'bg-blue-500 text-white' 
            : resolvedTheme === 'dark' 
              ? 'bg-white/20 text-white' 
              : 'bg-white/10 text-white/70 hover:bg-white/20'
        }`}
        title="ダークテーマ"
      >
        🌙
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`p-2 rounded transition-colors ${
          theme === 'system' 
            ? 'bg-blue-500 text-white' 
            : 'bg-white/10 text-white/70 hover:bg-white/20'
        }`}
        title="システム設定に従う"
      >
        💻
      </button>
    </div>
  );
}
