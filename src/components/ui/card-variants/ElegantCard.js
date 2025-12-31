'use client';

import { createElement } from 'react';

/**
 * ElegantCard - Minimal, clean card design
 * - Dark solid background
 * - Left border accent in primary color
 * - Simple border on other sides
 * - Subtle border color change on hover
 */
export default function ElegantCard({
  children,
  title,
  icon,
  color = 'primary',
  loading = false,
  className = '',
  actionRight = null,
}) {
  // Icon colors based on semantic color prop
  const iconColors = {
    primary: 'text-primary',
    emerald: 'text-emerald-500',
    indigo: 'text-indigo-500',
    purple: 'text-purple-500',
    blue: 'text-blue-500',
    orange: 'text-primary',
    cyan: 'text-cyan-500',
    yellow: 'text-yellow-500',
    pink: 'text-pink-500',
    rose: 'text-rose-500',
    green: 'text-green-500',
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
    >
      {/* Header */}
      {(title || actionRight) && (
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-2.5">
            {icon &&
              createElement(icon, {
                className: `w-4 h-4 ${iconColor}`,
              })}
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              {title}
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
