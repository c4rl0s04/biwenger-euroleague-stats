'use client';

/**
 * Loading Skeleton Component
 * Displays animated placeholder lines while content is loading
 * 
 * @param {number} lines - Number of skeleton lines to display (default: 3)
 * @param {string} className - Additional CSS classes
 * @param {'sm' | 'md' | 'lg'} size - Size variant for line heights
 */
export default function LoadingSkeleton({ lines = 3, className = '', size = 'md' }) {
  const sizeClasses = {
    sm: 'h-3',
    md: 'h-4', 
    lg: 'h-6'
  };

  const heightClass = sizeClasses[size] || sizeClasses.md;

  // Generate varying widths for more natural look
  const widths = ['w-full', 'w-11/12', 'w-4/5', 'w-3/4', 'w-2/3'];

  return (
    <div className={`animate-pulse space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i} 
          className={`${heightClass} ${widths[i % widths.length]} bg-slate-700/50 rounded`} 
        />
      ))}
    </div>
  );
}

/**
 * Card Loading Skeleton
 * Pre-built skeleton for common card loading state
 */
export function CardSkeleton({ className = '' }) {
  return (
    <div className={`p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 ${className}`}>
      <div className="animate-pulse">
        <div className="h-5 w-1/3 bg-slate-700/50 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-4 w-full bg-slate-700/50 rounded" />
          <div className="h-4 w-4/5 bg-slate-700/50 rounded" />
          <div className="h-4 w-2/3 bg-slate-700/50 rounded" />
        </div>
      </div>
    </div>
  );
}
