import { cn } from '@/lib/cn';
import { SelectHTMLAttributes } from 'react';

type Props = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, ...props }: Props) {
  return (
    <select
      className={cn('rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 w-full', className)}
      {...props}
    />
  );
}
