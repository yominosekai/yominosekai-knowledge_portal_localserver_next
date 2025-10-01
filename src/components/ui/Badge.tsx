import { cn } from '@/lib/cn';

type Props = React.HTMLAttributes<HTMLSpanElement> & {
  intent?: 'info' | 'success' | 'warning' | 'danger';
};

export function Badge({ className, intent = 'info', ...props }: Props) {
  const intents: Record<NonNullable<Props['intent']>, string> = {
    info: 'bg-sky-500/20 text-sky-300 ring-1 ring-sky-400/40',
    success: 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/40',
    warning: 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/40',
    danger: 'bg-rose-500/20 text-rose-300 ring-1 ring-rose-400/40',
  };
  return (
    <span className={cn('inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs', intents[intent], className)} {...props} />
  );
}
