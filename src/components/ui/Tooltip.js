'use client';

import React from 'react';
import { Info } from 'lucide-react';

/**
 * Base wrapper for tooltips with the "Premium Glass" aesthetic.
 */
export const GlassTooltip = ({
  children,
  className = '',
  showTriangle = false,
  trianglePosition = 'bottom',
}) => {
  return (
    <div
      className={`
      border border-white/10 bg-zinc-950/98 backdrop-blur-xl
      text-foreground text-xs normal-case font-sans leading-relaxed 
      rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,1)] ring-1 ring-white/5 p-4
      ${className}
    `}
    >
      {children}
      {showTriangle && (
        <div
          className="absolute left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-[6px] border-transparent"
          style={{
            [trianglePosition === 'bottom' ? 'top' : 'bottom']: '100%',
            [trianglePosition === 'bottom' ? 'borderTopColor' : 'borderBottomColor']:
              'hsl(var(--zinc-950, 240 10% 3.9%))',
          }}
        />
      )}
    </div>
  );
};

/**
 * Premium Header for tooltips.
 * Uses Bebas Neue and a "shining" white color for high impact.
 */
export const TooltipHeader = ({ children, className = '' }) => (
  <p
    className={`
      text-slate-50 text-base mb-3 font-black tracking-wider uppercase font-display 
      border-b border-white/10 pb-2.5 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]
      ${className}
    `}
  >
    {children}
  </p>
);

/**
 * Reusable Info icon with a hoverable GlassTooltip.
 * Commonly used in card headers.
 */
export const InfoTooltip = ({ content, iconSize = 14 }) => {
  if (!content) return null;

  return (
    <details className="group/info relative inline-flex items-center">
      <summary
        className="flex min-h-11 min-w-11 cursor-help list-none items-center justify-center rounded-full text-slate-400 transition-colors hover:text-primary focus-visible:text-primary [&::-webkit-details-marker]:hidden"
        aria-label="Mostrar información"
      >
        <Info size={iconSize} aria-hidden="true" />
      </summary>

      <div
        className="
        fixed inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))]
        opacity-0 invisible group-open/info:opacity-100 group-open/info:visible
        sm:absolute sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:bottom-full sm:mb-3
        sm:min-w-[240px] sm:max-w-[320px] sm:group-hover/info:opacity-100 sm:group-hover/info:visible
        transition-all duration-300 z-50 text-left
      "
      >
        <GlassTooltip showTriangle trianglePosition="bottom">
          {content}
        </GlassTooltip>
      </div>
    </details>
  );
};
