'use client';

import { useState, useMemo, useCallback } from 'react';
import { BarChart2 } from 'lucide-react';
import { Card, AnimatedNumber } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';
import DashboardPlayerRow from './shared/DashboardPlayerRow';

export default function StatsLeadersCard() {
  const [statType, setStatType] = useState('points');
  const [isAnimating, setIsAnimating] = useState(false);
  // Track which type we're displaying (persists old data during animation)
  const [displayedType, setDisplayedType] = useState('points');

  // Configuration for the different stats with short labels for pills
  const statConfig = useMemo(
    () => ({
      points: {
        label: 'Puntos Reales',
        shortLabel: 'PTS',
        unit: 'pts',
        color: 'text-orange-400',
        bgActive: 'bg-orange-500/20 border-orange-500/50',
        query: 'real_points',
      },
      rebounds: {
        label: 'Rebotes',
        shortLabel: 'REB',
        unit: 'reb',
        color: 'text-blue-400',
        bgActive: 'bg-blue-500/20 border-blue-500/50',
        query: 'rebounds',
      },
      assists: {
        label: 'Asistencias',
        shortLabel: 'AST',
        unit: 'ast',
        color: 'text-green-400',
        bgActive: 'bg-green-500/20 border-green-500/50',
        query: 'assists',
      },
      pir: {
        label: 'Valoración',
        shortLabel: 'VAL',
        unit: 'val',
        color: 'text-purple-400',
        bgActive: 'bg-purple-500/20 border-purple-500/50',
        query: 'pir',
      },
    }),
    []
  );

  const currentConfig = statConfig[statType];
  const displayConfig = statConfig[displayedType];

  // Fetch data based on the selected stat
  const { data: leaders = [], loading } = useApiData(
    `/api/stats/leaders?type=${currentConfig.query}`,
    {
      dependencies: [statType],
    }
  );

  // Handle smooth transition when stat type changes
  const handleStatChange = useCallback(
    (newType) => {
      if (newType === statType || isAnimating) return;

      // Start fade out animation
      setIsAnimating(true);

      // After fade out, switch to new stat type
      setTimeout(() => {
        setStatType(newType);
        setDisplayedType(newType);
        // Fade back in after a brief moment
        setTimeout(() => setIsAnimating(false), 100);
      }, 200);
    },
    [statType, isAnimating]
  );

  // Elegant pill button selector
  const statSelector = (
    <div className="flex gap-1">
      {Object.entries(statConfig).map(([key, config]) => {
        const isActive = statType === key;
        return (
          <button
            key={key}
            onClick={() => handleStatChange(key)}
            disabled={isAnimating}
            className={`
              px-2 py-1 text-[10px] font-semibold rounded-md border
              transition-all duration-200 ease-out
              ${
                isActive
                  ? `${config.bgActive} ${config.color}`
                  : 'bg-transparent border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary'
              }
              ${isAnimating ? 'pointer-events-none' : ''}
            `}
          >
            {config.shortLabel}
          </button>
        );
      })}
    </div>
  );

  // Only show initial loading skeleton on very first load
  const showInitialLoading = loading && leaders.length === 0 && !isAnimating;

  return (
    <Card
      title="Líderes por Estadística"
      icon={BarChart2}
      color="cyan"
      loading={showInitialLoading}
      actionRight={statSelector}
      className="card-glow"
    >
      <div
        className={`
          flex flex-col transition-opacity duration-200 ease-out
          ${isAnimating ? 'opacity-0' : 'opacity-100'}
        `}
      >
        {leaders.length > 0
          ? leaders.map((player, index) => (
              <DashboardPlayerRow
                key={`${displayedType}-${player.player_id}`}
                playerId={player.player_id}
                name={player.name}
                team={player.team}
                owner={player.owner_name}
                avatar={
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-secondary border border-border font-bold text-sm text-muted-foreground">
                    {index + 1}
                  </div>
                }
                rightContent={
                  <div className="flex items-center gap-4 text-right">
                    {/* Total with stat name */}
                    <div>
                      <div className={`font-bold text-base ${displayConfig.color}`}>
                        <AnimatedNumber value={player.value} duration={0.8} />
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {displayConfig.label}
                      </div>
                    </div>
                    {/* Average per game */}
                    <div>
                      <div className="font-bold text-base text-foreground">
                        <AnimatedNumber value={player.avg_value} decimals={1} duration={0.8} />
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Promedio
                      </div>
                    </div>
                    {/* Games played */}
                    <div>
                      <div className="font-bold text-base text-foreground">
                        <AnimatedNumber value={player.games_played} duration={0.8} />
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Partidos
                      </div>
                    </div>
                  </div>
                }
              />
            ))
          : !showInitialLoading && (
              <div className="text-center text-muted-foreground py-8">No hay datos disponibles</div>
            )}
      </div>
    </Card>
  );
}
