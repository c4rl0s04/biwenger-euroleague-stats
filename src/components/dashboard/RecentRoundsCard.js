'use client';

import { useClientUser } from '@/lib/hooks/useClientUser';
import { Activity } from 'lucide-react';
import { PremiumCard } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';

/**
 * RecentRoundsCard - Redesigned with Bento Grid architecture
 * Zone 1: Latest round hero display
 * Zone 2: Condensed scrollable list of previous rounds
 * Shows all rounds including non-participated (grayed out)
 */
export default function RecentRoundsCard() {
  const { currentUser, isReady } = useClientUser();

  const { data, loading } = useApiData(
    () => (currentUser ? `/api/player/rounds?userId=${currentUser.id}` : null),
    {
      dependencies: [currentUser?.id],
      skip: !currentUser,
    }
  );

  if (!isReady) return null;

  const rounds = data?.rounds || [];
  const totalPlayed = data?.total_played || 0;
  const totalRounds = data?.total_rounds || 0;

  const getPositionBadge = (pos, participated) => {
    if (!participated) return 'text-muted-foreground/40';
    if (pos === 1) return 'text-yellow-400'; // 🥇 Gold
    if (pos === 2) return 'text-slate-300'; // 🥈 Silver
    if (pos === 3) return 'text-amber-600'; // 🥉 Bronze
    if (pos <= 6) return 'text-primary'; // Top half - orange
    return 'text-red-500'; // Bottom half - red
  };

  // Find latest participated round for hero display
  const latestParticipated = rounds.find((r) => r.participated);
  const allRounds = rounds;

  return (
    <PremiumCard title="Últimas Jornadas" icon={Activity} color="purple" loading={loading}>
      {!loading && rounds.length > 0 && (
        <div className="flex flex-col h-full flex-1">
          {/* Zone 1: Latest Participated Round - Hero Display */}
          {latestParticipated && (
            <div className="mb-4 pb-4 border-b border-border/50">
              <div className="flex items-center justify-between mb-2">
                <div className="text-muted-foreground text-xs uppercase tracking-wider">
                  {latestParticipated.round_name}
                </div>
                <span
                  className={`text-2xl font-display ${getPositionBadge(latestParticipated.position, true)}`}
                >
                  #{latestParticipated.position}
                </span>
              </div>
              <div className="text-5xl font-display text-foreground">
                {latestParticipated.points}
                <span className="text-2xl text-muted-foreground ml-1">pts</span>
              </div>
            </div>
          )}

          {/* Zone 2: All Rounds - Condensed List */}
          <div className="flex-1 space-y-1.5 overflow-y-auto">
            {allRounds
              .filter((r) => r !== latestParticipated)
              .map((round) => (
                <div
                  key={round.round_id}
                  className={`flex items-center justify-between py-2 ${
                    !round.participated ? 'opacity-40' : ''
                  }`}
                >
                  <div
                    className={`text-xs font-mono ${getPositionBadge(round.position, round.participated)}`}
                  >
                    {round.round_name}
                  </div>
                  <div className="flex items-center gap-4">
                    {round.participated ? (
                      <>
                        <div className="text-foreground font-semibold text-sm">{round.points}</div>
                        <div
                          className={`text-xs font-display min-w-[28px] text-right ${getPositionBadge(round.position, true)}`}
                        >
                          #{round.position}
                        </div>
                      </>
                    ) : (
                      <div className="text-muted-foreground/50 text-xs italic">No participó</div>
                    )}
                  </div>
                </div>
              ))}
          </div>

          {/* Footer: Summary */}
          <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">
              Jornadas jugadas
            </span>
            <span className="text-muted-foreground text-sm">
              <span className="text-foreground font-display text-lg">{totalPlayed}</span> de{' '}
              {totalRounds}
            </span>
          </div>
        </div>
      )}
    </PremiumCard>
  );
}
