'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { NotificationCenter } from './NotificationCenter';
import { ConnectionStatus } from './ConnectionStatus';
import { RealTimeNotifications } from './RealTimeNotifications';
import { ThemeToggle } from './ThemeToggle';

const navItems = [
  { href: '/', label: 'ダッシュボード' },
  { href: '/content', label: 'コンテンツ' },
  { href: '/progress', label: '進捗' },
  { href: '/leaderboard', label: 'リーダーボード' },
  { href: '/learning-tasks', label: '学習課題' },
  { href: '/assignments', label: 'アサインメント' },
  { href: '/admin', label: '管理', adminOnly: true },
  { href: '/profile', label: 'プロフィール' },
];

export function Header() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  if (!isAuthenticated) {
    return (
      <header className="bg-gradient-to-r from-brand to-brand-dark text-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between gap-4 flex-wrap py-3">
            <div className="text-2xl font-bold">Knowledge Portal</div>
            <Link
              href="/login"
              className="px-4 py-2 rounded bg-white/20 hover:bg-white/30 transition-colors"
            >
              ログイン
            </Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-gradient-to-r from-brand to-brand-dark text-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between gap-4 flex-wrap py-3">
          <Link href="/" className="text-2xl font-bold">
            Knowledge Portal
          </Link>
          
          <nav className="hidden md:flex flex-wrap items-center gap-2">
            {navItems.map((item) => {
              if (item.adminOnly && user?.role !== 'admin') return null;
              
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    `px-3 py-2 rounded transition-colors ${
                      active ? 'bg-white/20' : 'hover:bg-white/10'
                    }`
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* 接続状態表示 */}
          <ConnectionStatus className="hidden md:flex" />

          {/* テーマ切り替え */}
          <ThemeToggle />

                 {/* 通知センター */}
                 <NotificationCenter />
                 
                 {/* リアルタイム通知 */}
                 {user && (
                   <RealTimeNotifications 
                     userId={user.sid}
                   />
                 )}

          {/* ユーザーメニュー */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                {user?.display_name?.charAt(0) || 'U'}
              </div>
              <span className="hidden md:block">{user?.display_name}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-lg bg-black/80 backdrop-blur-sm ring-1 ring-white/10 py-2 z-50">
                <div className="px-4 py-2 border-b border-white/10">
                  <p className="text-sm font-medium text-white">{user?.display_name}</p>
                  <p className="text-xs text-white/50">{user?.email}</p>
                  <p className="text-xs text-white/50">{user?.department}</p>
                </div>
                <Link
                  href="/profile"
                  className="block px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  プロフィール
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                >
                  ログアウト
                </button>
              </div>
            )}
          </div>

          {/* モバイルメニューボタン */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-white/80 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* モバイルメニュー */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-white/10 pt-4">
            <nav className="flex flex-col space-y-2">
              {navItems.map((item) => {
                if (item.adminOnly && user?.role !== 'admin') return null;
                
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`py-2 transition-colors ${
                      active ? 'text-white' : 'text-white/70 hover:text-white'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="text-left text-white/70 hover:text-white transition-colors py-2"
              >
                ログアウト
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
