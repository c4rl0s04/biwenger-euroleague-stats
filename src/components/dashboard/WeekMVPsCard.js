'use client';

import { Trophy, Award } from 'lucide-react';
import Link from 'next/link';
import { getShortTeamName } from '@/lib/utils/format';
import { Card } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';

export default function WeekMVPsCard() {
  const { data: mvps = [], loading } = useApiData('/api/dashboard/mvps');

  const getRankStyles = (index) => {
    switch (index) {
      case 0: // Gold
        return {
          container: 'bg-yellow-500/10 border-yellow-500/30 hover:border-yellow-500/50',
          badge: 'bg-yellow-500 text-slate-900',
          text: 'text-yellow-400',
          hoverText: 'hover:text-yellow-400',
        };
      case 1: // Silver
        return {
          container: 'bg-slate-300/10 border-slate-300/30 hover:border-slate-300/50',
          badge: 'bg-slate-300 text-slate-900',
          text: 'text-slate-300',
          hoverText: 'hover:text-slate-300',
        };
      case 2: // Bronze
        return {
          container: 'bg-orange-600/10 border-orange-600/30 hover:border-orange-600/50',
          badge: 'bg-orange-600 text-white',
          text: 'text-orange-400',
          hoverText: 'hover:text-orange-400',
        };
      default:
        return {
          container: 'bg-secondary/40 border-border/30 hover:border-border/50',
          badge: 'bg-secondary text-muted-foreground',
          text: 'text-green-400',
          hoverText: 'hover:text-blue-400',
        };
    }
  };

  return (
    <Card
      title="MVPs Última Jornada"
      icon={Trophy}
      color="yellow"
      loading={loading}
      className="card-glow"
    >
      {!loading && (
        <div className="flex-1 flex flex-col justify-between gap-0 relative z-10">
          {mvps && mvps.length > 0 ? (
            mvps.map((player, index) => {
              const styles = getRankStyles(index);
              return (
                <div
                  key={player.player_id}
                  className="flex items-center gap-4 py-3 border-b border-border/50 last:border-0 group/item transition-colors"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 border ${styles.badge}`}
                  >
                    {index <= 2 ? <Award className="w-4 h-4" /> : index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/player/${player.player_id}`}
                      className={`font-medium text-foreground text-sm transition-colors block ${styles.hoverText}`}
                    >
                      {player.name}
                    </Link>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <span>{getShortTeamName(player.team)}</span>
                      <span>·</span>
                      <span>{player.position}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`font-bold text-sm ${styles.text}`}>{player.points} pts</div>
                    {player.owner_name && (
                      <div className="text-xs text-blue-400">👤 {player.owner_name}</div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              No hay datos de la última jornada
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
