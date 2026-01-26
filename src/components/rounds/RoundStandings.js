'use client';

import Image from 'next/image';
import { User, Medal, Trophy, ListOrdered } from 'lucide-react';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import { useApiData } from '@/lib/hooks/useApiData';
import { cn } from '@/lib/utils';

export default function RoundStandings({ roundId, selectedUserId, onSelectUser }) {
  const { data: standings, loading } = useApiData(
    roundId ? `/api/rounds/standings?roundId=${roundId}` : null,
    { dependencies: [roundId] }
  );

  // 1. Skeleton Loading State
  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto space-y-2 px-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-14 bg-white/5 rounded-xl w-full animate-pulse border border-white/5"
          />
        ))}
      </div>
    );
  }

  if (!standings || standings.length === 0) return null;

  return (
    <ElegantCard
      title="Clasificación"
      icon={ListOrdered}
      color="orange"
      className="sticky top-6 h-[650px] overflow-y-auto custom-scrollbar"
    >
      <div className="w-full mx-auto px-1">
        {/* Table Header */}
        <div className="flex items-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-4 mb-2">
          <div className="w-8 text-center">#</div>
          <div className="flex-1 ml-4">Manager</div>
          <div className="w-20 text-right">Puntos</div>
        </div>

        {/* Leaderboard Rows */}
        <div className="flex flex-col gap-2">
          {standings.map((user, index) => {
            const isSelected = String(user.id) === String(selectedUserId);
            const rank = index + 1;

            // Dynamic Styling for Top 3
            let rankColor = 'text-zinc-500';
            let rowBg = 'bg-zinc-900/40 hover:bg-zinc-800/60';
            let icon = null;

            if (rank === 1) {
              rankColor = 'text-yellow-400'; // Gold
              rowBg = 'bg-gradient-to-r from-yellow-500/10 to-zinc-900/40 border-yellow-500/20';
              icon = <Medal size={16} className="text-yellow-500 fill-yellow-500/20" />;
            } else if (rank === 2) {
              rankColor = 'text-zinc-300'; // Silver
              icon = <Medal size={16} className="text-zinc-300 fill-zinc-300/20" />;
            } else if (rank === 3) {
              rankColor = 'text-amber-700'; // Bronze
              icon = <Medal size={16} className="text-amber-700 fill-amber-700/20" />;
            }

            return (
              <button
                key={user.id}
                onClick={() => onSelectUser(user.id)}
                className={cn(
                  'relative group flex items-center w-full px-4 py-3 rounded-xl transition-all duration-200 border text-left',
                  // Background & Border Logic
                  rowBg,
                  // Active State (Overrides everything)
                  isSelected
                    ? 'bg-primary/10 border-primary ring-1 ring-primary/50 shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)] z-10 scale-[1.02]'
                    : 'border-white/5',
                  // Hover effect for non-selected
                  !isSelected && 'hover:border-white/20 hover:scale-[1.01]'
                )}
              >
                {/* Rank Column */}
                <div
                  className={cn(
                    'w-8 font-mono font-bold text-lg flex justify-center shrink-0',
                    rankColor
                  )}
                >
                  {icon || rank}
                </div>

                {/* User Info Column */}
                <div className="flex items-center gap-3 flex-1 min-w-0 ml-4">
                  {/* Avatar */}
                  <div
                    className={cn(
                      'relative w-9 h-9 rounded-full overflow-hidden border shrink-0',
                      isSelected ? 'border-primary' : 'border-white/10 bg-zinc-800'
                    )}
                  >
                    {user.icon ? (
                      <Image src={user.icon} alt={user.name} fill className="object-cover" />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-zinc-500">
                        <User size={16} />
                      </div>
                    )}
                  </div>

                  {/* Name & Team */}
                  <div className="flex flex-col leading-none truncate">
                    <span
                      className={cn(
                        'text-sm font-medium truncate transition-colors',
                        isSelected ? 'text-white' : 'text-zinc-300 group-hover:text-white'
                      )}
                    >
                      {user.name}
                    </span>
                    {/* Optional: If you have a team name, display it here */}
                    {user.team_name && (
                      <span className="text-[10px] text-zinc-500 truncate mt-1">
                        {user.team_name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Points Column */}
                <div className="w-24 text-right shrink-0">
                  <span
                    className={cn(
                      'text-xl font-bold tracking-tight',
                      isSelected ? 'text-primary' : 'text-white'
                    )}
                  >
                    {user.points}
                  </span>
                  <span className="text-[10px] text-zinc-500 block -mt-1 font-medium">PTS</span>
                </div>

                {/* Desktop Visual Cue (Arrow) */}
                {isSelected && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 hidden lg:block">
                    <div className="w-1.5 h-6 bg-primary rounded-r-full shadow-[0_0_10px_rgba(var(--primary-rgb),0.8)]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </ElegantCard>
  );
}
