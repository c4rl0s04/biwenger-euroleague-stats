'use client';

import { createElement } from 'react';

/**
 * ElegantCard - Minimal, clean card design
 * - Dark solid background
 * - Simple 1px border
 * - No gradients, no glow, no shadows
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
    orange: 'text-primary', // Use design system primary
    cyan: 'text-cyan-500',
    yellow: 'text-yellow-500',
    pink: 'text-pink-500',
    rose: 'text-rose-500',
  };

  const iconColor = iconColors[color] || iconColors.primary;

  if (loading) {
    return (
      <div
        className={`
          bg-card border border-border rounded-xl p-6 h-full 
          flex flex-col animate-pulse
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
        bg-card border border-border rounded-xl p-6 h-full 
        flex flex-col transition-colors duration-200
        hover:border-primary/30
        ${className}
      `}
    >
      {/* Header */}
      {(title || actionRight) && (
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-2.5">
            {icon &&
              createElement(icon, {
                className: `w-5 h-5 ${iconColor}`,
              })}
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
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
