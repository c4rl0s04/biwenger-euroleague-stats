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
    <div className={`w-full px-4 sm:px-6 lg:px-8 pt-16 pb-8 relative z-10 ${className}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-5 group">
            <span className="w-2 h-14 bg-gradient-to-b from-primary via-orange-400 to-primary/20 rounded-full shadow-[0_0_15px_rgba(250,80,1,0.4)] group-hover:scale-y-110 transition-transform duration-500"></span>
            <h1 className="text-3xl md:text-7xl font-black font-display tracking-tight leading-none bg-gradient-to-br from-primary via-orange-400 to-orange-600 bg-clip-text text-transparent drop-shadow-sm">
              {title}
            </h1>
          </div>
          {description && (
            <div className="relative">
              <p className="text-slate-400 text-lg md:text-xl font-medium max-w-5xl leading-relaxed font-sans border-l-2 border-white/5 pl-6 py-1">
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
