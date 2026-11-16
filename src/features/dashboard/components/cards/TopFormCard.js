'use client';

import { TrendingUp, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { getScoreColor, getShortTeamName } from '@/lib/competition/public';
import { Card } from '@/components/ui';
import { EmptyState } from '@/components/ui/foundation';
import { useApiData } from '@/lib/hooks/useApiData';
import { getManagerTextColor } from '@/lib/competition/public';

export default function TopFormCard() {
  const { data: players = [], loading } = useApiData('/api/dashboard/top-form');

  const listItems = !loading && players && players.length > 0 ? players.slice(0, 6) : [];

  return (
    <Card
      title="Top Forma"
      icon={TrendingUp}
      color="emerald"
      loading={loading}
      className="card-glow"
    >
      {listItems.length ? (
        <ul className="m-0 list-none divide-y divide-border/50 p-0" data-stat-list="topform">
          {listItems.map((player, idx) => {
            const ownerTextColor = getManagerTextColor(
              player.owner_id,
              player.owner_name,
              player.owner_color_index
            );
            return (
              <li key={player.id} className="flex min-w-0 items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-muted-foreground font-mono text-base font-black w-5 shrink-0 tabular-nums">
                      {idx + 1}
                    </span>

                    <div className="min-w-0 flex flex-col justify-center">
                      <Link
                        href={`/player/${player.id}`}
                        className="font-bold text-sm text-foreground truncate hover:text-[color-mix(in_srgb,var(--color-emerald-400)_55%,hsl(var(--content-primary)))] transition-colors leading-tight"
                      >
                        {player.name}
                      </Link>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground truncate mt-0.5 font-medium">
                        {player.owner_name && (
                          <Link
                            href={`/user/${player.owner_id}`}
                            style={{ color: ownerTextColor }}
                            className="flex items-center gap-0.5 transition-colors font-bold mr-1"
                          >
                            <UserIcon size={8} className="shrink-0" />
                            {player.owner_name}
                          </Link>
                        )}
                        <span className="opacity-30">•</span>
                        <span className="truncate">{getShortTeamName(player.team)}</span>
                      </div>
                      <div className="flex gap-1 mt-1">
                        {player.recent_scores &&
                          player.recent_scores.split(',').map((score, i) => (
                            <span
                              key={i}
                              className={`text-[9px] px-1 py-0.5 rounded border leading-none font-bold ${getScoreColor(score)}`}
                            >
                              {score}
                            </span>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="shrink-0 text-right tabular-nums">
                  <div className="flex flex-col items-end justify-center min-w-[60px]">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none mb-1">
                      Media
                    </span>
                    <span className="text-[color-mix(in_srgb,var(--color-emerald-400)_55%,hsl(var(--content-primary)))] font-bold text-base tabular-nums leading-none">
                      {player.avg_points != null ? Number(player.avg_points).toFixed(1) : '—'}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState>{'No hay datos disponibles'}</EmptyState>
      )}
    </Card>
  );
}
