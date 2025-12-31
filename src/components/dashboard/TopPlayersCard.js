'use client';

import { TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { getScoreColor, getShortTeamName } from '@/lib/utils/format';
import { Card } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';

export default function TopPlayersCard() {
  const { data: topPlayers = [], loading } = useApiData('/api/dashboard/top-players');

  const actionLink = (
    <Link href="/players" className="text-sm text-emerald-400 hover:text-emerald-300">
      Ver todos
    </Link>
  );

  return (
    <Card
      title="Top Jugadores"
      icon={TrendingUp}
      color="emerald"
      loading={loading}
      actionRight={actionLink}
    >
      <div className="space-y-4">
        {topPlayers.length > 0 ? (
          topPlayers.map((player, index) => {
            const getRankStyles = (idx) => {
              if (idx === 0)
                return {
                  rank: 'bg-yellow-500 text-slate-900 border-yellow-400',
                  hoverText: 'hover:text-yellow-400',
                };
              if (idx === 1)
                return {
                  rank: 'bg-slate-300 text-slate-900 border-slate-200',
                  hoverText: 'hover:text-slate-300',
                };
              if (idx === 2)
                return {
                  rank: 'bg-amber-700 text-white border-amber-600', // Bronze
                  hoverText: 'hover:text-amber-600',
                };
              return {
                rank: 'bg-secondary text-foreground border-border',
                hoverText: 'hover:text-primary',
              };
            };

            const styles = getRankStyles(index);

            return (
              <div
                key={player.id}
                className="flex items-center gap-4 py-3 border-b border-border/50 last:border-0 group/item"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border ${styles.rank} shrink-0`}
                >
                  {index + 1}
                </div>
                <div className="flex-grow min-w-0">
                  <Link
                    href={`/player/${player.id}`}
                    className={`font-medium truncate transition-colors block ${styles.hoverText} ${index < 3 ? 'text-foreground' : 'text-muted-foreground'}`}
                  >
                    {player.name}
                  </Link>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="text-xs text-muted-foreground truncate">
                      {getShortTeamName(player.team)}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-sm text-foreground">{player.points} pts</div>
                  <div className="text-[10px] text-muted-foreground">Avg: {player.average}</div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center text-muted-foreground py-8">No hay datos disponibles</div>
        )}
      </div>
    </Card>
  );
}
