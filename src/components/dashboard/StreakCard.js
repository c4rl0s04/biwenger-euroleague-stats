'use client';

import PropTypes from 'prop-types';
import { Flame, Snowflake, TrendingUp, TrendingDown, Info } from 'lucide-react';
import Link from 'next/link';
import { getShortTeamName } from '@/lib/utils/format';
import { Card } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';

/**
 * Unified Streak Card Component
 * Displays players on hot or cold streaks based on type prop
 *
 * @param {'hot' | 'cold'} type - Type of streaks to display
 */
export default function StreakCard({ type = 'hot' }) {
  // Configuration based on streak type
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

  const { data: players, loading } = useApiData('/api/player/streaks', {
    transform: (d) => d?.[cfg.dataKey] || [],
    dependencies: [cfg.dataKey],
  });

  const infoTooltip = (
    <div className="group/info relative">
      <Info
        className={`w-4 h-4 text-muted-foreground hover:text-${cfg.color}-400 cursor-help transition-colors`}
      />
      <div className="absolute right-0 top-6 w-64 bg-popover border border-border text-muted-foreground text-xs rounded-lg p-3 shadow-xl opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all z-50">
        <p className={`mb-2 font-semibold text-${cfg.color}-400`}>{cfg.tooltipTitle}</p>
        Comparativa entre la media de las últimas 5 jornadas (mín. 3 jugados) y la media de la
        temporada.
        <div className="mt-2 text-muted-foreground border-t border-border pt-2">
          Se requiere un {cfg.tooltipDesc} superior al <span className="text-foreground">20%</span>.
        </div>
      </div>
    </div>
  );

  const TrendIcon = cfg.TrendIcon;

  return (
    <Card
      title={cfg.title}
      icon={cfg.icon}
      color={cfg.color}
      loading={loading}
      actionRight={infoTooltip}
    >
      {!loading && (
        <div className="flex-1 flex flex-col justify-between gap-2">
          {players && players.length > 0 ? (
            players.map((player) => (
              <div
                key={player.player_id}
                className={`p-3 bg-secondary/40 rounded-lg border border-border/30 hover:border-${cfg.color}-600/50 transition-all`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/player/${player.player_id}`}
                      className={`font-medium text-foreground text-sm hover:text-${cfg.color}-400 transition-colors block`}
                    >
                      {player.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {getShortTeamName(player.team)} · {player.position}
                    </div>
                    {player.owner_name && (
                      <div className="text-xs text-blue-400">👤 {player.owner_name}</div>
                    )}
                  </div>
                  <div className="text-right ml-3">
                    <div
                      className={`flex items-center gap-1 text-sm font-bold text-${cfg.color}-400`}
                    >
                      <TrendIcon className="w-4 h-4" />
                      {Math.abs(player.trend_pct)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {player.recent_avg.toFixed(1)} pts/g
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-8">{cfg.emptyMessage}</div>
          )}
        </div>
      )}
    </Card>
  );
}

StreakCard.propTypes = {
  /** Type of streaks to display: 'hot' for positive, 'cold' for negative */
  type: PropTypes.oneOf(['hot', 'cold']),
};
