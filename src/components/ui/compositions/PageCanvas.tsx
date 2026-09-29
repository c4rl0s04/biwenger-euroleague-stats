import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type PageCanvasProps = HTMLAttributes<HTMLDivElement>;

/** Shared page width and gutters. Keep page-specific spacing inside the canvas. */
export function PageCanvas({ children, className, ...props }: PageCanvasProps) {
  return (
    <div className={cn('app-page-canvas', className)} {...props}>
      <div className="app-page-canvas__inner">{children}</div>
    </div>
  );
}
