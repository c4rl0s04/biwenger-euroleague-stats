import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { PageContainer } from './PageContainer';

export type PageCanvasProps = HTMLAttributes<HTMLDivElement>;

/** Open page content, including the page title. Section bands are siblings of this canvas. */
export function PageCanvas({ children, className, ...props }: PageCanvasProps) {
  return (
    <div
      className={cn('w-full pb-12 pt-8 sm:pt-12 lg:pt-16', className)}
      data-page-canvas
      {...props}
    >
      <PageContainer>{children}</PageContainer>
    </div>
  );
}
