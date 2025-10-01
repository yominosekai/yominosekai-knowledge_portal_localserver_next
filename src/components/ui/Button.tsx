import { cn } from '@/lib/cn';
import { ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
};

export function Button({ className, variant = 'primary', size = 'md', ...props }: Props) {
  const base = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50 disabled:pointer-events-none';
  const variants: Record<NonNullable<Props['variant']>, string> = {
    primary: 'bg-brand hover:bg-brand-dark text-white',
    secondary: 'bg-white/10 hover:bg-white/20 text-white',
    ghost: 'bg-transparent hover:bg-white/10 text-white',
    success: 'bg-emerald-500 hover:bg-emerald-600 text-white',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white',
  };
  const sizes: Record<NonNullable<Props['size']>, string> = {
    sm: 'px-2.5 py-1.5 text-sm',
    md: 'px-3.5 py-2 text-sm',
    lg: 'px-4.5 py-2.5 text-base',
  };
  return <button className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}
