'use client';
import PropTypes from 'prop-types';
import { Flame, Snowflake, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import { Card, AnimatedNumber } from '@/components/ui';
import { EmptyState } from '@/components/ui/foundation';
import { InfoTooltip, TooltipHeader } from '@/components/ui/Tooltip';
import { useApiData } from '@/lib/hooks/useApiData';

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

  const { data: players = [], loading } = useApiData('/api/player/streaks', {
    transform: (d) => d?.[cfg.dataKey] || [],
    dependencies: [cfg.dataKey],
  });

  const listItems = !loading && players.length > 0 ? players : [];

  return (
    <Card
      title={cfg.title}
      icon={cfg.icon}
      color={cfg.color}
      loading={loading}
      info={
        <div className="text-left">
          <TooltipHeader className={`!text-${cfg.color}-400`}>{cfg.tooltipTitle}</TooltipHeader>
          <div className="text-muted-foreground">
            Comparativa entre la media de las últimas 5 jornadas y la media de la temporada.
          </div>
        </div>
      }
      className="card-glow"
    >
      <div className="flex flex-col flex-1 pb-1">
        {listItems.length ? (
          <ul className="m-0 list-none divide-y divide-border/50 p-0" data-stat-list="streak">
            {listItems.map((player, index) => {
              return (
                <li key={player.id} className="flex min-w-0 items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 w-full">
                      <div
                        className={`w-10 h-10 rounded-full flex shrink-0 items-center justify-center bg-${cfg.color}-500/10 text-${cfg.color}-400 border border-${cfg.color}-500/20`}
                      >
                        <TrendIcon size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/player/${player.id}`}
                          className={`font-bold text-foreground text-sm truncate hover:text-${cfg.color}-400 transition-colors`}
                        >
                          {player.name}
                        </Link>
                        <div className="text-xs text-muted-foreground truncate">
                          {player.team}{' '}
                          {/* Owner info could be added if color index logic imported */}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 text-right tabular-nums">
                    <div className="flex flex-col items-end whitespace-nowrap">
                      <div
                        className={`font-bold text-base ${
                          cfg.color === 'orange'
                            ? 'text-[color-mix(in_srgb,var(--color-orange-400)_55%,hsl(var(--content-primary)))]'
                            : 'text-[color-mix(in_srgb,var(--color-blue-400)_55%,hsl(var(--content-primary)))]'
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
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState>{cfg.emptyMessage}</EmptyState>
        )}
      </div>
    </Card>
  );
}
