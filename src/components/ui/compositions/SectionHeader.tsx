import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface SectionHeaderProps extends HTMLAttributes<HTMLElement> {
  title: string;
  description?: string;
  action?: ReactNode;
  headingId?: string;
  level?: 2 | 3;
}

export function SectionHeader({
  title,
  description,
  action,
  headingId,
  level = 2,
  className,
  ...props
}: SectionHeaderProps) {
  const Heading = level === 2 ? 'h2' : 'h3';

  return (
    <header
      className={cn(
        'flex flex-wrap items-end justify-between gap-3',
        level === 2 ? 'border-b border-[hsl(var(--border-default))] pb-4' : 'pb-2',
        className
      )}
      {...props}
    >
      <div className="space-y-1">
        <Heading
          id={headingId}
          className={cn(
            'font-sans! font-semibold tracking-tight! normal-case! text-[hsl(var(--content-primary))]',
            level === 2 ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'
          )}
        >
          {title}
        </Heading>
        {description ? (
          <p className="text-sm text-[hsl(var(--content-muted))]">{description}</p>
        ) : null}
      </div>
      {action}
    </header>
  );
}
