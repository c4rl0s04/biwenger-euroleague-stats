'use client';

import { useClientUser } from '@/lib/hooks/useClientUser';
import { Activity } from 'lucide-react';
import { PremiumCard } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';

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

  return (
    <PremiumCard title="Últimas Jornadas" icon={Activity} color="purple" loading={loading}>
      {!loading && rounds && (
        <div className="space-y-1 flex-1 flex flex-col justify-between h-full">
          {rounds.map((round, idx) => {
            const isRecent = idx < 3;
            return (
              <div
                key={round.round_id}
                className={`flex items-center justify-between py-2 px-3 rounded-lg transition-all ${
                  isRecent
                    ? 'bg-slate-800/60 border border-slate-700/30'
                    : 'bg-slate-800/20 border border-transparent'
                } hover:bg-slate-800/80 hover:border-purple-500/30`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`text-xs font-mono font-medium ${isRecent ? 'text-slate-300' : 'text-slate-500'}`}
                  >
                    {round.round_name}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className={`font-bold text-sm ${isRecent ? 'text-white' : 'text-slate-400'}`}
                  >
                    {round.points}
                  </div>
                  <div className="min-w-[35px] text-right">
                    <span
                      className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                        round.position === 1
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : round.position <= 3
                            ? 'bg-orange-500/20 text-orange-400'
                            : 'bg-slate-700/50 text-slate-400'
                      }`}
                    >
                      #{round.position}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PremiumCard>
  );
}
