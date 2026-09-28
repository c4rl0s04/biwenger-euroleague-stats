import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface SectionHeaderProps extends HTMLAttributes<HTMLElement> {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function SectionHeader({
  title,
  description,
  action,
  className,
  ...props
}: SectionHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-wrap items-end justify-between gap-3 border-b border-[hsl(var(--border-default))] pb-4',
        className
      )}
      {...props}
    >
      <div className="space-y-1">
        <h2 className="font-sans! text-xl font-semibold tracking-tight! normal-case! text-[hsl(var(--content-primary))] sm:text-2xl">
          {title}
        </h2>
        {description ? (
          <p className="text-sm text-[hsl(var(--content-muted))]">{description}</p>
        ) : null}
      </div>
      {action}
    </header>
  );
}
