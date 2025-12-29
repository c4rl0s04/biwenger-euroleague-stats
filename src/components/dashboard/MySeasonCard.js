'use client';

import { useClientUser } from '@/lib/hooks/useClientUser';
import { Trophy, TrendingUp, TrendingDown, Target, Zap } from 'lucide-react';
import { PremiumCard } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';

/**
 * MySeasonCard - Redesigned with Bento Grid architecture
 * Zone 1: Hero stats (Position + Points)
 * Zone 2: Performance metrics (Best/Worst, Average)
 */
export default function MySeasonCard() {
  const { currentUser, isReady } = useClientUser();

  const { data: stats, loading } = useApiData(
    () => (currentUser ? `/api/player/stats?userId=${currentUser.id}` : null),
    {
      transform: (d) => d?.stats || d,
      dependencies: [currentUser?.id],
      skip: !currentUser,
    }
  );

  if (!isReady) return null;

  const getPositionColor = (pos) => {
    if (pos === 1) return 'text-yellow-400';
    if (pos <= 3) return 'text-primary';
    return 'text-foreground';
  };

  return (
    <PremiumCard title="Tu Temporada" icon={Trophy} color="emerald" loading={loading}>
      {!loading && stats && (
        <div className="flex flex-col h-full flex-1">
          {/* Zone 1: Hero Stats - Position & Points */}
          <div className="flex gap-6 items-end mb-6">
            {/* Position - Primary Hero */}
            <div className="flex-1">
              <div className="text-muted-foreground text-s font-medium uppercase tracking-wider mb-1">
                Posición
              </div>
              <div className={`text-6xl font-display ${getPositionColor(stats.position)}`}>
                #{stats.position}
              </div>
            </div>

            {/* Points - Secondary Hero */}
            <div className="text-right">
              <div className="text-muted-foreground text-s font-medium uppercase tracking-wider mb-1">
                Puntos
              </div>
              <div className="text-6xl font-display text-foreground">
                {stats.total_points?.toLocaleString('es-ES')}
              </div>
            </div>
          </div>

          {/* Zone 2: Performance Grid - fills remaining space */}
          <div className="grid grid-cols-2 gap-3 flex-1">
            {/* Best Position */}
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs uppercase tracking-wider mb-1">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                Mejor Pos.
              </div>
              <div className="text-2xl font-display text-emerald-500">
                #{stats.best_position || '-'}
              </div>
            </div>

            {/* Worst Position */}
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs uppercase tracking-wider mb-1">
                <TrendingDown className="w-3 h-3 text-red-500" />
                Peor Pos.
              </div>
              <div className="text-2xl font-display text-red-500">
                #{stats.worst_position || '-'}
              </div>
            </div>

            {/* Best Round */}
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs uppercase tracking-wider mb-1">
                <Zap className="w-3 h-3 text-emerald-500" />
                Mejor Jornada
              </div>
              <div className="text-xl font-display text-emerald-500">{stats.best_round} pts</div>
            </div>

            {/* Worst Round */}
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs uppercase tracking-wider mb-1">
                <Target className="w-3 h-3 text-red-500" />
                Peor Jornada
              </div>
              <div className="text-xl font-display text-red-500">{stats.worst_round} pts</div>
            </div>
          </div>

          {/* Footer: Average */}
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center justify-between">
              <div className="text-muted-foreground text-xs uppercase tracking-wider">
                Promedio por jornada
              </div>
              <div className="text-2xl font-display text-primary">{stats.average_points} pts</div>
            </div>
            <div className="text-muted-foreground text-[10px] mt-2 text-right">
              {stats.rounds_played} jornadas jugadas
            </div>
          </div>
        </div>
      )}
    </PremiumCard>
  );
}
