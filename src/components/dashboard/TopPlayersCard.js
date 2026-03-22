'use client';

'use client';

import { TrendingUp } from 'lucide-react';
import Link from 'next/link';

import { Card, AnimatedNumber, StatsList } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';
import { getColorForUser } from '@/lib/constants/colors';

export default function TopPlayersCard() {
  const { data: topPlayers = [], loading } = useApiData('/api/dashboard/top-players');

  const actionLink = (
    <Link href="/players" className="text-sm text-emerald-400 hover:text-emerald-300">
      Ver todos
    </Link>
  );

  const getRankStyles = (idx) => {
    if (idx === 0) return 'bg-yellow-500 text-slate-900 border-yellow-400';
    if (idx === 1) return 'bg-slate-300 text-slate-900 border-slate-200';
    if (idx === 2) return 'bg-amber-700 text-white border-amber-600';
    return 'bg-secondary text-foreground border-border';
  };

  const getTextStyles = (idx) => {
    if (idx === 0) return 'text-yellow-400';
    if (idx === 1) return 'text-slate-300';
    if (idx === 2) return 'text-amber-500';
    return 'text-emerald-400';
  };

  return (
    <Card
      title="Top Jugadores"
      icon={TrendingUp}
      color="emerald"
      loading={loading}
      actionRight={actionLink}
      className="card-glow"
    >
      <div className="flex flex-col flex-1 pb-1">
        <StatsList
          items={!loading && topPlayers.length > 0 ? topPlayers.slice(0, 5) : []}
          emptyMessage="No hay datos disponibles"
          renderLeft={(player, index) => (
            <div className="flex items-center gap-3 w-full">
              <div
                className={`w-10 h-10 rounded-full flex items-center shrink-0 justify-center font-bold text-sm border-2 ${getRankStyles(
                  index
                )}`}
              >
                {index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-foreground text-sm truncate">{player.name}</div>
                <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                  <span>{player.team}</span>
                  {player.owner_name && (
                    <>
                      <span>·</span>
                      {(() => {
                        const color = getColorForUser(
                          player.owner_id,
                          player.owner_name,
                          player.owner_color_index
                        );
                        return (
                          <span className={`${color.text} truncate font-medium`}>
                            👤 {player.owner_name}
                          </span>
                        );
                      })()}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          renderRight={(player, index) => (
            <div className="text-right whitespace-nowrap">
              <div className={`font-bold text-sm ${getTextStyles(index)}`}>
                <AnimatedNumber value={parseFloat(player.average)} decimals={1} duration={0.8} />{' '}
                pts
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Media
              </div>
            </div>
          )}
        />
      </div>
    </Card>
  );
}
