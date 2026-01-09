'use client';

import { TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { getScoreColor, getShortTeamName } from '@/lib/utils/format';
import { Card } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';
import { getColorForUser } from '@/lib/constants/colors';

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
      className="card-glow"
    >
      <div className="space-y-0">
        {topPlayers.length > 0 ? (
          topPlayers.slice(0, 5).map((player, index) => {
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
                  rank: 'bg-amber-700 text-white border-amber-600',
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
                className="flex items-center gap-4 py-3 border-b border-border/50 last:border-0 group/item transition-colors"
              >
                {/* Increased size to w-10 h-10 and text to text-base */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-bold border ${styles.rank} shrink-0`}
                >
                  {index + 1}
                </div>
                <div className="flex-grow min-w-0">
                  <Link
                    href={`/player/${player.id}`}
                    // Increased to text-base
                    className={`font-medium truncate transition-colors block text-base ${styles.hoverText} ${index < 3 ? 'text-foreground' : 'text-muted-foreground'}`}
                  >
                    {player.name}
                  </Link>
                  <div className="flex items-center gap-2 mt-0.5">
                    {/* Increased to text-sm */}
                    <Link
                      href={`/team/${player.team_id}`}
                      className="text-sm text-muted-foreground truncate hover:text-emerald-400 transition-colors"
                    >
                      {getShortTeamName(player.team)}
                    </Link>
                    {player.owner_name &&
                      (() => {
                        const color = getColorForUser(
                          player.owner_id,
                          player.owner_name,
                          player.owner_color_index
                        );
                        return (
                          <>
                            <span className="text-border mx-1">|</span>
                            <Link
                              href={`/user/${player.owner_id}`}
                              className={`text-xs truncate transition-colors ${color.text} hover:opacity-80`}
                            >
                              👤 {player.owner_name}
                            </Link>
                          </>
                        );
                      })()}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {/* Increased to text-base */}
                  <div className="font-bold text-base text-foreground">{player.points} pts</div>
                  {/* Increased to text-xs */}
                  <div className="text-xs text-muted-foreground">Avg: {player.average}</div>
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
