'use client';

import { useClientUser } from '@/lib/hooks/useClientUser';
import { Activity } from 'lucide-react';
import { PremiumCard } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';

/**
 * RecentRoundsCard - Redesigned with Bento Grid architecture
 * Zone 1: Latest round hero display
 * Zone 2: Condensed scrollable list of previous rounds
 */
export default function RecentRoundsCard() {
  const { currentUser, isReady } = useClientUser();

  const { data: rounds, loading } = useApiData(
    () => (currentUser ? `/api/player/rounds?userId=${currentUser.id}` : null),
    {
      transform: (d) => d?.rounds || d,
      dependencies: [currentUser?.id],
      skip: !currentUser,
    }
  );

  if (!isReady) return null;

  const getPositionBadge = (pos) => {
    if (pos === 1) return 'text-yellow-400';
    if (pos <= 3) return 'text-primary';
    return 'text-muted-foreground';
  };

  const latestRound = rounds?.[0];
  const previousRounds = rounds?.slice(1) || [];

  return (
    <PremiumCard title="Últimas Jornadas" icon={Activity} color="purple" loading={loading}>
      {!loading && rounds && (
        <div className="flex flex-col h-full flex-1">
          {/* Zone 1: Latest Round - Hero Display */}
          {latestRound && (
            <div className="mb-4 pb-4 border-b border-border/50">
              <div className="flex items-center justify-between mb-2">
                <div className="text-muted-foreground text-xs uppercase tracking-wider">
                  {latestRound.round_name}
                </div>
                <span className={`text-2xl font-display ${getPositionBadge(latestRound.position)}`}>
                  #{latestRound.position}
                </span>
              </div>
              <div className="text-5xl font-display text-foreground">
                {latestRound.points}
                <span className="text-2xl text-muted-foreground ml-1">pts</span>
              </div>
            </div>
          )}

          {/* Zone 2: Previous Rounds - Condensed List */}
          <div className="flex-1 space-y-1.5 overflow-y-auto">
            {previousRounds.map((round) => (
              <div key={round.round_id} className="flex items-center justify-between py-2 group">
                <div className="text-muted-foreground text-xs font-mono">{round.round_name}</div>
                <div className="flex items-center gap-4">
                  <div className="text-foreground font-semibold text-sm">{round.points}</div>
                  <div
                    className={`text-xs font-display min-w-[28px] text-right ${getPositionBadge(round.position)}`}
                  >
                    #{round.position}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer: Summary */}
          <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">
              Mostrando
            </span>
            <span className="text-muted-foreground text-sm">
              <span className="text-foreground font-display text-lg">{rounds.length}</span> jornadas
            </span>
          </div>
        </div>
      )}
    </PremiumCard>
  );
}
