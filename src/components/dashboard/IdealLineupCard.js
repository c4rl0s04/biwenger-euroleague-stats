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
      bg: 'bg-slate-700',
      border: 'border-slate-600',
      text: 'text-slate-300',
      ring: 'ring-slate-500/30',
    };
  };

  const { lineup, total_points, round_name } = data || { lineup: [], total_points: 0 };

  const headerInfo = (
    <div className="text-right">
      <div className="text-2xl font-bold text-white">{total_points}</div>
      <div className="text-[10px] text-slate-400 uppercase tracking-wider">{round_name}</div>
    </div>
  );

  return (
    <Card
      title="Quinteto Ideal"
      icon={Crown}
      color="indigo"
      loading={loading}
      actionRight={data ? headerInfo : null}
    >
      {!loading && lineup && lineup.length > 0 ? (
        <div className="flex-1 flex flex-col justify-between gap-2 relative z-10">
          {lineup.map((player) => {
            const style = getPositionStyles(player.position);

            return (
              <div
                key={player.player_id}
                className="p-2 bg-slate-800/40 rounded-lg border border-slate-700/30 hover:bg-slate-800/60 transition-all flex items-center gap-3"
              >
                <div className="relative shrink-0">
                  {/* Large Circle with Position Style */}
                  <div
                    className={`w-11 h-11 rounded-full overflow-hidden border-2 ${style.border} bg-slate-800 flex items-center justify-center shadow-sm ${style.ring}`}
                  >
                    <img
                      src={player.img}
                      alt={player.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const parent = e.target.parentNode;
                        parent.classList.remove('bg-slate-800');
                        parent.classList.add(...style.bg.split(' '));
                        parent.innerHTML = `<span class="font-bold text-lg ${style.text}">${style.label}</span>`;
                      }}
                    />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <Link
                    href={`/player/${player.player_id}`}
                    className="font-medium text-white text-sm hover:text-indigo-400 transition-colors truncate block"
                  >
                    {player.name}
                  </Link>
                  <div className="flex flex-col gap-0.5 text-xs text-slate-400 mt-0.5">
                    <span>{getShortTeamName(player.team)}</span>
                    {player.owner_name && (
                      <span className="text-indigo-300 truncate text-[11px]">
                        👤 {player.owner_name}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`text-sm font-bold px-2.5 py-1 rounded-md ${getScoreColor(player.points)}`}
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
          <div className="flex-1 flex items-center justify-center text-slate-500">
            No hay datos disponibles
          </div>
        )
      )}
    </Card>
  );
}
