import { Skeleton } from '@/components/ui/foundation';
import { useMemo } from 'react';
import { Popover } from '@/components/ui/foundation';
import { Ruler } from 'lucide-react';
import { RoundRankingList } from '../../../RoundRankingList';

/**
 * ConsistencyRanking - Shows users ranked by consistency using StatsList
 */
export default function ConsistencyRanking({ allUsersHistory = [], users = [], loading = false }) {
  const items = useMemo(() => {
    if (!allUsersHistory.length) return [];

    return allUsersHistory
      .map(({ userId, history }) => {
        if (!history || history.length < 2) return null;

        const efficiencies = history.map((r) => r.efficiency);
        const min = Math.min(...efficiencies);
        const max = Math.max(...efficiencies);
        const range = max - min;
        const avg = efficiencies.reduce((sum, e) => sum + e, 0) / efficiencies.length;

        // Standard deviation for consistency score
        const variance =
          efficiencies.reduce((sum, e) => sum + Math.pow(e - avg, 2), 0) / efficiencies.length;
        const stdDev = Math.sqrt(variance);

        const user = users.find((u) => u.id === userId);

        return {
          id: userId,
          user_id: userId,
          name: user?.name || 'User',
          icon: user?.icon,
          color_index: user?.color_index,
          min,
          max,
          range,
          avg,
          stdDev,
          consistencyScore: 100 - stdDev, // Higher = more consistent
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.stdDev - b.stdDev); // Most consistent first
  }, [allUsersHistory, users]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 bg-secondary rounded" />
        ))}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No hay datos de consistencia disponibles
      </div>
    );
  }

  // Visualization helpers
  const scaleMin = 50;
  const scaleMax = 100;
  const getPos = (val) =>
    Math.max(0, Math.min(100, ((val - scaleMin) / (scaleMax - scaleMin)) * 100));

  return (
    <div className="flex flex-col h-full">
      <RoundRankingList
        items={items}
        renderRight={(data) => {
          const minPos = getPos(data.min);
          const maxPos = getPos(data.max);
          const avgPos = getPos(data.avg);
          const sdLowPos = getPos(Math.max(data.min, data.avg - data.stdDev));
          const sdHighPos = getPos(Math.min(data.max, data.avg + data.stdDev));

          // Dynamic Color based on Variation (stdDev)
          let barClass = 'bg-emerald-500';
          let textColor = 'text-[var(--round-ideal)]';
          if (data.stdDev >= 5 && data.stdDev < 10) {
            barClass = 'bg-cyan-500';
            textColor = 'text-cyan-400';
          } else if (data.stdDev >= 10 && data.stdDev < 15) {
            barClass = 'bg-yellow-500';
            textColor = 'text-[var(--round-record)]';
          } else if (data.stdDev >= 15) {
            barClass = 'bg-orange-500';
            textColor = 'text-primary';
          }

          return (
            <Popover
              label={`${data.name}: consistencia, media ${data.avg.toFixed(1)}%`}
              trigger={
                <span className="flex items-center gap-4">
                  {/* Visualization Container */}
                  <div className="w-24 sm:w-32 xl:w-40 h-5 bg-secondary/50 rounded relative overflow-hidden border border-border">
                    {/* Min-Max Total Range Bar */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 h-0.5 bg-secondary rounded-full"
                      style={{
                        left: `${minPos}%`,
                        width: `${Math.max(2, maxPos - minPos)}%`,
                      }}
                    />
                    {/* Variation Range Bar (Avg +/- SD) */}
                    <div
                      className={`absolute top-1/2 -translate-y-1/2 h-2 rounded-sm shadow-sm opacity-80 ${barClass}`}
                      style={{
                        left: `${sdLowPos}%`,
                        width: `${Math.max(2, sdHighPos - sdLowPos)}%`,
                      }}
                    />
                    {/* Average Marker */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 h-3.5 w-0.5 bg-[hsl(var(--content-primary))] rounded-full shadow-md z-10"
                      style={{ left: `${avgPos}%` }}
                    />
                  </div>

                  {/* Numeric Stats */}
                  <div className="text-right w-16 flex-shrink-0 flex flex-col justify-center">
                    <div className="text-[11px] font-black text-foreground leading-none">
                      {data.avg.toFixed(1)}%
                    </div>
                    <div className={`text-[9px] font-bold ${textColor} leading-tight pt-0.5`}>
                      ±{data.stdDev.toFixed(1)}
                    </div>
                  </div>
                </span>
              }
            >
              <p className="font-semibold">{data.name}</p>
              <p>Media: {data.avg.toFixed(1)}%</p>
              <p>
                Mínimo: {data.min.toFixed(1)}% · Máximo: {data.max.toFixed(1)}%
              </p>
              <p>Desviación: ±{data.stdDev.toFixed(1)}</p>
            </Popover>
          );
        }}
      />

      {/* Legend */}
      <div className="flex items-center justify-center gap-x-4 gap-y-1.5 pt-3 mt-auto border-t border-border text-[9px] text-muted-foreground flex-wrap uppercase font-bold tracking-tighter">
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-0.5 bg-[hsl(var(--content-muted))]" />
          <span>Rango Min-Max</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-1.5 rounded-[1px] bg-zinc-500/50 border border-border" />
          <span>Var. Típica</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-0.5 h-2.5 bg-white" />
          <span>Promedio</span>
        </div>
      </div>
    </div>
  );
}
