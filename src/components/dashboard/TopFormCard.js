'use client';

import { TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { getScoreColor, getShortTeamName } from '@/lib/utils/format';
import { Card } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';

export default function TopFormCard() {
  const { data: players = [], loading } = useApiData('/api/dashboard/top-form');

  return (
    <Card title="Top Forma" icon={TrendingUp} color="green" loading={loading}>
      {!loading && (
        <div className="space-y-3 flex-1">
          {players && players.length > 0 ? (
            players.slice(0, 5).map((player, idx) => (
              <div key={player.player_id} className="group/item">
                {/* Line 1: Name */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-muted-foreground font-mono text-xs w-4 shrink-0">
                    {idx + 1}.
                  </span>
                  <Link
                    href={`/player/${player.player_id}`}
                    className="text-foreground font-medium text-sm truncate hover:text-green-400 transition-colors"
                    title={player.name}
                  >
                    {player.name}
                  </Link>
                </div>

                {/* Line 2: Context */}
                <div className="pl-6 mb-1.5 space-y-0.5">
                  <div className="text-xs text-muted-foreground truncate" title={player.team}>
                    {getShortTeamName(player.team)}
                  </div>
                  {player.owner_name && (
                    <div
                      className="text-xs text-blue-400 truncate"
                      title={`Dueño: ${player.owner_name}`}
                    >
                      👤 {player.owner_name}
                    </div>
                  )}
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
