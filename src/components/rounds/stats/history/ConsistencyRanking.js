'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getColorForUser } from '@/lib/constants/colors';

/**
 * ConsistencyRanking - Shows users ranked by consistency (lowest variance in efficiency)
 * Redesigned to clearly show Range, Average, and Variation with color coding.
 */
export default function ConsistencyRanking({ allUsersHistory = [], users = [], loading = false }) {
  const consistencyData = useMemo(() => {
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

        return {
          userId,
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
  }, [allUsersHistory]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 bg-white/5 rounded" />
        ))}
      </div>
    );
  }

  if (!consistencyData.length) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No hay datos de consistencia disponibles
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {consistencyData.map((data, index) => {
          const user = users.find((u) => u.id === data.userId);
          const userColor = getColorForUser(data.userId, user?.name, user?.color_index);

          // Calculate bar positions (scale 50-100 range for detailed view)
          const scaleMin = 50;
          const scaleMax = 100;
          const getPos = (val) =>
            Math.max(0, Math.min(100, ((val - scaleMin) / (scaleMax - scaleMin)) * 100));

          const minPos = getPos(data.min);
          const maxPos = getPos(data.max);
          const avgPos = getPos(data.avg);

          // Standard Deviation positions (Visualizing "Normal Performance Range")
          // Clamped to be visually useful, roughly Avg +/- SD
          const sdLowPos = getPos(Math.max(data.min, data.avg - data.stdDev));
          const sdHighPos = getPos(Math.min(data.max, data.avg + data.stdDev));

          // Dynamic Color based on Variation (stdDev)
          let barColorBase = 'emerald-500';
          if (data.stdDev >= 5 && data.stdDev < 10) barColorBase = 'cyan-500';
          else if (data.stdDev >= 10 && data.stdDev < 15) barColorBase = 'yellow-500';
          else if (data.stdDev >= 15) barColorBase = 'orange-500';

          return (
            <div
              key={data.userId}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group"
            >
              {/* Rank */}
              <span className="w-5 text-xs text-muted-foreground font-bold">#{index + 1}</span>

              {/* User */}
              <Link
                href={`/user/${data.userId}`}
                className="flex items-center gap-2 w-28 flex-shrink-0 group-hover:opacity-100 transition-opacity"
              >
                {user?.icon ? (
                  <Image
                    src={user.icon}
                    alt={user.name}
                    width={20}
                    height={20}
                    unoptimized
                    className="rounded-full object-cover group-hover:scale-110 transition-transform"
                  />
                ) : (
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                    style={{ backgroundColor: userColor.stroke }}
                  >
                    {user?.name?.charAt(0) || '?'}
                  </div>
                )}
                <span className={`text-xs font-medium truncate ${userColor.text}`}>
                  {user?.name?.slice(0, 10) || 'User'}
                </span>
              </Link>

              {/* Visualization Container */}
              <div className="flex-1 h-6 bg-zinc-900/50 rounded relative overflow-hidden border border-white/5">
                {/* 1. Min-Max Total Range Bar (Faint/Thin) */}
                <div
                  className={`absolute top-1/2 -translate-y-1/2 h-1 bg-${barColorBase}/20 rounded-full`}
                  style={{
                    left: `${minPos}%`,
                    width: `${Math.max(2, maxPos - minPos)}%`,
                  }}
                >
                  {/* Vertical ticks for min/max */}
                  <div className={`absolute left-0 h-3 -top-1 w-0.5 bg-${barColorBase}/40`} />
                  <div className={`absolute right-0 h-3 -top-1 w-0.5 bg-${barColorBase}/40`} />
                </div>

                {/* 2. Variation Range Bar (Avg +/- SD) - Solid & Thicker */}
                {/* Represents typical performance area */}
                <div
                  className={`absolute top-1/2 -translate-y-1/2 h-2.5 bg-${barColorBase} rounded-sm shadow-sm`}
                  style={{
                    left: `${sdLowPos}%`,
                    width: `${Math.max(1, sdHighPos - sdLowPos)}%`,
                    opacity: 0.8,
                  }}
                />

                {/* 3. Average Marker (Visual Pivot) */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-4 w-1 bg-white rounded-full shadow-md z-10"
                  style={{ left: `${avgPos}%` }}
                />
              </div>

              {/* Stats */}
              <div className="text-right w-24 flex-shrink-0 flex flex-col items-end gap-0.5">
                <div className="flex items-center gap-1.5" title="Average Efficiency">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Prom
                  </span>
                  <span className="text-xs font-bold text-white">{data.avg.toFixed(1)}%</span>
                </div>
                <div className="flex items-center gap-1.5" title="Standard Deviation">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Var
                  </span>
                  <span className={`text-xs font-medium text-${barColorBase}`}>
                    ±{data.stdDev.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 pt-3 border-t border-white/5 text-[10px] text-muted-foreground flex-wrap">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center h-3 w-8 bg-zinc-800 rounded relative border border-white/5">
            <div className="absolute left-[10%] right-[10%] h-0.5 bg-emerald-500/40" />
            <div className="absolute left-[10%] h-2 w-px bg-emerald-500/40" />
            <div className="absolute right-[10%] h-2 w-px bg-emerald-500/40" />
          </div>
          <span>Rango Total (Min-Max)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center h-3 w-8 bg-zinc-800 rounded relative border border-white/5">
            <div className="h-2 w-4 bg-emerald-500/80 rounded-sm" />
          </div>
          <span>Rango Habitual (±Var)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center h-3 w-4 justify-center bg-zinc-800 rounded relative">
            <div className="w-1 h-2.5 bg-white rounded-full" />
          </div>
          <span>Promedio</span>
        </div>
      </div>
    </div>
  );
}
