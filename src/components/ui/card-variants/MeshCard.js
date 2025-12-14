import { createElement } from 'react';

const colorVariants = {
  emerald: 'from-emerald-950/80 via-slate-950 to-slate-950 border-emerald-500/20 text-emerald-400',
  indigo: 'from-indigo-950/80 via-slate-950 to-slate-950 border-indigo-500/20 text-indigo-400',
  purple: 'from-purple-950/80 via-slate-950 to-slate-950 border-purple-500/20 text-purple-400',
  blue: 'from-blue-950/80 via-slate-950 to-slate-950 border-blue-500/20 text-blue-400',
  orange: 'from-orange-950/80 via-slate-950 to-slate-950 border-orange-500/20 text-orange-400'
};

export default function MeshCard({ children, title, icon, color = 'indigo', loading = false, className = '', actionRight = null }) {
  const styles = colorVariants[color] || colorVariants.indigo;
  // Extract color name for dynamic mesh glow
  const glowColor = styles.split(' ')[0].replace('from-', '').replace('/80', '');

  if (loading) {
    return (
      <div className={`bg-slate-950 border border-slate-800 rounded-2xl p-6 h-full animate-pulse ${className}`}>
        <div className="h-6 bg-slate-800 rounded w-1/3 mb-4"></div>
        <div className="h-32 bg-slate-900 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className={`
      relative bg-gradient-to-b ${styles}
      border rounded-2xl p-0 h-full flex flex-col 
      transition-all duration-300 group
      hover:shadow-lg overflow-hidden
      ${className}
    `}>
      {/* Dynamic Mesh Background */}
      <div className={`absolute top-0 inset-x-0 h-32 bg-${glowColor} blur-[80px] opacity-20 pointer-events-none`}></div>
      
      {/* Card Content Container */}
      <div className="p-6 h-full flex flex-col relative z-10 backdrop-blur-0">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-2.5">
            {icon && createElement(icon, { className: `w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity ${styles.split(' ').pop()}` })}
            <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">{title}</span>
          </div>
          {actionRight}
        </div>
        
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
