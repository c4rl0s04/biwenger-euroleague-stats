'use client';

'use client';

import { TrendingUp } from 'lucide-react';
import Link from 'next/link';

import { Card, AnimatedNumber } from '@/components/ui';
import { PlayerStatList } from '@/lib/competition/ui';
import { useApiData } from '@/lib/hooks/useApiData';
import { getManagerTextColor } from '@/lib/competition/public';

export default function TopPlayersCard() {
  const { data: topPlayers = [], loading } = useApiData('/api/dashboard/top-players');

  const actionLink = (
    <Link
      href="/players"
      className="text-sm text-[color-mix(in_srgb,var(--color-emerald-400)_55%,hsl(var(--content-primary)))] hover:text-[color-mix(in_srgb,var(--color-emerald-300)_55%,hsl(var(--content-primary)))]"
    >
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
    if (idx === 0)
      return 'text-[color-mix(in_srgb,var(--color-yellow-400)_55%,hsl(var(--content-primary)))]';
    if (idx === 1) return 'text-muted-foreground';
    if (idx === 2)
      return 'text-[color-mix(in_srgb,var(--color-amber-500)_55%,hsl(var(--content-primary)))]';
    return 'text-[color-mix(in_srgb,var(--color-emerald-400)_55%,hsl(var(--content-primary)))]';
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
        <PlayerStatList
          items={!loading && topPlayers.length > 0 ? topPlayers.slice(0, 5) : []}
          emptyMessage="No hay datos disponibles"
          getKey={(player) => player.id}
          getPlayer={(player) => ({
            id: player.id ?? null,
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
              className={`w-10 h-10 rounded-full flex items-center shrink-0 justify-center font-bold text-sm border-2 ${getRankStyles(
                index
              )}`}
            >
              {index + 1}
            </div>
          )}
          renderMetric={(player, index) => (
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
