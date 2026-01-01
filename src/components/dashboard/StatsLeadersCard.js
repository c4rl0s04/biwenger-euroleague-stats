'use client';

import { useState } from 'react';
import { BarChart2, Filter } from 'lucide-react';
import { Card } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';
import DashboardPlayerRow from './shared/DashboardPlayerRow';

export default function StatsLeadersCard() {
  const [statType, setStatType] = useState('points'); // Default: Real Points

  // Configuration for the different stats
  const statConfig = {
    points: { label: 'Puntos Reales', unit: 'pts', color: 'text-orange-400', query: 'real_points' },
    rebounds: { label: 'Rebotes', unit: 'reb', color: 'text-blue-400', query: 'rebounds' },
    assists: { label: 'Asistencias', unit: 'ast', color: 'text-green-400', query: 'assists' },
    pir: { label: 'Valoración', unit: 'val', color: 'text-purple-400', query: 'pir' },
  };

  const currentConfig = statConfig[statType];

  // Fetch data based on the selected stat
  // API URL example: /api/stats/leaders?type=rebounds
  const { data: leaders = [], loading } = useApiData(`/api/stats/leaders?type=${currentConfig.query}`, {
    dependencies: [statType] // Re-fetch when statType changes
  });

  // The dropdown selector for the card header
  const statSelector = (
    <div className="relative">
      <Filter className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
      <select
        value={statType}
        onChange={(e) => setStatType(e.target.value)}
        className="appearance-none pl-7 pr-8 py-1 bg-secondary border border-border rounded-lg text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-primary cursor-pointer hover:bg-secondary/80 transition-colors"
      >
        <option value="points">Puntos</option>
        <option value="rebounds">Rebotes</option>
        <option value="assists">Asistencias</option>
        <option value="pir">Valoración</option>
      </select>
    </div>
  );

  return (
    <Card
      title="Líderes por Estadística"
      icon={BarChart2}
      color="cyan"
      loading={loading}
      actionRight={statSelector}
      className="card-glow"
    >
      <div className="flex flex-col">
        {!loading && leaders && leaders.length > 0 ? (
          leaders.map((player, index) => (
            <DashboardPlayerRow
              key={`${statType}-${player.player_id}`}
              playerId={player.player_id}
              name={player.name}
              team={player.team}
              owner={player.owner_name}
              // AVATAR: Simple Rank Number
              avatar={
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-secondary border border-border font-bold text-sm text-muted-foreground">
                  {index + 1}
                </div>
              }
              // STATS: Dynamic Value based on selection
              rightContent={
                <div className="text-right">
                  <div className={`font-bold text-base ${currentConfig.color}`}>
                    {player.value}
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase">
                    {currentConfig.unit}
                  </div>
                </div>
              }
            />
          ))
        ) : (
          !loading && (
            <div className="text-center text-muted-foreground py-8">
              No hay datos disponibles
            </div>
          )
        )}
      </div>
    </Card>
  );
}