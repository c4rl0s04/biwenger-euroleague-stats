'use client';

'use client';

import { TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { getScoreColor, getShortTeamName } from '@/lib/utils/format';
import { Card, AnimatedNumber, StatsList } from '@/components/ui';
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
      <div className="flex flex-col flex-1 pb-1">
        <StatsList
          items={!loading && players && players.length > 0 ? players.slice(0, 5) : []}
          emptyMessage="No hay datos disponibles"
          renderLeft={(player, idx) => (
            <div className="flex items-center gap-3 w-full">
              <div className="text-muted-foreground font-mono font-bold text-lg w-4 shrink-0">
                {idx + 1}.
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/player/${player.id || player.player_id}`}
                  className="font-bold text-foreground text-sm truncate hover:text-green-500 transition-colors block"
                  title={player.name}
                >
                  {player.name}
                </Link>
                <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                  <Link
                    href={`/team/${player.team_id}`}
                    className="hover:text-green-500 transition-colors"
                  >
                    {getShortTeamName(player.team)}
                  </Link>
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
                          <Link
                            href={`/user/${player.owner_id}`}
                            className={`${color.text} truncate font-medium hover:opacity-80 transition-colors`}
                          >
                            👤 {player.owner_name}
                          </Link>
                        );
                      })()}
                    </>
                  )}
                </div>
                <div className="flex gap-1 mt-1">
                  {player.recent_scores &&
                    player.recent_scores.split(',').map((score, i) => (
                      <span
                        key={i}
                        className={`text-[10px] px-1.5 py-0.5 rounded border ${getScoreColor(score)}`}
                      >
                        {score}
                      </span>
                    ))}
                </div>
              </div>
            </div>
          )}
          renderRight={(player) => (
            <div className="flex flex-col items-end whitespace-nowrap">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Media
                </span>
                <span className="text-green-400 font-bold text-sm">
                  {Number(player.avg_points).toFixed(1)}
                </span>
              </div>
              {(player.improvement !== undefined || player.recent_avg !== undefined) && (
                <div className="flex flex-col items-end mt-1">
                  {player.improvement !== undefined && (
                    <div className="flex items-center gap-1">
                      {player.improvement_pct !== undefined && (
                        <div className="text-[10px] text-muted-foreground">
                          <AnimatedNumber
                            value={parseFloat(player.improvement_pct)}
                            decimals={1}
                            duration={0.8}
                          />
                          %
                        </div>
                      )}
                      <div className="text-sm font-bold text-emerald-400">
                        +
                        <AnimatedNumber
                          value={parseFloat(player.improvement)}
                          decimals={1}
                          duration={0.8}
                        />
                      </div>
                    </div>
                  )}
                  {player.recent_avg !== undefined && (
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      Reciente:{' '}
                      <AnimatedNumber
                        value={parseFloat(player.recent_avg)}
                        decimals={1}
                        duration={0.8}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        />
      </div>
    </Card>
  );
}
