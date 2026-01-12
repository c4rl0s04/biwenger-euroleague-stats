'use client';

import { TrendingUp } from 'lucide-react';
import Link from 'next/link';

import { Card, AnimatedNumber } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';
import { getColorForUser } from '@/lib/constants/colors';
import DashboardPlayerRow from './shared/DashboardPlayerRow';

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
      <div className="flex flex-col">
        {!loading && topPlayers.length > 0 ? (
          topPlayers.slice(0, 5).map((player, index) => {
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
              <DashboardPlayerRow
                key={player.id}
                playerId={player.id}
                name={player.name}
                team={player.team}
                teamId={player.team_id}
                owner={player.owner_name}
                ownerId={player.owner_id}
                ownerColorIndex={player.owner_color_index}
                color="emerald"
                avatar={
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 ${getRankStyles(
                      index
                    )}`}
                  >
                    {index + 1}
                  </div>
                }
                rightContent={
                  <div className="text-right">
                    <div className="font-bold text-sm text-foreground">
                      <AnimatedNumber
                        value={parseFloat(player.average)}
                        decimals={1}
                        duration={0.8}
                      />{' '}
                      pts
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      Media
                    </div>
                  </div>
                }
              />
            );
          })
        ) : (
          <div className="text-center text-muted-foreground py-8">No hay datos disponibles</div>
        )}
      </div>
    </Card>
  );
}
