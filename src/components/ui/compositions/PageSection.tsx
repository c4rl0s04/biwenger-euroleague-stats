import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { PageContainer } from './PageContainer';

export type PageSectionTone = 'base' | 'alternate';
export type PageSectionProps = HTMLAttributes<HTMLElement> & {
  tone?: PageSectionTone;
  /** Align full-width bands with the padded MobileScreen composition. */
  inset?: 'responsive' | 'phone';
};

/** Full-width page band. Its children decide heading and card layout. */
export function PageSection({
  children,
  tone = 'base',
  inset = 'responsive',
  className,
  ...props
}: PageSectionProps) {
  return (
    <section
      className={cn(
        'min-w-0 scroll-mt-24 py-8 sm:py-10 lg:py-12',
        tone === 'alternate' && 'bg-[hsl(var(--surface-section-alternate))]',
        inset === 'phone' && '-mx-[var(--mobile-gutter,1rem)]',
        className
      )}
      {...props}
    >
      <PageContainer inset={inset}>{children}</PageContainer>
    </section>
  );
}
