import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface PageHeaderProps extends HTMLAttributes<HTMLElement> {
  title: string;
  description?: string;
  context?: ReactNode;
}

export function PageHeader({ title, description, context, className, ...props }: PageHeaderProps) {
  return (
    <header className={cn('space-y-4', className)} {...props}>
      {context ? (
        <div className="text-sm font-medium text-[hsl(var(--content-muted))]">{context}</div>
      ) : null}
      <div className="space-y-3">
        <h1 className="font-display text-4xl leading-none tracking-tight text-[hsl(var(--content-primary))] sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl font-sans text-base leading-relaxed text-[hsl(var(--content-secondary))]">
            {description}
          </p>
        ) : null}
      </div>
    </header>
  );
}
