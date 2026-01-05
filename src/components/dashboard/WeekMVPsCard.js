'use client';

import { Trophy, Award } from 'lucide-react';
import { Card } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';
import DashboardPlayerRow from './shared/DashboardPlayerRow';

export default function WeekMVPsCard() {
  const { data: mvps = [], loading } = useApiData('/api/dashboard/mvps');

  const getRankStyles = (index) => {
    // Added border-2 to match the border thickness of IdealLineupCard
    if (index === 0) return 'bg-yellow-500 text-slate-900 border-yellow-400';
    if (index === 1) return 'bg-slate-300 text-slate-900 border-slate-200';
    if (index === 2) return 'bg-orange-600 text-white border-orange-600';
    return 'bg-secondary text-muted-foreground border-border';
  };

  const getTextStyles = (index) => {
    if (index === 0) return 'text-yellow-400';
    if (index === 1) return 'text-slate-300';
    if (index === 2) return 'text-orange-400';
    return 'text-foreground';
  };

  return (
    <Card
      title="MVPs Última Jornada"
      icon={Trophy}
      color="yellow"
      loading={loading}
      className="card-glow"
    >
      <div className="flex flex-col">
        {!loading && mvps && mvps.length > 0
          ? mvps.map((player, index) => (
              <DashboardPlayerRow
                key={player.player_id}
                playerId={player.player_id}
                name={player.name}
                team={player.team}
                teamId={player.team_id}
                owner={player.owner_name}
                ownerId={player.owner_id}
                color="yellow"
                avatar={
                  <div
                    // CHANGED: w-8 h-8 -> w-10 h-10 (Matches IdealLineup & StreakCard)
                    // Added border-2 to match the visual weight of other avatars
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 ${getRankStyles(
                      index
                    )}`}
                  >
                    {index <= 2 ? <Award className="w-5 h-5" /> : index + 1}
                  </div>
                }
                rightContent={
                  <div className={`font-bold text-sm ${getTextStyles(index)}`}>
                    {player.points} pts
                  </div>
                }
              />
            ))
          : !loading && (
              <div className="text-center text-muted-foreground py-8">No hay datos disponibles</div>
            )}
      </div>
    </Card>
  );
}
