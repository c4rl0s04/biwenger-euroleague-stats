'use client';

import { BarChart3, User, Trophy, Medal } from 'lucide-react';
import { getColorForUser } from '@/lib/competition/public';
import Image from 'next/image';
import { CardTitle, EmptyState } from '@/components/ui/foundation';

/**
 * LineupStatsCard - Displays preferred lineup formations
 * 1. Global usage chart
 * 2. Per-user favorite formation
 */
export default function LineupStatsCard({ globalStats = [], userStats = [] }) {
  if (!globalStats.length && !userStats.length)
    return <EmptyState className="py-6">No hay datos de alineaciones disponibles.</EmptyState>;

  const maxGlobalPct = Math.max(...globalStats.map((s) => s.percentage));

  return (
    <div className="col-span-1 md:col-span-2 lg:col-span-3">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 p-3.5">
        {/* LEFT: Global Trends */}
        <div className="xl:col-span-4">
          <CardTitle
            as="h4"
            className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--round-global)] mb-3 pb-1.5 border-b border-border"
          >
            <BarChart3 size={14} />
            Tendencia Global
          </CardTitle>

          <div className="space-y-2">
            {globalStats.slice(0, 10).map((stat, idx) => (
              <div
                key={stat.formation}
                className="group rounded-lg border border-border bg-secondary/40 px-2.5 py-1.5"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground w-5">
                      #{idx + 1}
                    </span>
                    <span className="font-black text-foreground tracking-widest text-sm leading-none">
                      {stat.formation}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-purple-300 font-mono">
                    {stat.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-secondary/70 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500/80 rounded-full group-hover:bg-purple-400 transition-all duration-500"
                    style={{
                      width: `${maxGlobalPct > 0 ? (stat.percentage / maxGlobalPct) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: User Favorites */}
        <div className="xl:col-span-8">
          <CardTitle
            as="h4"
            className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--round-global)] mb-3 pb-1.5 border-b border-border"
          >
            <User size={14} />
            Favorita por Usuario
          </CardTitle>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {userStats.map((user) => {
              const color = getColorForUser(user.userId, user.name, user.color_index);
              const topFormations = user.topFormations || (user.favorite ? [user.favorite] : []);
              const primary = topFormations[0];
              const secondary = topFormations[1];

              return (
                <div
                  key={user.userId}
                  className="rounded-lg border border-border bg-secondary/35 px-2 py-2 hover:bg-secondary transition-colors"
                >
                  {/* Manager */}
                  <div className="flex items-center gap-2 min-w-0 mb-1.5">
                    <div className="relative shrink-0">
                      <div
                        className="w-8 h-8 rounded-full p-[2px]"
                        style={{
                          background: `linear-gradient(135deg, ${color.stroke}, transparent)`,
                        }}
                      >
                        {user.icon ? (
                          <Image
                            src={user.icon}
                            alt={user.name}
                            width={28}
                            height={28}
                            className="rounded-full w-full h-full object-cover bg-secondary"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-foreground">
                            {user.name[0]}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className={`text-[11px] font-bold truncate text-foreground`}>
                        {user.name}
                      </div>
                      <div className="text-[9px] text-muted-foreground">
                        {Math.round(user.totalRounds || 0)} jornadas
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {/* Primary */}
                    <div className="rounded-md border border-amber-500/25 bg-amber-500/10 px-2 py-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-[var(--round-record)]">
                          <Trophy size={10} />
                          1ª
                        </div>
                        <div className="text-[10px] font-bold text-[var(--round-record)] font-mono">
                          {primary ? `${primary.percentage.toFixed(0)}%` : '—'}
                        </div>
                      </div>
                      <div className="text-lg font-black text-foreground leading-none tracking-tight">
                        {primary?.formation || '—'}
                      </div>
                      <div className="h-1 w-full bg-secondary rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full bg-amber-400/80 rounded-full"
                          style={{ width: `${Math.min(primary?.percentage || 0, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Secondary */}
                    <div className="rounded-md border border-sky-500/20 bg-sky-500/10 px-2 py-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-[var(--round-info)]">
                          <Medal size={10} />
                          2ª
                        </div>
                        <div className="text-[10px] font-bold text-[var(--round-info)] font-mono">
                          {secondary ? `${secondary.percentage.toFixed(0)}%` : '—'}
                        </div>
                      </div>
                      <div className="text-base font-black text-foreground leading-none tracking-tight">
                        {secondary?.formation || '—'}
                      </div>
                      <div className="h-1 w-full bg-sky-950/40 rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full bg-sky-400/80 rounded-full"
                          style={{ width: `${Math.min(secondary?.percentage || 0, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
