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
  // Icon colors mapping to premium color tokens
  const iconColors = {
    primary: 'text-primary drop-shadow-[0_0_8px_rgba(250,80,1,0.3)]',
    emerald: 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]',
    indigo: 'text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.3)]',
    purple: 'text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.3)]',
    blue: 'text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.3)]',
    orange: 'text-primary drop-shadow-[0_0_8px_rgba(250,80,1,0.3)]',
    amber: 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]',
    cyan: 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]',
    yellow: 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.3)]',
    pink: 'text-pink-400 drop-shadow-[0_0_8px_rgba(244,114,182,0.3)]',
    rose: 'text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.3)]',
    green: 'text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.3)]',
    teal: 'text-teal-400 drop-shadow-[0_0_8px_rgba(45,212,191,0.3)]',
  };

  const iconColor = iconColors[color] || iconColors.primary;

  if (loading) {
    return (
      <div
        className={`
          stat-card backdrop-blur-md bg-white/5 border border-white/5
          p-6 h-full flex flex-col animate-pulse
          ${className}
        `}
        {...rest}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-5 h-5 rounded-lg bg-white/10"></div>
          <div className="h-4 bg-white/10 rounded-md w-24"></div>
        </div>
        <div className="space-y-4 flex-1">
          <div className="h-20 bg-white/5 rounded-xl"></div>
          <div className="h-10 bg-white/5 rounded-xl w-3/4"></div>
          <div className="flex-1 bg-white/5 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        stat-card backdrop-blur-lg border border-white/5
        p-6 h-full flex flex-col group/card
        transition-all duration-500 hover:scale-[1.01] hover:border-primary/20
        ${className}
      `}
      {...rest}
    >
      {/* Premium Gradient Glow Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-transparent to-primary/0 opacity-0 group-hover/card:opacity-10 transition-opacity duration-700 pointer-events-none" />

      {/* Header */}
      {(title || actionRight) && (
        <div className="flex items-start justify-between mb-6 relative z-10">
          <div className="flex items-center gap-3">
            {icon &&
              createElement(icon, {
                className: `w-4.5 h-4.5 transition-transform duration-500 group-hover/card:scale-110 ${iconColor}`,
              })}
            <span className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-widest flex items-center gap-2 group-hover/card:text-slate-300 transition-colors">
              {title}
              {info && (
                <div className="group/info relative cursor-help">
                  <Info size={14} className="text-slate-500 hover:text-primary transition-colors" />
                  {/* Premium Glass Tooltip */}
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-64 p-4 bg-slate-900/90 backdrop-blur-xl border border-white/10 text-slate-300 text-xs normal-case font-sans leading-relaxed rounded-2xl shadow-2xl opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all duration-300 z-50 text-center ring-1 ring-white/5">
                    {info}
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-slate-900/90"></div>
                  </div>
                </div>
              )}
            </span>
          </div>
          <div className="transition-transform duration-300 hover:scale-105 active:scale-95">
            {actionRight}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col relative z-10">{children}</div>
    </div>
  );
}
