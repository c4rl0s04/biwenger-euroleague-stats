import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/** Neutral empty-result copy; the caller owns the message and surrounding surface. */
export function EmptyState({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('text-center text-[hsl(var(--content-muted))] text-sm', className)}
      {...props}
    />
  );
}
