'use client';

import { TrendingUp, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { getScoreColor, getShortTeamName } from '@/lib/utils/format';
import { Card, StatsList } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';
import { getColorForUser } from '@/lib/constants/colors';

export default function TopFormCard() {
  const { data: players = [], loading } = useApiData('/api/dashboard/top-form');

  return (
    <Card
      title="Top Forma"
      icon={TrendingUp}
      color="emerald"
      loading={loading}
      className="card-glow"
    >
      <StatsList
        items={!loading && players && players.length > 0 ? players.slice(0, 6) : []}
        emptyMessage="No hay datos disponibles"
        renderLeft={(player, idx) => {
          const ownerColor = player.owner_id
            ? getColorForUser(player.owner_id, player.owner_name, player.owner_color_index)
            : null;

          return (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="text-slate-500 font-mono text-base font-black w-5 shrink-0 tabular-nums">
                {idx + 1}
              </span>

              <div className="min-w-0 flex flex-col justify-center">
                <Link
                  href={`/player/${player.id}`}
                  className="font-bold text-sm text-white truncate hover:text-emerald-400 transition-colors leading-tight"
                >
                  {player.name}
                </Link>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 truncate mt-0.5 font-medium">
                  {player.owner_name && (
                    <Link
                      href={`/user/${player.owner_id}`}
                      className={`flex items-center gap-0.5 ${ownerColor?.text || 'hover:text-blue-400'} transition-colors font-bold mr-1`}
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
          );
        }}
        renderRight={(player) => (
          <div className="flex flex-col items-end justify-center min-w-[60px]">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none mb-1">
              Media
            </span>
            <span className="text-emerald-400 font-bold text-base tabular-nums leading-none">
              {Number(player.avg_points).toFixed(1)}
            </span>
          </div>
        )}
      />
    </Card>
  );
}
