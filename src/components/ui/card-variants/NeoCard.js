import { createElement } from 'react';

const colorVariants = {
  emerald: 'border-l-emerald-500 shadow-emerald-900/5',
  indigo: 'border-l-indigo-500 shadow-indigo-900/5',
  purple: 'border-l-purple-500 shadow-purple-900/5',
  blue: 'border-l-blue-500 shadow-blue-900/5',
  orange: 'border-l-orange-500 shadow-orange-900/5',
  rose: 'border-l-rose-500 shadow-rose-900/5',
};

export default function NeoCard({
  children,
  title,
  icon,
  color = 'indigo',
  loading = false,
  className = '',
  actionRight = null,
}) {
  const accentClass = colorVariants[color] || colorVariants.indigo;

  if (loading) {
    return (
      <div
        className={`bg-slate-950 border border-slate-800 border-l-4 ${accentClass} rounded-lg p-5 h-full flex flex-col animate-pulse ${className}`}
      >
        <div className="flex justify-between items-start mb-4 border-b border-slate-900 pb-4">
          <div className="space-y-2">
            <div className="h-4 bg-slate-800 w-32 rounded-sm"></div>
            <div className="h-0.5 w-8 bg-slate-800 rounded-full"></div>
          </div>
          <div className="w-5 h-5 bg-slate-800 rounded-sm"></div>
        </div>
        <div className="flex-1 space-y-3">
          <div className="h-full bg-slate-900/40 rounded-sm border border-slate-800/50"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
      bg-slate-950 border border-slate-800 border-l-4 ${accentClass}
      rounded-lg p-5 h-full flex flex-col shadow-sm
      hover:bg-slate-900/80 transition-colors duration-200
      ${className}
    `}
    >
      <div className="flex items-start justify-between mb-4 pb-4 border-b border-slate-900">
        <div className="flex flex-col">
          <h2 className="text-base font-semibold text-slate-100">{title}</h2>
          {/* Decorative tiny line */}
          <div className={`h-0.5 w-8 mt-1 rounded-full bg-slate-700`}></div>
        </div>
        <div className="flex items-center gap-3">
          {icon && createElement(icon, { className: 'w-5 h-5 text-slate-500' })}
          {actionRight}
        </div>
      </div>

      <div className="flex-1 flex flex-col text-slate-300">{children}</div>
    </div>
  );
}
