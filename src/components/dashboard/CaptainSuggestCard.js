'use client';

import { useClientUser } from '@/lib/hooks/useClientUser';
import { Star } from 'lucide-react';
import Link from 'next/link';
import { getScoreColor, getShortTeamName } from '@/lib/utils/format';
import { Card } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';

export default function CaptainSuggestCard() {
  const { currentUser, isReady } = useClientUser();

  const { data: players = [], loading } = useApiData(
    () => (currentUser ? `/api/dashboard/captain-suggest?userId=${currentUser.id}` : null),
    {
      dependencies: [currentUser?.id],
      skip: !currentUser,
    }
  );

  if (!isReady) return null;

  return (
    <Card
      title="Capitán Sugerido"
      icon={Star}
      color="yellow"
      loading={loading}
      className="card-glow"
    >
      {!loading && (
        <div className="space-y-4 flex-1">
          {players && players.length > 0 ? (
            players.slice(0, 6).map((player) => (
              <div key={player.player_id} className="group/item">
                {/* Line 1: Name */}
                <div className="mb-1">
                  <Link
                    href={`/player/${player.player_id}`}
                    className="text-foreground font-medium text-sm truncate block hover:text-yellow-500 transition-colors"
                    title={player.name}
                  >
                    {player.name}
                  </Link>
                </div>

                {/* Line 2: Context */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
                  <Link
                     href={`/team/${encodeURIComponent(player.team)}`}
                     className="truncate hover:text-yellow-500 transition-colors"
                     title={player.team}
                  >
                    {getShortTeamName(player.team)}
                  </Link>
                  <span className="w-1 h-1 rounded-full bg-muted"></span>
                  <span className="text-yellow-500/80">{player.form_label}</span>
                </div>

                {/* Line 3: Scores & Avg */}
                <div className="flex items-center justify-between">
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
                  <span className="text-yellow-400 font-bold text-sm">
                    {Number(player.avg_recent_points).toFixed(1)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-muted-foreground text-sm text-center py-4">
              Selecciona un usuario
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
