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
      bg-popover/90 backdrop-blur-xl border border-white/10 
      text-foreground text-xs normal-case font-sans leading-relaxed 
      rounded-2xl shadow-2xl ring-1 ring-white/5 p-4
      ${className}
    `}
    >
      {children}
      {showTriangle && (
        <div
          className={`
            absolute left-1/2 -translate-x-1/2 w-0 h-0 
            border-l-[6px] border-r-[6px] border-[6px] border-transparent
            ${trianglePosition === 'bottom' ? 'top-full border-t-popover/90' : 'bottom-full border-b-popover/90'}
          `}
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
    <div className="group/info relative cursor-help inline-flex items-center">
      <Info size={iconSize} className="text-slate-400 hover:text-primary transition-colors" />

      <div
        className="
        absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-64 
        opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible 
        transition-all duration-300 z-50 text-center
      "
      >
        <GlassTooltip showTriangle trianglePosition="bottom">
          {content}
        </GlassTooltip>
      </div>
    </div>
  );
};
