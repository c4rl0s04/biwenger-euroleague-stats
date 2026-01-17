'use client';

import PropTypes from 'prop-types';
import { Flame, Snowflake, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { Card, AnimatedNumber } from '@/components/ui';
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
        {!loading && players.length > 0 ? (
          players.map((player) => (
            <DashboardPlayerRow
              key={player.player_id}
              playerId={player.player_id}
              name={player.name}
              team={player.team}
              owner={player.owner_name}
              ownerId={player.owner_id}
              ownerColorIndex={player.owner_color_index}
              color={cfg.color}
              avatar={
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center bg-${cfg.color}-500/10 text-${cfg.color}-400 border border-${cfg.color}-500/20`}
                >
                  <TrendIcon size={20} />
                </div>
              }
              rightContent={
                <div className="flex flex-col items-end">
                  <div
                    className={`font-bold text-base ${
                      cfg.color === 'orange' ? 'text-orange-400' : 'text-blue-400'
                    }`}
                  >
                    {player.avg_diff > 0 ? '+' : ''}
                    <AnimatedNumber
                      value={parseFloat(player.avg_diff) || 0}
                      decimals={1}
                      duration={0.8}
                    />{' '}
                    pts
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Diferencia
                  </div>
                </div>
              }
            />
          ))
        ) : (
          <div className="text-center text-muted-foreground py-8">{cfg.emptyMessage}</div>
        )}
      </div>
    </Card>
  );
}
