import { createElement } from 'react';
import PropTypes from 'prop-types';

const colorVariants = {
  emerald: {
    gradient: 'from-emerald-900/20 to-slate-900',
    border: 'border-emerald-700/30',
    hoverBorder: 'hover:border-emerald-600/50',
    iconText: 'text-emerald-500',
    iconBg: 'text-emerald-500',
    titleIconBg: 'bg-emerald-500/10',
  },
  indigo: {
    gradient: 'from-indigo-900/20 to-slate-900',
    border: 'border-indigo-700/30',
    hoverBorder: 'hover:border-indigo-600/50',
    iconText: 'text-indigo-500',
    iconBg: 'text-indigo-500',
    titleIconBg: 'bg-indigo-500/10',
  },
  purple: {
    gradient: 'from-purple-900/20 to-slate-900',
    border: 'border-purple-700/30',
    hoverBorder: 'hover:border-purple-600/50',
    iconText: 'text-purple-500',
    iconBg: 'text-purple-500',
    titleIconBg: 'bg-purple-500/10',
  },
  orange: {
    gradient: 'from-orange-900/20 to-slate-900',
    border: 'border-orange-700/30',
    hoverBorder: 'hover:border-orange-600/50',
    iconText: 'text-orange-500',
    iconBg: 'text-orange-500',
    titleIconBg: 'bg-orange-500/10',
  },
  cyan: {
    gradient: 'from-cyan-900/20 to-slate-900',
    border: 'border-cyan-700/30',
    hoverBorder: 'hover:border-cyan-600/50',
    iconText: 'text-cyan-500',
    iconBg: 'text-cyan-500',
    titleIconBg: 'bg-cyan-500/10',
  },
  yellow: {
    gradient: 'from-yellow-900/20 to-slate-900',
    border: 'border-yellow-700/30',
    hoverBorder: 'hover:border-yellow-600/50',
    iconText: 'text-yellow-500',
    iconBg: 'text-yellow-500',
    titleIconBg: 'bg-yellow-500/10',
  },
  pink: {
    gradient: 'from-pink-900/20 to-slate-900',
    border: 'border-pink-700/30',
    hoverBorder: 'hover:border-pink-600/50',
    iconText: 'text-pink-500',
    iconBg: 'text-pink-500',
    titleIconBg: 'bg-pink-500/10',
  },
  blue: {
    gradient: 'from-blue-900/20 to-slate-900',
    border: 'border-blue-700/30',
    hoverBorder: 'hover:border-blue-600/50',
    iconText: 'text-blue-500',
    iconBg: 'text-blue-500',
    titleIconBg: 'bg-blue-500/10',
  },
  rose: {
    gradient: 'from-rose-900/20 to-slate-900',
    border: 'border-rose-700/30',
    hoverBorder: 'hover:border-rose-600/50',
    iconText: 'text-rose-500',
    iconBg: 'text-rose-500',
    titleIconBg: 'bg-rose-500/10',
  },
};

export default function StandardCard({
  children,
  title,
  icon,
  color = 'indigo',
  loading = false,
  className = '',
  actionRight = null,
}) {
  const styles = colorVariants[color] || colorVariants.indigo;

  if (loading) {
    return (
      <div
        className={`bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 animate-pulse h-full ${className}`}
      >
        <div className="h-6 bg-slate-700/50 rounded w-1/2 mb-4"></div>
        <div className="space-y-3">
          <div className="h-16 bg-slate-700/50 rounded"></div>
          <div className="h-16 bg-slate-700/50 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-gradient-to-br ${styles.gradient} backdrop-blur-md border ${styles.border} rounded-2xl p-6 relative overflow-hidden group ${styles.hoverBorder} transition-all duration-300 h-full flex flex-col ${className}`}
    >
      {/* Background decoration */}
      <div className="absolute -top-6 -right-6 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
        {icon && createElement(icon, { className: `w-32 h-32 ${styles.iconBg}` })}
      </div>

      <div className="relative flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-5 shrink-0 relative">
          {icon && createElement(icon, { className: `w-5 h-5 ${styles.iconText}` })}
          <h2 className="text-xl font-bold text-white">{title}</h2>

          {actionRight && <div className="ml-auto">{actionRight}</div>}
        </div>

        <div className="flex-1 flex flex-col relative z-10">{children}</div>
      </div>
    </div>
  );
}

StandardCard.propTypes = {
  /** Card content */
  children: PropTypes.node,
  /** Card title displayed in header */
  title: PropTypes.string.isRequired,
  /** Lucide icon component to display */
  icon: PropTypes.elementType,
  /** Color theme variant */
  color: PropTypes.oneOf([
    'emerald',
    'indigo',
    'purple',
    'orange',
    'cyan',
    'yellow',
    'pink',
    'blue',
    'rose',
  ]),
  /** Show loading skeleton state */
  loading: PropTypes.bool,
  /** Additional CSS classes */
  className: PropTypes.string,
  /** Action element to display on the right side of header */
  actionRight: PropTypes.node,
};
