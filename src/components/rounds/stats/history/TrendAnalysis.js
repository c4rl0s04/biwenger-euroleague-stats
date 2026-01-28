'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getColorForUser } from '@/lib/constants/colors';

/**
 * TrendAnalysis - Shows who is improving vs declining over recent rounds
 * Calculates efficiency trend based on last N rounds
 */
export default function TrendAnalysis({ allUsersHistory = [], users = [], loading = false }) {
  const trendData = useMemo(() => {
    if (!allUsersHistory.length) return [];

    return allUsersHistory
      .map(({ userId, history }) => {
        if (!history || history.length < 4) return null;

        // Sort by round number and get last 8 rounds (or all if less)
        const sorted = [...history].sort((a, b) => a.round_number - b.round_number);
        const recentCount = Math.min(8, sorted.length);
        const recent = sorted.slice(-recentCount);

        // Split into first half and second half
        const midpoint = Math.floor(recent.length / 2);
        const firstHalf = recent.slice(0, midpoint);
        const secondHalf = recent.slice(midpoint);

        const firstAvg = firstHalf.reduce((sum, r) => sum + r.efficiency, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, r) => sum + r.efficiency, 0) / secondHalf.length;

        const change = secondAvg - firstAvg;
        const allTimeAvg = history.reduce((sum, r) => sum + r.efficiency, 0) / history.length;

        return {
          userId,
          change,
          firstAvg,
          secondAvg,
          allTimeAvg,
          trend: change > 2 ? 'up' : change < -2 ? 'down' : 'stable',
          roundsAnalyzed: recentCount,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.change - a.change); // Best improvement first
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

  if (!trendData.length) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No hay datos de tendencia disponibles
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {trendData.map((data) => {
        const user = users.find((u) => u.id === data.userId);
        const userColor = getColorForUser(data.userId, user?.name, user?.color_index);

        const TrendIcon =
          data.trend === 'up' ? TrendingUp : data.trend === 'down' ? TrendingDown : Minus;
        const trendColor =
          data.trend === 'up'
            ? 'text-emerald-400'
            : data.trend === 'down'
              ? 'text-red-400'
              : 'text-yellow-400';
        const bgColor =
          data.trend === 'up'
            ? 'bg-emerald-500/10'
            : data.trend === 'down'
              ? 'bg-red-500/10'
              : 'bg-yellow-500/10';

        return (
          <div
            key={data.userId}
            className={`flex items-center gap-3 p-2 rounded-lg ${bgColor} transition-colors`}
          >
            {/* User */}
            <Link
              href={`/user/${data.userId}`}
              className="flex items-center gap-2 w-28 flex-shrink-0 group"
            >
              {user?.icon ? (
                <Image
                  src={user.icon}
                  alt={user.name}
                  width={24}
                  height={24}
                  unoptimized
                  className="rounded-full object-cover group-hover:scale-110 transition-transform"
                />
              ) : (
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                  style={{ backgroundColor: userColor.stroke }}
                >
                  {user?.name?.charAt(0) || '?'}
                </div>
              )}
              <span className={`text-sm font-medium truncate ${userColor.text}`}>
                {user?.name || 'User'}
              </span>
            </Link>

            {/* Trend indicator */}
            <div className={`flex items-center gap-1 ${trendColor}`}>
              <TrendIcon size={16} />
              <span className="text-sm font-bold">
                {data.change > 0 ? '+' : ''}
                {data.change.toFixed(1)}%
              </span>
            </div>

            {/* Before/After */}
            <div className="flex-1 flex items-center justify-end gap-3 text-xs">
              <span className="text-muted-foreground">{data.firstAvg.toFixed(1)}%</span>
              <span className="text-muted-foreground">→</span>
              <span className={trendColor}>{data.secondAvg.toFixed(1)}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
