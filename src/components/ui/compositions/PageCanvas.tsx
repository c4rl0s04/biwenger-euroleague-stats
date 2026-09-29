import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type PageCanvasProps = HTMLAttributes<HTMLDivElement>;

/** Shared page width and gutters. Keep page-specific spacing inside the canvas. */
export function PageCanvas({ children, className, ...props }: PageCanvasProps) {
  return (
    <div
      className={cn('w-full px-4 pb-12 pt-8 sm:px-6 sm:pt-12 lg:px-8 lg:pt-16', className)}
      data-page-canvas
      {...props}
    >
      <div className="mx-auto w-full max-w-7xl">{children}</div>
    </div>
  );
}
