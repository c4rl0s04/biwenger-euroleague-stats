import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type PageContainerProps = HTMLAttributes<HTMLDivElement> & {
  inset?: 'responsive' | 'phone';
};

/** Keeps the content width and gutters aligned across canvases and full-width sections. */
export function PageContainer({
  children,
  inset = 'responsive',
  className,
  ...props
}: PageContainerProps) {
  return (
    <div
      className={cn(
        'w-full',
        inset === 'phone'
          ? 'px-[var(--mobile-gutter,1rem)]'
          : 'px-[var(--mobile-gutter,1rem)] sm:px-6 lg:px-8',
        className
      )}
      {...props}
    >
      <div className="mx-auto w-full max-w-7xl">{children}</div>
    </div>
  );
}
