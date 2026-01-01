'use client';

import { Crown } from 'lucide-react';
import Link from 'next/link';
import { getScoreColor, getShortTeamName } from '@/lib/utils/format';
import { Card } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';

export default function IdealLineupCard() {
  const { data, loading } = useApiData('/api/dashboard/ideal-lineup');

  // Helper for styles based on position
  const getPositionStyles = (position) => {
    const pos = position?.toLowerCase() || '';
    if (pos.includes('base'))
      return {
        label: 'B',
        bg: 'bg-blue-600',
        border: 'border-blue-500',
        text: 'text-white',
        ring: 'ring-blue-500/30',
      };
    if (pos.includes('alero'))
      return {
        label: 'A',
        bg: 'bg-green-600',
        border: 'border-green-500',
        text: 'text-white',
        ring: 'ring-green-500/30',
      };
    if (pos.includes('pivot') || pos.includes('pívot'))
      return {
        label: 'P',
        bg: 'bg-red-600',
        border: 'border-red-500',
        text: 'text-white',
        ring: 'ring-red-500/30',
      };

    // Fallback
    return {
      label: pos.charAt(0).toUpperCase(),
      bg: 'bg-secondary',
      border: 'border-border',
      text: 'text-muted-foreground',
      ring: 'ring-border/30',
    };
  };

  const { lineup, total_points, round_name } = data || { lineup: [], total_points: 0 };

  const headerInfo = (
    <div className="text-right">
      <div className="text-2xl font-bold text-foreground">{total_points}</div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{round_name}</div>
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
      {!loading && lineup && lineup.length > 0 ? (
        <div className="flex-1 flex flex-col justify-between gap-0 relative z-10">
          {lineup.map((player) => {
            const style = getPositionStyles(player.position);

            return (
              <div
                key={player.player_id}
                className="flex items-center gap-4 py-3 border-b border-border/50 last:border-0 group/item transition-colors"
              >
                <div className="relative shrink-0">
                  <div
                    className={`w-10 h-10 rounded-full overflow-hidden border-2 ${style.border} bg-secondary flex items-center justify-center shadow-sm ${style.ring}`}
                  >
                    <img
                      src={player.img}
                      alt={player.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const parent = e.target.parentNode;
                        parent.classList.remove('bg-secondary');
                        parent.classList.add(...style.bg.split(' '));
                        parent.innerHTML = `<span class="font-bold text-lg ${style.text}">${style.label}</span>`;
                      }}
                    />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <Link
                    href={`/player/${player.player_id}`}
                    className="font-medium text-foreground text-sm hover:text-indigo-400 transition-colors truncate block"
                  >
                    {player.name}
                  </Link>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <span>{getShortTeamName(player.team)}</span>
                    {player.owner_name && (
                      <span className="text-indigo-300 truncate text-[11px] ml-1">
                        👤 {player.owner_name}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`text-sm font-bold px-2 py-0.5 rounded-md ${getScoreColor(player.points)}`}
                  >
                    {player.points}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        !loading && (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            No hay datos disponibles
          </div>
        )
      )}
    </Card>
  );
}
