'use client';

import { cn } from '@/lib/utils';

// Helper for card base style
export function StatCardBase({ children, className, onClick }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-5 shadow-sm h-full flex flex-col justify-between transition-all duration-300 relative overflow-hidden group',
        onClick && 'cursor-pointer hover:border-primary/30 hover:shadow-md hover:bg-card/80',
        className
      )}
    >
      {children}
    </div>
  );
}
