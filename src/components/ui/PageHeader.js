import React from 'react';

/**
 * Standard Page Header component
 * Matches the design of the Dashboard header with a gradient pill and large display text.
 *
 * @param {Object} props
 * @param {string} props.title - Main title text
 * @param {string} [props.description] - Optional description text below the title
 * @param {string} [props.className] - Additional classes
 */
export default function PageHeader({ title, description, className = '' }) {
  return (
    <div
      className={`w-full px-4 sm:px-6 lg:px-8 pt-9 sm:pt-12 lg:pt-16 pb-6 lg:pb-8 relative z-10 ${className}`}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-4 lg:gap-6">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4 lg:gap-5 group">
            <span className="w-1.5 lg:w-2 h-10 sm:h-12 lg:h-14 shrink-0 bg-gradient-to-b from-primary via-orange-400 to-primary/20 rounded-full shadow-[0_0_15px_rgba(250,80,1,0.4)] group-hover:scale-y-110 transition-transform duration-500"></span>
            <h1 className="min-w-0 break-words text-[2.15rem] sm:text-5xl lg:text-7xl font-black font-display tracking-tight leading-[0.92] bg-gradient-to-br from-primary via-orange-400 to-orange-600 bg-clip-text text-transparent drop-shadow-sm">
              {title}
            </h1>
          </div>
          {description && (
            <div className="relative">
              <p className="text-slate-400 text-sm sm:text-base lg:text-xl font-medium max-w-5xl leading-relaxed font-sans border-l-2 border-white/5 pl-4 lg:pl-6 py-1">
                {description}
              </p>
              <div className="absolute bottom-[-1.5rem] left-0 right-0 h-px bg-gradient-to-r from-white/10 via-white/5 to-transparent"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
