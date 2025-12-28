import { createElement } from 'react';

const colorVariants = {
  emerald: {
    bg: 'bg-emerald-900/10',
    border: 'border-white/10 group-hover:border-emerald-500/30',
    glow: 'shadow-[0_8px_32px_-8px_rgba(16,185,129,0.3)]',
    text: 'text-emerald-400',
    iconBg: 'bg-emerald-500/20',
  },
  indigo: {
    bg: 'bg-indigo-900/10',
    border: 'border-white/10 group-hover:border-indigo-500/30',
    glow: 'shadow-[0_8px_32px_-8px_rgba(99,102,241,0.3)]',
    text: 'text-indigo-400',
    iconBg: 'bg-indigo-500/20',
  },
  purple: {
    bg: 'bg-purple-900/10',
    border: 'border-white/10 group-hover:border-purple-500/30',
    glow: 'shadow-[0_8px_32px_-8px_rgba(168,85,247,0.3)]',
    text: 'text-purple-400',
    iconBg: 'bg-purple-500/20',
  },
  blue: {
    bg: 'bg-blue-900/10',
    border: 'border-white/10 group-hover:border-blue-500/30',
    glow: 'shadow-[0_8px_32px_-8px_rgba(59,130,246,0.3)]',
    text: 'text-blue-400',
    iconBg: 'bg-blue-500/20',
  },
  orange: {
    bg: 'bg-orange-900/10',
    border: 'border-white/10 group-hover:border-orange-500/30',
    glow: 'shadow-[0_8px_32px_-8px_rgba(249,115,22,0.3)]',
    text: 'text-orange-400',
    iconBg: 'bg-orange-500/20',
  },
  rose: {
    bg: 'bg-rose-900/10',
    border: 'border-white/10 group-hover:border-rose-500/30',
    glow: 'shadow-[0_8px_32px_-8px_rgba(244,63,94,0.3)]',
    text: 'text-rose-400',
    iconBg: 'bg-rose-500/20',
  },
};

export default function GlassCard({
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
        className={`backdrop-blur-xl bg-slate-900/30 border border-white/5 rounded-3xl p-6 h-full animate-pulse flex flex-col ${className}`}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-white/10 shadow-inner"></div>
          <div className="h-5 bg-white/5 rounded-full w-1/3"></div>
        </div>
        <div className="space-y-4 flex-1">
          <div className="h-24 bg-white/5 rounded-2xl border border-white/5"></div>
          <div className="h-16 bg-white/5 rounded-2xl border border-white/5"></div>
          <div className="flex-1 bg-white/5 rounded-2xl border border-white/5"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
      relative backdrop-blur-2xl bg-slate-950/40 
      border ${styles.border} rounded-3xl p-6 h-full flex flex-col 
      transition-all duration-500 group overflow-hidden
      hover:bg-slate-900/60 hover:-translate-y-1 hover:shadow-2xl
      ${className}
    `}
    >
      {/* Glossy Reflection Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${styles.iconBg} backdrop-blur-sm shadow-inner`}>
            {icon && createElement(icon, { className: `w-5 h-5 ${styles.text}` })}
          </div>
          <h2 className="text-lg font-semibold text-white/90 tracking-tight">{title}</h2>
        </div>
        {actionRight && <div className="ml-auto">{actionRight}</div>}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col relative z-10">{children}</div>
    </div>
  );
}
