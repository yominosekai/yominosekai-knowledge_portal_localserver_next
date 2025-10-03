'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// 動的インポートでHeaderを読み込み、キャッシュ問題を回避
const Header = dynamic(() => import('./Header'), {
  ssr: false,
  loading: () => (
    <header className="bg-gradient-to-r from-brand to-brand-dark text-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between gap-4 flex-wrap py-3">
          <div className="text-2xl font-bold">Knowledge Portal</div>
          <div className="text-white/70">読み込み中...</div>
        </div>
      </div>
    </header>
  ),
});

export default function ClientHeader() {
  return (
    <Suspense fallback={
      <header className="bg-gradient-to-r from-brand to-brand-dark text-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between gap-4 flex-wrap py-3">
            <div className="text-2xl font-bold">Knowledge Portal</div>
            <div className="text-white/70">読み込み中...</div>
          </div>
        </div>
      </header>
    }>
      <Header />
    </Suspense>
  );
}
