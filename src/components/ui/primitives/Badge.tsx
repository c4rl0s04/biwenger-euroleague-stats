import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant = 'neutral' | 'accent' | 'danger';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const badgeVariants: Record<BadgeVariant, string> = {
  neutral: 'bg-[hsl(var(--surface-secondary))] text-foreground border-border',
  accent:
    'bg-[hsl(var(--action-primary)/0.15)] text-[hsl(var(--action-primary))] border-[hsl(var(--action-primary)/0.3)]',
  danger:
    'bg-[hsl(var(--status-danger)/0.15)] text-[hsl(var(--status-danger))] border-[hsl(var(--status-danger)/0.3)]',
};

export function Badge({ variant = 'neutral', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 font-sans text-xs font-medium select-none',
        badgeVariants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
