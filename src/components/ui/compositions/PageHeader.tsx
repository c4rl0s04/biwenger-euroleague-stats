import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface PageHeaderProps extends HTMLAttributes<HTMLElement> {
  title: string;
  description?: string;
  context?: ReactNode;
}

export function PageHeader({ title, description, context, className, ...props }: PageHeaderProps) {
  return (
    <header className={cn('space-y-5', className)} {...props}>
      {context ? (
        <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-[hsl(var(--action-primary))]">
          <span aria-hidden="true" className="h-px w-6 bg-[hsl(var(--action-primary))]" />
          {context}
        </div>
      ) : null}
      <div className="space-y-3">
        <h1
          className="w-fit max-w-full bg-clip-text font-display text-4xl leading-none tracking-tight text-transparent sm:text-5xl lg:text-6xl"
          style={{
            backgroundImage:
              'linear-gradient(100deg, hsl(var(--action-primary)), hsl(var(--content-primary)) 65%)',
          }}
        >
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl font-sans text-base leading-relaxed text-[hsl(var(--content-secondary))]">
            {description}
          </p>
        ) : null}
      </div>
      <div
        aria-hidden="true"
        className="h-px w-full"
        style={{
          backgroundImage:
            'linear-gradient(90deg, hsl(var(--action-primary) / 0.6), hsl(var(--border-default) / 0.6) 45%, transparent)',
        }}
      />
    </header>
  );
}
