'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getColorForUser } from '@/lib/constants/colors';

/**
 * ConsistencyRanking - Shows users ranked by consistency (lowest variance in efficiency)
 * Displays efficiency range (min-max) with a visual bar
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
    <div className="space-y-2">
      {consistencyData.map((data, index) => {
        const user = users.find((u) => u.id === data.userId);
        const userColor = getColorForUser(data.userId, user?.name, user?.color_index);

        // Calculate bar positions (scale 50-100 range)
        const scaleMin = 50;
        const scaleMax = 100;
        const minPos = ((data.min - scaleMin) / (scaleMax - scaleMin)) * 100;
        const maxPos = ((data.max - scaleMin) / (scaleMax - scaleMin)) * 100;
        const avgPos = ((data.avg - scaleMin) / (scaleMax - scaleMin)) * 100;

        return (
          <div
            key={data.userId}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            {/* Rank */}
            <span className="w-5 text-xs text-muted-foreground font-bold">#{index + 1}</span>

            {/* User */}
            <Link
              href={`/user/${data.userId}`}
              className="flex items-center gap-2 w-24 flex-shrink-0 group"
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
                {user?.name?.slice(0, 8) || 'User'}
              </span>
            </Link>

            {/* Range bar */}
            <div className="flex-1 h-4 bg-zinc-800 rounded relative">
              {/* Min-Max range bar */}
              <div
                className="absolute h-full bg-gradient-to-r from-orange-500/60 to-emerald-500/60 rounded"
                style={{
                  left: `${Math.max(0, minPos)}%`,
                  width: `${Math.min(100, maxPos - minPos)}%`,
                }}
              />
              {/* Average marker */}
              <div
                className="absolute w-1 h-full bg-white rounded"
                style={{ left: `${Math.max(0, Math.min(100, avgPos))}%` }}
              />
            </div>

            {/* Stats */}
            <div className="text-right w-20 flex-shrink-0">
              <div className="text-[10px] text-muted-foreground">
                {data.min.toFixed(0)}-{data.max.toFixed(0)}%
              </div>
              <div className="text-xs font-medium text-foreground">±{data.stdDev.toFixed(1)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
