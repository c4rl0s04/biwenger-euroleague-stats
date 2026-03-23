'use client';

import { createElement } from 'react';
import { InfoTooltip } from '@/components/ui/Tooltip';

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
  bgColor = null, // New prop for background tinting
  loading = false,
  className = '',
  actionRight = null,
  info = null,
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
    zinc: 'text-zinc-400 drop-shadow-[0_0_8px_rgba(161,161,170,0.3)]',
    red: 'text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.3)]',
    lime: 'text-lime-400 drop-shadow-[0_0_8px_rgba(163,230,53,0.3)]',
    fuchsia: 'text-fuchsia-400 drop-shadow-[0_0_8px_rgba(232,121,249,0.3)]',
  };

  // Background tint mappings (subtle gradient overlays)
  const bgTints = {
    primary: 'from-primary/10 to-primary/5',
    emerald: 'from-emerald-500/10 to-emerald-900/5',
    indigo: 'from-indigo-500/10 to-indigo-900/5',
    purple: 'from-purple-500/10 to-purple-900/5',
    blue: 'from-blue-500/10 to-blue-900/5',
    orange: 'from-orange-500/10 to-orange-900/5',
    amber: 'from-amber-500/10 to-amber-900/5',
    cyan: 'from-cyan-500/10 to-cyan-900/5',
    yellow: 'from-yellow-500/10 to-yellow-900/5',
    pink: 'from-pink-500/10 to-pink-900/5',
    rose: 'from-rose-500/10 to-rose-900/5',
    green: 'from-green-500/10 to-green-900/5',
    teal: 'from-teal-500/10 to-teal-900/5',
    zinc: 'from-zinc-500/10 to-zinc-900/5',
    red: 'from-red-500/10 to-red-900/5',
    lime: 'from-lime-500/10 to-lime-900/5',
    fuchsia: 'from-fuchsia-500/10 to-fuchsia-900/5',
  };

  const iconColor = iconColors[color] || iconColors.primary;
  const bgTint = bgColor ? bgTints[bgColor] || bgTints.primary : '';

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
        p-6 h-full flex flex-col group/card relative overflow-hidden
        transition-all duration-500 hover:scale-[1.01] hover:border-white/10
        ${className}
      `}
      {...rest}
    >
      {/* Premium Gradient Glow Overlay */}
      {bgColor ? (
        <div
          className={`absolute inset-0 bg-gradient-to-br ${bgTint} opacity-70 transition-opacity duration-700 pointer-events-none`}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-transparent to-primary/0 opacity-0 group-hover/card:opacity-10 transition-opacity duration-700 pointer-events-none" />
      )}

      {/* Header */}
      {(title || actionRight) && (
        <div className="flex items-start justify-between mb-6 relative z-10">
          <div className="flex items-center gap-3">
            {icon &&
              createElement(icon, {
                className: `w-4.5 h-4.5 transition-transform duration-500 group-hover/card:scale-110 ${iconColor}`,
              })}
            <span className="text-[14px] font-black font-sans text-slate-300 uppercase tracking-widest flex items-center gap-2 group-hover/card:text-white transition-colors">
              {title}
              {info && <InfoTooltip content={info} />}
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
