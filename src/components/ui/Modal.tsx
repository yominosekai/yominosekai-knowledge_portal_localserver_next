"use client";
import { cn } from '@/lib/cn';
import { ReactNode, useEffect } from 'react';

export function Modal({ open, onClose, children, className }: { open: boolean; onClose: () => void; children: ReactNode; className?: string; }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className={cn('w-full max-w-2xl rounded-lg bg-neutral-900 ring-1 ring-white/10 p-4', className)}>
        {children}
      </div>
    </div>
  );
}
