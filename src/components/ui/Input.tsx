import { cn } from '@/lib/cn';
import { InputHTMLAttributes } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: Props) {
  return (
    <input
      className={cn('rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 placeholder-white/40 w-full', className)}
      {...props}
    />
  );
}
