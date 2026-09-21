import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export type SurfaceVariant = 'default' | 'raised' | 'subtle';

export type SurfaceProps = HTMLAttributes<HTMLDivElement> & {
  variant?: SurfaceVariant;
  /** Visual treatment only; consumers supply semantic links or buttons. */
  interactive?: boolean;
};

const surfaces: Record<SurfaceVariant, string> = {
  // Avoid the legacy global .bg-card rule, which overrides borders and transitions.
  default: 'bg-[hsl(var(--surface-card))]',
  raised: 'bg-popover',
  subtle: 'bg-secondary',
};

/** A padding-free visual container, compatible with Server and Client Components. */
export function Surface({
  variant = 'default',
  interactive = false,
  className,
  ...props
}: SurfaceProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-surface)] border border-border text-foreground',
        surfaces[variant],
        // Override the unlayered legacy universal border-color rule only for interaction.
        interactive &&
          'transition-colors hover:border-primary/40! focus-within:border-ring! motion-reduce:transition-none',
        className
      )}
      {...props}
    />
  );
}
