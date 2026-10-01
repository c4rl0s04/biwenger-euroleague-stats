import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface PageHeaderProps extends HTMLAttributes<HTMLElement> {
  title: string;
  description?: string;
}

export function PageHeader({ title, description, className, ...props }: PageHeaderProps) {
  const [firstWord, ...remainingWords] = title.trim().split(/\s+/);

  return (
    <header className={cn('space-y-4', className)} {...props}>
      <h1 className="max-w-full font-display text-5xl leading-[0.95] tracking-[0.04em] uppercase text-[hsl(var(--content-primary))] sm:text-6xl lg:text-7xl">
        <span>{firstWord}</span>
        {remainingWords.length ? (
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: 'var(--effect-gradient-accent)' }}
          >
            {` ${remainingWords.join(' ')}`}
          </span>
        ) : null}
      </h1>
      {description ? (
        <p className="max-w-3xl font-sans text-base leading-relaxed text-[hsl(var(--content-secondary))] lg:text-lg">
          {description}
        </p>
      ) : null}
    </header>
  );
}
