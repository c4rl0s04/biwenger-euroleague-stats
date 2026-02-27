'use client';

import { TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { getScoreColor, getShortTeamName } from '@/lib/utils/format';
import { Card, AnimatedNumber } from '@/components/ui';
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
      {!loading && (
        <div className="space-y-4 flex-1">
          {players && players.length > 0 ? (
            players.slice(0, 5).map((player, idx) => (
              <div key={player.id || player.player_id} className="group/item">
                {/* Line 1: Name */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-muted-foreground font-mono text-xs w-4 shrink-0">
                    {idx + 1}.
                  </span>
                  <Link
                    href={`/player/${player.id || player.player_id}`}
                    className="text-foreground font-medium text-sm truncate hover:text-green-500 transition-colors"
                    title={player.name}
                  >
                    {player.name}
                  </Link>
                </div>

                {/* Line 2: Context */}
                <div className="pl-6 mb-1.5 space-y-0.5">
                  <Link
                    href={`/team/${player.team_id}`}
                    className="text-xs text-muted-foreground truncate hover:text-green-500 transition-colors block w-fit"
                    title={player.team}
                  >
                    {getShortTeamName(player.team)}
                  </Link>
                  {player.owner_name &&
                    (() => {
                      const color = getColorForUser(
                        player.owner_id,
                        player.owner_name,
                        player.owner_color_index
                      );
                      return (
                        <Link
                          href={`/user/${player.owner_id}`}
                          className={`text-xs truncate transition-colors block w-fit ${color.text} hover:opacity-80`}
                          title={`Dueño: ${player.owner_name}`}
                        >
                          👤 {player.owner_name}
                        </Link>
                      );
                    })()}
                </div>

                {/* Line 3: Scores & Avg */}
                <div className="flex items-center justify-between pl-6">
                  <div className="flex gap-1">
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
                  <span className="text-green-400 font-bold text-sm">
                    {Number(player.avg_points).toFixed(1)}
                  </span>
                </div>
                {/* New section for improvement and recent average */}
                {(player.improvement !== undefined || player.recent_avg !== undefined) && (
                  <div className="flex items-center justify-between pl-6 mt-1">
                    {player.improvement !== undefined && (
                      <div className="flex flex-col items-start">
                        <div className="text-sm font-bold text-emerald-400">
                          +
                          <AnimatedNumber
                            value={parseFloat(player.improvement)}
                            decimals={1}
                            duration={0.8}
                          />
                        </div>
                        {player.improvement_pct !== undefined && (
                          <div className="text-xs text-muted-foreground">
                            <AnimatedNumber
                              value={parseFloat(player.improvement_pct)}
                              decimals={1}
                              duration={0.8}
                            />
                            %
                          </div>
                        )}
                      </div>
                    )}
                    {player.recent_avg !== undefined && (
                      <div className="text-xs text-muted-foreground">
                        <AnimatedNumber
                          value={parseFloat(player.recent_avg)}
                          decimals={1}
                          duration={0.8}
                        />{' '}
                        pts/g
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-muted-foreground text-sm text-center py-4">
              No hay datos disponibles
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
