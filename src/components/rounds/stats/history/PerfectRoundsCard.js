'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Award, Target } from 'lucide-react';
import { getColorForUser } from '@/lib/constants/colors';

/**
 * PerfectRoundsCard - Count of how many times each user achieved 90%+ or 95%+ efficiency
 */
export default function PerfectRoundsCard({ allUsersHistory = [], users = [], loading = false }) {
  const perfectData = useMemo(() => {
    if (!allUsersHistory.length) return [];

    return allUsersHistory
      .map(({ userId, history }) => {
        if (!history || history.length === 0) return null;

        const elite = history.filter((r) => r.efficiency >= 95).length; // 95%+
        const excellent = history.filter((r) => r.efficiency >= 90 && r.efficiency < 95).length; // 90-94%
        const good = history.filter((r) => r.efficiency >= 85 && r.efficiency < 90).length; // 85-89%
        const totalRounds = history.length;

        return {
          userId,
          elite,
          excellent,
          good,
          totalRounds,
          elitePercent: ((elite / totalRounds) * 100).toFixed(0),
          score: elite * 3 + excellent * 2 + good, // Weighted score
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score); // Best score first
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

  if (!perfectData.length) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">No hay datos disponibles</div>
    );
  }

  return (
    <div className="space-y-2">
      {perfectData.map((data, index) => {
        const user = users.find((u) => u.id === data.userId);
        const userColor = getColorForUser(data.userId, user?.name, user?.color_index);

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

            {/* Badges */}
            <div className="flex items-center gap-3 flex-1">
              {/* 95%+ Elite */}
              <div className="flex items-center gap-1">
                <Star size={14} className="text-yellow-400" fill="currentColor" />
                <span className="text-sm font-bold text-yellow-400">{data.elite}</span>
              </div>

              {/* 90-94% Excellent */}
              <div className="flex items-center gap-1">
                <Award size={14} className="text-emerald-400" />
                <span className="text-sm font-medium text-emerald-400">{data.excellent}</span>
              </div>

              {/* 85-89% Good */}
              <div className="flex items-center gap-1">
                <Target size={14} className="text-blue-400" />
                <span className="text-sm font-medium text-blue-400">{data.good}</span>
              </div>
            </div>

            {/* Total */}
            <div className="text-right">
              <span className="text-xs text-muted-foreground">de {data.totalRounds}</span>
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 pt-2 mt-2 border-t border-border/50 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <Star size={10} className="text-yellow-400" fill="currentColor" />
          <span>95%+</span>
        </div>
        <div className="flex items-center gap-1">
          <Award size={10} className="text-emerald-400" />
          <span>90-94%</span>
        </div>
        <div className="flex items-center gap-1">
          <Target size={10} className="text-blue-400" />
          <span>85-89%</span>
        </div>
      </div>
    </div>
  );
}
