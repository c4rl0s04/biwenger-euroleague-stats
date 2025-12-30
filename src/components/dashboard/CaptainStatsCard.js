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
            <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-2.5 border border-slate-700/30">
              <div className="text-slate-400 text-[10px] font-medium mb-1 uppercase tracking-wider">
                Jornadas
              </div>
              <div className="text-xl font-bold text-foreground/90">{stats.total_rounds}</div>
            </div>

            <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-2.5 border border-slate-700/30">
              <div className="text-slate-400 text-[10px] font-medium mb-1 uppercase tracking-wider">
                Total pts
              </div>
              <div className="text-xl font-bold text-yellow-400">{stats.extra_points}</div>
            </div>

            <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-2.5 border border-slate-700/30">
              <div className="text-slate-400 text-[10px] font-medium mb-1 uppercase tracking-wider">
                Promedio
              </div>
              <div className="text-xl font-bold text-orange-400">{stats.avg_points.toFixed(1)}</div>
            </div>
          </div>

          {/* Separator */}
          <div className="border-t border-border/50"></div>

          {/* All captains used - scrollable list */}
          <div className="flex-grow min-h-0">
            <div className="flex items-baseline justify-between mb-2">
              <div className="text-slate-400 text-xs font-medium uppercase tracking-wider">
                Todos los Capitanes
              </div>
              <div className="text-slate-500 text-[9px]">Puntos sin duplicar (1x)</div>
            </div>
            <div className="space-y-1.5 pr-1">
              {stats.most_used?.map((captain, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs bg-slate-800/30 rounded-lg px-2.5 py-2 hover:bg-slate-800/50 transition-colors border border-slate-700/20"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-slate-500 font-mono text-[10px] w-5">{idx + 1}.</span>
                    <Link
                      href={`/player/${captain.player_id}`}
                      className="text-muted-foreground truncate font-medium hover:text-yellow-400 transition-colors block"
                    >
                      {captain.name}
                    </Link>
                  </div>
                  <div className="flex items-center gap-2.5 flex-shrink-0 ml-2">
                    <div className="text-right">
                      <div className="text-yellow-400 font-semibold">{captain.times_captain}x</div>
                      <div className="text-slate-500 text-[9px]">
                        {captain.times_captain === 1 ? 'vez' : 'veces'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-semibold">
                        {captain.avg_as_captain.toFixed(1)}
                      </div>
                      <div className="text-slate-500 text-[9px]">media</div>
                    </div>
                    <div className="text-right">
                      <div className="text-orange-400 font-semibold">
                        {captain.total_as_captain}
                      </div>
                      <div className="text-slate-500 text-[9px]">total</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Separator */}
          <div className="border-t border-border/50"></div>

          {/* Best/Worst - more compact */}
          <div className="grid grid-cols-2 gap-2 mt-auto">
            <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-2.5 border border-slate-700/30">
              <div className="text-slate-400 text-[10px] font-medium mb-1 uppercase tracking-wider">
                Mejor
              </div>
              {stats.best_round?.name && (
                <div className="text-xs font-medium text-muted-foreground mb-1 truncate">
                  {stats.best_round.name}
                </div>
              )}
              <div className="text-lg font-bold text-green-400">
                {stats.best_round?.points || 0} pts
              </div>
            </div>

            <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-2.5 border border-slate-700/30">
              <div className="text-slate-400 text-[10px] font-medium mb-1 uppercase tracking-wider">
                Peor
              </div>
              {stats.worst_round?.name && (
                <div className="text-xs font-medium text-muted-foreground mb-1 truncate">
                  {stats.worst_round.name}
                </div>
              )}
              <div className="text-lg font-bold text-red-400">
                {stats.worst_round?.points || 0} pts
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
