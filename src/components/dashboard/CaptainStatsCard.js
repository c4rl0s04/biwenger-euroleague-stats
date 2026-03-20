'use client';

import { useClientUser } from '@/lib/hooks/useClientUser';
import { Crown } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';

export default function CaptainStatsCard() {
  const { currentUser, isReady } = useClientUser();

  const { data: stats, loading } = useApiData(
    () => (currentUser ? `/api/dashboard/captain-stats?userId=${currentUser.id}` : null),
    {
      transform: (d) => d?.stats || d,
      dependencies: [currentUser?.id],
      skip: !currentUser,
    }
  );

  if (!isReady) return null;

  return (
    <Card
      title="Rendimiento de Capitanes"
      icon={Crown}
      color="yellow"
      loading={loading}
      className="card-glow"
    >
      {!loading && stats && (
        <div className="flex-grow flex flex-col gap-3">
          {/* Overall stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-secondary/50 backdrop-blur-sm rounded-xl p-2.5 border border-border/50">
              <div className="text-muted-foreground text-[10px] font-medium mb-1 uppercase tracking-wider">
                Jornadas
              </div>
              <div className="text-2xl font-display text-foreground">{stats.total_rounds}</div>
            </div>

            <div className="bg-secondary/50 backdrop-blur-sm rounded-xl p-2.5 border border-border/50">
              <div className="text-muted-foreground text-[10px] font-medium mb-1 uppercase tracking-wider">
                Total pts
              </div>
              <div className="text-2xl font-display text-primary">{stats.extra_points}</div>
            </div>

            <div className="bg-secondary/50 backdrop-blur-sm rounded-xl p-2.5 border border-border/50">
              <div className="text-muted-foreground text-[10px] font-medium mb-1 uppercase tracking-wider">
                Promedio
              </div>
              <div className="text-2xl font-display text-accent">
                {Number(stats.avg_points).toFixed(1)}
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="border-t border-border/50"></div>

          {/* All captains used - scrollable list */}
          <div className="flex flex-col flex-grow min-h-0">
            <div className="flex items-baseline justify-between mb-2">
              <div className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                Todos los Capitanes
              </div>
              <div className="text-muted-foreground/70 text-[9px]">Puntos sin duplicar (1x)</div>
            </div>
            <div className="overflow-y-auto max-h-[320px] custom-scrollbar pr-1 flex-1">
              <div className="divide-y divide-border/50">
                {stats.most_used?.map((captain, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs px-1 py-3 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-muted-foreground/50 font-sans text-[10px] w-5">
                        {idx + 1}.
                      </span>
                      <Link
                        href={`/player/${captain.player_id}`}
                        className="text-foreground truncate font-medium hover:text-primary transition-colors block"
                      >
                        {captain.name}
                      </Link>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                      <div className="text-right">
                        <div className="text-primary font-display text-sm">
                          {captain.times_captain}x
                        </div>
                        <div className="text-muted-foreground/70 text-[9px] uppercase tracking-tighter">
                          {captain.times_captain === 1 ? 'vez' : 'veces'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-emerald-500 font-display text-sm">
                          {Number(captain.avg_as_captain).toFixed(1)}
                        </div>
                        <div className="text-muted-foreground/70 text-[9px] uppercase tracking-tighter">
                          media
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-accent font-display text-sm">
                          {captain.total_as_captain}
                        </div>
                        <div className="text-muted-foreground/70 text-[9px] uppercase tracking-tighter">
                          total
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="border-t border-border/50"></div>

          {/* Best/Worst - more compact */}
          <div className="grid grid-cols-2 gap-2 mt-auto">
            <div className="bg-secondary/50 backdrop-blur-sm rounded-xl p-2.5 border border-border/50">
              <div className="text-muted-foreground text-[10px] font-medium mb-1 uppercase tracking-wider">
                Mejor
              </div>
              {stats.best_round?.name && (
                <div className="text-xs font-sans text-muted-foreground mb-1 truncate">
                  {stats.best_round.name}
                </div>
              )}
              <div className="text-xl font-display text-emerald-500 tracking-wider">
                {stats.best_round?.points || 0} pts
              </div>
            </div>

            <div className="bg-secondary/50 backdrop-blur-sm rounded-xl p-2.5 border border-border/50">
              <div className="text-muted-foreground text-[10px] font-medium mb-1 uppercase tracking-wider">
                Peor
              </div>
              {stats.worst_round?.name && (
                <div className="text-xs font-sans text-muted-foreground mb-1 truncate">
                  {stats.worst_round.name}
                </div>
              )}
              <div className="text-xl font-display text-red-500 tracking-wider">
                {stats.worst_round?.points || 0} pts
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
