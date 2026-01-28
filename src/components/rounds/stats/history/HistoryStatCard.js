'use client';

import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

/**
 * Reusable card for history statistics
 * follows similar pattern to StatLeaderCard but for numeric history data
 */
export default function HistoryStatCard({
  title,
  value,
  subValue,
  icon: Icon,
  color = 'blue',
  trend = null, // 'up', 'down', or null
}) {
  return (
    <div
      className={`bg-gradient-to-br from-${color}-500/10 to-${color}-900/20 border border-${color}-500/20 rounded-xl p-4 h-full flex flex-col justify-between transition-all hover:scale-[1.02] hover:shadow-lg`}
    >
      <div className={`flex items-center gap-2 text-${color}-500 mb-2`}>
        {Icon && <Icon size={16} />}
        <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
      </div>

      <div>
        <div className="flex items-baseline gap-1">
          <span className={`text-3xl font-bold text-${color}-400`}>{value}</span>
          {trend && (
            <span className={`ml-2 ${trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
              {trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            </span>
          )}
        </div>

        {subValue && <div className="text-xs text-zinc-400 mt-1">{subValue}</div>}
      </div>
    </div>
  );
}
