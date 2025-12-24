import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * KpiBentoCard - Modular Bento Grid style component
 * @param {string} title - Card title (e.g., "Squad Value")
 * @param {string|number} value - Main data point (e.g., "45.2M€")
 * @param {string} subValue - Small secondary data (e.g., "avg: 12.4")
 * @param {number} trend - Percentage or change value for arrow
 * @param {string} trendLabel - Text next to trend (e.g., "vs yesterday")
 * @param {LucideIcon} icon - Lucide icon
 * @param {'default'|'success'|'danger'|'warning'|'brand'} variant - Visual style
 */
export default function KpiBentoCard({ 
  title, 
  value, 
  subValue,
  trend, 
  trendLabel, 
  icon: Icon, 
  variant = 'default',
  className = ""
}) {
  
  // Color configuration based on variant
  const variants = {
    default: {
      iconBg: 'bg-slate-800',
      iconColor: 'text-slate-400',
      border: 'hover:border-slate-600/50'
    },
    brand: {
      iconBg: 'bg-indigo-500/20',
      iconColor: 'text-indigo-400',
      border: 'hover:border-indigo-500/30'
    },
    success: {
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-400',
      border: 'hover:border-emerald-500/30'
    },
    danger: {
      iconBg: 'bg-rose-500/10',
      iconColor: 'text-rose-400',
      border: 'hover:border-rose-500/30'
    },
    warning: {
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-400',
      border: 'hover:border-amber-500/30'
    }
  };

  const style = variants[variant] || variants.default;
  const isPositive = trend > 0;
  const isNegative = trend < 0;

  return (
    <div className={`glass-panel rounded-2xl p-5 transition-all duration-300 group ${style.border} ${className}`}>
      {/* Header: Icon and Title */}
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${style.iconBg} transition-colors group-hover:scale-110 duration-300`}>
          {Icon && <Icon className={`w-5 h-5 ${style.iconColor}`} />}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
            isPositive ? 'bg-emerald-500/10 text-emerald-400' : 
            isNegative ? 'bg-rose-500/10 text-rose-400' : 
            'bg-slate-700/30 text-slate-400'
          }`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : 
             isNegative ? <TrendingDown className="w-3 h-3" /> : 
             <Minus className="w-3 h-3" />}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="space-y-1">
        <h3 className="text-slate-400 text-xs font-medium uppercase tracking-wider">{title}</h3>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold text-white tracking-tight font-mono">{value}</div>
          {subValue && <span className="text-sm text-slate-500">{subValue}</span>}
        </div>
      </div>

      {/* Footer / Trend Label */}
      {trendLabel && (
        <div className="mt-3 text-xs text-slate-500 border-t border-white/5 pt-3">
          {trendLabel}
        </div>
      )}
    </div>
  );
}