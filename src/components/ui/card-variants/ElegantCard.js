'use client';

import { createElement } from 'react';
import { Info } from 'lucide-react';

/**
 * ElegantCard - Minimal, clean card design
 * - Dark solid background
 * - Left border accent in primary color
 * - Simple border on other sides
 * - Subtle border color change on hover
 * - Added `info` prop for tooltips
 */
export default function ElegantCard({
  children,
  title,
  icon,
  color = 'primary',
  loading = false,
  className = '',
  actionRight = null,
  info = null, // New prop for explanation text
  ...rest
}) {
  // Icon colors based on semantic color prop
  const iconColors = {
    primary: 'text-primary',
    emerald: 'text-emerald-500',
    indigo: 'text-indigo-500',
    purple: 'text-purple-500',
    blue: 'text-blue-500',
    orange: 'text-primary',
    amber: 'text-amber-500',
    cyan: 'text-cyan-500',
    yellow: 'text-yellow-500',
    pink: 'text-pink-500',
    rose: 'text-rose-500',
    green: 'text-green-500',
    teal: 'text-teal-500',
  };

  const iconColor = iconColors[color] || iconColors.primary;

  if (loading) {
    return (
      <div
        className={`
          bg-card border border-border 
          rounded-lg p-6 h-full flex flex-col animate-pulse
          ${className}
        `}
        {...rest}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-5 h-5 rounded bg-muted"></div>
          <div className="h-4 bg-muted rounded w-24"></div>
        </div>
        <div className="space-y-3 flex-1">
          <div className="h-16 bg-muted/50 rounded-lg"></div>
          <div className="h-12 bg-muted/50 rounded-lg"></div>
          <div className="flex-1 bg-muted/50 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        bg-card border border-border 
        rounded-lg p-6 h-full flex flex-col 
        transition-all duration-200
        ${className}
      `}
      {...rest}
    >
      {/* Header */}
      {(title || actionRight) && (
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-2.5">
            {icon &&
              createElement(icon, {
                className: `w-4 h-4 ${iconColor}`,
              })}
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              {title}
              {info && (
                <div className="group/info relative cursor-help">
                  <Info size={14} className="text-zinc-600 hover:text-zinc-400 transition-colors" />
                  {/* Tooltip */}
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs normal-case leading-relaxed rounded shadow-xl opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all z-10 pointer-events-none text-center">
                    {info}
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-800/50"></div>
                  </div>
                </div>
              )}
            </span>
          </div>
          {actionRight}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}
