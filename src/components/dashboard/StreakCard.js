'use client';

import PropTypes from 'prop-types';
import { Flame, Snowflake, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { Card } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';
import DashboardPlayerRow from './shared/DashboardPlayerRow';

export default function StreakCard({ type = 'hot' }) {
  const config = {
    hot: {
      title: 'En Racha',
      icon: Flame,
      color: 'orange',
      TrendIcon: TrendingUp,
      tooltipTitle: 'Criterio de Racha:',
      tooltipDesc: 'mejora',
      emptyMessage: 'No hay jugadores en racha',
      dataKey: 'hot',
    },
    cold: {
      title: 'Rachas Negativas',
      icon: Snowflake,
      color: 'blue',
      TrendIcon: TrendingDown,
      tooltipTitle: 'Criterio de Bache:',
      tooltipDesc: 'empeoramiento',
      emptyMessage: 'No hay jugadores en bache',
      dataKey: 'cold',
    },
  };

  const cfg = config[type] || config.hot;
  const TrendIcon = cfg.TrendIcon;

  const { data: players, loading } = useApiData('/api/player/streaks', {
    transform: (d) => d?.[cfg.dataKey] || [],
    dependencies: [cfg.dataKey],
  });

  const infoTooltip = (
    <div className="group/info relative">
      <Info className={`w-4 h-4 text-muted-foreground hover:text-${cfg.color}-400 cursor-help`} />
      <div className="absolute right-0 top-6 w-64 bg-popover border border-border text-muted-foreground text-xs rounded-lg p-3 shadow-xl opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all z-50">
        <p className={`mb-2 font-semibold text-${cfg.color}-400`}>{cfg.tooltipTitle}</p>
        Comparativa entre la media de las últimas 5 jornadas y la media de la temporada.
      </div>
    </div>
  );

  return (
    <Card
      title={cfg.title}
      icon={cfg.icon}
      color={cfg.color}
      loading={loading}
      actionRight={infoTooltip}
      className="card-glow"
    >
      <div className="flex flex-col">
        {!loading && players && players.length > 0
          ? players.map((player) => (
              <DashboardPlayerRow
                key={player.player_id}
                playerId={player.player_id}
                name={player.name}
                team={player.team}
                teamId={player.team_id}
                owner={player.owner_name}
                ownerId={player.owner_id}
                color={cfg.color}
                // AVATAR: Glowing Icon (Flame or Snowflake)
                avatar={
                  <div className="relative w-10 h-10 flex items-center justify-center">
                    <div
                      className={`absolute inset-0 rounded-full blur-md opacity-50 animate-pulse ${type === 'hot' ? 'bg-orange-500' : 'bg-blue-500'}`}
                    />
                    <div className="relative w-9 h-9 rounded-full bg-secondary flex items-center justify-center border border-border">
                      {type === 'hot' ? (
                        <Flame className="w-5 h-5 text-orange-500" />
                      ) : (
                        <Snowflake className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                  </div>
                }
                // STATS: Percentage + Avg
                rightContent={
                  <>
                    <div
                      className={`flex items-center justify-end gap-1 text-sm font-bold text-${cfg.color}-400`}
                    >
                      <TrendIcon className="w-3 h-3" />
                      {Math.abs(player.trend_pct)}%
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {player.recent_avg.toFixed(1)} pts
                    </div>
                  </>
                }
              />
            ))
          : !loading && (
              <div className="text-center text-muted-foreground py-8">{cfg.emptyMessage}</div>
            )}
      </div>
    </Card>
  );
}
