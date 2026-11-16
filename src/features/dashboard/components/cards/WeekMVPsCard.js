'use client';

'use client';

import { Trophy, Award } from 'lucide-react';
import Link from 'next/link';
import { Card, AnimatedNumber } from '@/components/ui';
import { PlayerStatList } from '@/lib/competition/ui';
import { useApiData } from '@/lib/hooks/useApiData';
import { getManagerTextColor } from '@/lib/competition/public';

export default function WeekMVPsCard() {
  const { data: mvps = [], loading } = useApiData('/api/dashboard/mvps');

  const getRankStyles = (index) => {
    if (index === 0) return 'bg-yellow-500 text-slate-900 border-yellow-400';
    if (index === 1) return 'bg-slate-300 text-slate-900 border-slate-200';
    if (index === 2) return 'bg-orange-600 text-white border-orange-600';
    return 'bg-secondary text-muted-foreground border-border';
  };

  const getTextStyles = (index) => {
    if (index === 0)
      return 'text-[color-mix(in_srgb,var(--color-yellow-400)_55%,hsl(var(--content-primary)))]';
    if (index === 1) return 'text-muted-foreground';
    if (index === 2)
      return 'text-[color-mix(in_srgb,var(--color-orange-400)_55%,hsl(var(--content-primary)))]';
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
        <PlayerStatList
          items={!loading && mvps && mvps.length > 0 ? mvps.slice(0, 5) : []}
          emptyMessage="No hay datos disponibles"
          getKey={(player) => player.player_id}
          getPlayer={(player) => ({
            id: player.player_id ?? null,
            name: player.name,
            subtitle: (
              <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                <span>{player.team}</span>
                {player.owner_name && (
                  <>
                    <span>·</span>
                    {(() => {
                      return (
                        <span
                          className="truncate font-medium"
                          style={{
                            color: getManagerTextColor(
                              player.owner_id,
                              player.owner_name,
                              player.owner_color_index
                            ),
                          }}
                        >
                          👤 {player.owner_name}
                        </span>
                      );
                    })()}
                  </>
                )}
              </div>
            ),
          })}
          renderBadge={(player, index) => (
            <div
              className={`w-10 h-10 rounded-full flex shrink-0 items-center justify-center font-bold text-sm border-2 ${getRankStyles(
                index
              )}`}
            >
              {index <= 2 ? <Award className="w-5 h-5" /> : index + 1}
            </div>
          )}
          renderMetric={(player, index) => (
            <div className={`font-bold text-base whitespace-nowrap ${getTextStyles(index)}`}>
              <AnimatedNumber value={Number(player.points)} duration={0.8} /> pts
            </div>
          )}
        />
      </div>
    </Card>
  );
}
