'use client';

import { Sparkles, TrendingUp, ArrowUp } from 'lucide-react';
import Link from 'next/link';
import { getShortTeamName } from '@/lib/competition/public';
import { Card, AnimatedNumber } from '@/components/ui';
import { EmptyState } from '@/components/ui/foundation';
import { useApiData } from '@/lib/hooks/useApiData';

export default function RisingStarsCard() {
  const { data: stars = [], loading } = useApiData('/api/dashboard/rising-stars');

  const listItems = !loading && stars && stars.length > 0 ? stars.slice(0, 6) : [];

  return (
    <Card title="Estrellas Emergentes" icon={Sparkles} color="emerald" loading={loading}>
      {listItems.length ? (
        <ul className="m-0 list-none divide-y divide-border/50 p-0" data-stat-list="risingstars">
          {listItems.map((player, index) => {
            return (
              <li key={player.id} className="flex min-w-0 items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="rounded-full p-1 bg-emerald-500/10 border border-emerald-500/20 text-[color-mix(in_srgb,var(--color-emerald-400)_55%,hsl(var(--content-primary)))]">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex flex-col justify-center">
                      <Link
                        href={`/player/${player.id}`}
                        className="font-bold text-sm text-foreground truncate hover:text-[color-mix(in_srgb,var(--color-emerald-400)_55%,hsl(var(--content-primary)))] transition-colors leading-tight"
                      >
                        {player.name}
                      </Link>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground truncate mt-0.5 font-medium">
                        <span className="truncate">{getShortTeamName(player.team)}</span>
                        <span className="opacity-30">•</span>
                        <span className="truncate">{player.position}</span>
                        {player.owner_name && (
                          <>
                            <span className="opacity-30">•</span>
                            <span className="text-[color-mix(in_srgb,var(--color-blue-400)_55%,hsl(var(--content-primary)))] font-bold">
                              👤 {player.owner_name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="shrink-0 text-right tabular-nums">
                  <div className="flex flex-col items-end justify-center min-w-[70px]">
                    <div className="flex items-center gap-1 text-[color-mix(in_srgb,var(--color-emerald-400)_55%,hsl(var(--content-primary)))]">
                      <ArrowUp className="w-3 h-3" />
                      <span className="font-bold text-base leading-none">
                        <AnimatedNumber
                          value={parseFloat(player.improvement)}
                          decimals={1}
                          duration={0.8}
                        />
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                      <AnimatedNumber
                        value={parseFloat(player.improvement_pct)}
                        decimals={1}
                        duration={0.8}
                      />
                      % mejora
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState>{'No hay datos suficientes'}</EmptyState>
      )}
    </Card>
  );
}
