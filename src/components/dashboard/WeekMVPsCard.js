'use client';

'use client';

import { Trophy, Award } from 'lucide-react';
import { Card, AnimatedNumber, StatsList } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';
import { getColorForUser } from '@/lib/constants/colors';

export default function WeekMVPsCard() {
  const { data: mvps = [], loading } = useApiData('/api/dashboard/mvps');

  const getRankStyles = (index) => {
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
      <div className="flex flex-col flex-1 pb-1">
        <StatsList
          items={!loading && mvps && mvps.length > 0 ? mvps.slice(0, 5) : []}
          emptyMessage="No hay datos disponibles"
          renderLeft={(player, index) => (
            <div className="flex items-center gap-3 w-full">
              <div
                className={`w-10 h-10 rounded-full flex shrink-0 items-center justify-center font-bold text-sm border-2 ${getRankStyles(
                  index
                )}`}
              >
                {index <= 2 ? <Award className="w-5 h-5" /> : index + 1}
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
            <div className={`font-bold text-base whitespace-nowrap ${getTextStyles(index)}`}>
              <AnimatedNumber value={Number(player.points)} duration={0.8} /> pts
            </div>
          )}
        />
      </div>
    </Card>
  );
}
