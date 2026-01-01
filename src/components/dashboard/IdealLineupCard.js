'use client';

import { Crown } from 'lucide-react';
import { getScoreColor } from '@/lib/utils/format';
import { Card } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';
import DashboardPlayerRow from './shared/DashboardPlayerRow';

export default function IdealLineupCard() {
  const { data, loading } = useApiData('/api/dashboard/ideal-lineup');

  const getPositionConfig = (position) => {
    const pos = position?.toLowerCase() || '';
    if (pos.includes('base')) return { color: 'border-blue-500 text-blue-500', letter: 'B' };
    if (pos.includes('alero')) return { color: 'border-green-500 text-green-500', letter: 'A' };
    if (pos.includes('pivot') || pos.includes('pívot')) return { color: 'border-red-500 text-red-500', letter: 'P' };
    return { color: 'border-gray-500 text-gray-500', letter: '?' };
  };

  const { lineup, total_points, round_name } = data || { lineup: [], total_points: 0 };

  const headerInfo = (
    <div className="flex items-baseline justify-end gap-2">
      <span className="text-2xl font-bold text-foreground leading-none">
        {total_points}
      </span>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium whitespace-nowrap">
        {round_name}
      </span>
    </div>
  );

  return (
    <Card
      title="Quinteto Ideal"
      icon={Crown}
      color="indigo"
      loading={loading}
      actionRight={data ? headerInfo : null}
      className="card-glow"
    >
      <div className="flex flex-col">
        {!loading && lineup && lineup.length > 0 ? (
          lineup.map((player) => {
            const { color, letter } = getPositionConfig(player.position);
            
            return (
              <DashboardPlayerRow
                key={player.player_id}
                playerId={player.player_id}
                name={player.name}
                team={player.team}
                owner={player.owner_name}
                avatar={
                  <div className={`w-10 h-10 rounded-full overflow-hidden border-2 ${color} bg-secondary flex items-center justify-center`}>
                    <img
                      src={player.img}
                      alt={player.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // FIX: Save reference to parent BEFORE modifying innerText
                        const parent = e.target.parentNode;
                        e.target.style.display = 'none';
                        parent.innerText = letter;
                        parent.classList.add('font-bold', 'text-lg');
                      }}
                    />
                  </div>
                }
                rightContent={
                  <span className={`text-sm font-bold px-2 py-0.5 rounded-md ${getScoreColor(player.points)}`}>
                    {player.points}
                  </span>
                }
              />
            );
          })
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