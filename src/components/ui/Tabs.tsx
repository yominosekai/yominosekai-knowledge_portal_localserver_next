"use client";
import { cn } from '@/lib/cn';
import { useState } from 'react';

type Tab = { id: string; label: string };

export function Tabs({ tabs, initial, onChange }: { tabs: Tab[]; initial?: string; onChange?: (id: string) => void }) {
  const [active, setActive] = useState(initial ?? tabs[0]?.id);
  return (
    <div>
      <div className="flex gap-2 border-b border-white/10 mb-4">
        {tabs.map(t => (
          <button
            key={t.id}
            className={cn('px-4 py-2 -mb-px border-b-2', active === t.id ? 'border-brand text-brand' : 'border-transparent text-white/70 hover:text-white')}
            onClick={() => { setActive(t.id); onChange?.(t.id); }}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
