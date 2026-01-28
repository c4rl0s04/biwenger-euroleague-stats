'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getColorForUser } from '@/lib/constants/colors';

/**
 * LostPointsChart - Horizontal bar chart showing cumulative lost points per user
 */
export default function LostPointsChart({ leaderboardData = [], users = [], loading = false }) {
  const chartData = useMemo(() => {
    if (!leaderboardData.length) return [];

    // Sort by total lost (most lost first)
    return [...leaderboardData].sort((a, b) => b.totalLost - a.totalLost);
  }, [leaderboardData]);

  const maxLost = useMemo(() => {
    if (!chartData.length) return 1;
    return Math.max(...chartData.map((d) => d.totalLost));
  }, [chartData]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-8 bg-white/5 rounded" />
        ))}
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No hay datos de puntos perdidos disponibles
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {chartData.map((data, index) => {
        const user = users.find((u) => u.id === data.userId);
        const userColor = getColorForUser(data.userId, user?.name, user?.color_index);
        const barWidth = (data.totalLost / maxLost) * 100;

        // Color intensity based on position (worst = more red)
        const barColor = index === 0 ? 'bg-red-500' : index < 3 ? 'bg-red-400/80' : 'bg-red-400/60';

        return (
          <div key={data.userId} className="flex items-center gap-2">
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

            {/* Bar */}
            <div className="flex-1 h-6 bg-zinc-800/50 rounded-lg overflow-hidden relative">
              <div
                className={`h-full ${barColor} rounded-lg transition-all duration-500 flex items-center justify-end pr-2`}
                style={{ width: `${barWidth}%` }}
              >
                {barWidth > 20 && (
                  <span className="text-[10px] font-bold text-white">-{data.totalLost}</span>
                )}
              </div>
              {barWidth <= 20 && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">
                  -{data.totalLost}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
