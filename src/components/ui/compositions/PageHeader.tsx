import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface PageHeaderProps extends HTMLAttributes<HTMLElement> {
  title: string;
  description?: string;
}

export function PageHeader({ title, description, className, ...props }: PageHeaderProps) {
  const [firstWord, ...remainingWords] = title.trim().split(/\s+/);

  return (
    <header className={cn('space-y-7', className)} {...props}>
      <div className="flex min-w-0 gap-4 sm:gap-6">
        <span
          aria-hidden="true"
          className="mt-1 w-1.5 shrink-0 rounded-full sm:w-2"
          style={{ backgroundImage: 'var(--effect-gradient-accent)' }}
        />
        <div className="min-w-0 space-y-4">
          <h1 className="max-w-full font-display text-5xl leading-[0.9] tracking-tight text-[hsl(var(--content-primary))] sm:text-6xl lg:text-7xl">
            <span className="text-[hsl(var(--action-primary))]">{firstWord}</span>
            {remainingWords.length ? ` ${remainingWords.join(' ')}` : null}
          </h1>
          {description ? (
            <p className="max-w-3xl font-sans text-base leading-relaxed text-[hsl(var(--content-secondary))] lg:text-lg">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      <div
        aria-hidden="true"
        className="h-px w-full"
        style={{
          backgroundImage:
            'linear-gradient(90deg, hsl(var(--action-primary) / 0.7), hsl(var(--border-default)) 40%, transparent)',
        }}
      />
    </header>
  );
}
