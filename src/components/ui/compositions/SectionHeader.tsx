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
  const [firstWord, ...remainingWords] = title.trim().split(/\s+/);

  return (
    <header
      className={cn('flex flex-wrap items-end justify-between gap-3 pb-2', className)}
      {...props}
    >
      <div className={level === 2 ? 'space-y-2' : 'space-y-1'}>
        <Heading
          id={headingId}
          className={cn(
            level === 2
              ? 'font-display! text-4xl leading-none tracking-[0.04em]! uppercase! text-[hsl(var(--content-primary))] sm:text-5xl'
              : 'font-sans! text-xl font-semibold tracking-tight! normal-case! text-[hsl(var(--content-primary))] sm:text-2xl'
          )}
        >
          {level === 2 ? (
            <>
              {remainingWords.length ? `${firstWord} ` : null}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'var(--effect-gradient-accent)' }}
              >
                {remainingWords.length ? remainingWords.join(' ') : firstWord}
              </span>
            </>
          ) : (
            title
          )}
        </Heading>
        {description ? (
          <p
            className={cn(
              'font-sans text-[hsl(var(--content-muted))]',
              level === 2 ? 'text-base leading-relaxed' : 'text-sm leading-relaxed'
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </header>
  );
}
