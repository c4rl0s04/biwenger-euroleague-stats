import React from 'react';

/**
 * Standard Subheading component for sections
 * Use this to subtitle groups of cards or sections within a page.
 * Matches the styling of ElegantCard headers.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content of the subheading (can be string or nodes)
 * @param {string} [props.className] - Additional classes
 */
export default function Subheading({ children, title, subtitle, icon: Icon, className = '' }) {
  // Support both legacy (children only) and new (props) usage
  const mainTitle = title || children;

  return (
    <div className={`flex flex-col gap-1 pb-4 border-b border-white/5 ${className}`}>
      <div className="flex items-center gap-3">
        {Icon && <Icon className="w-6 h-6 text-indigo-400" />}
        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">
          {mainTitle}
        </h2>
      </div>
      {subtitle && <p className="text-zinc-400 text-sm max-w-2xl ml-0.5">{subtitle}</p>}
    </div>
  );
}
