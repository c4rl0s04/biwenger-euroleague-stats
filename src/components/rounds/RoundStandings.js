'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { User, Medal, ListOrdered, ArrowUpDown } from 'lucide-react';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import { useApiData } from '@/lib/hooks/useApiData';
import { cn } from '@/lib/utils';
import { getColorForUser } from '@/lib/constants/colors';

export default function RoundStandings({ roundId, selectedUserId, onSelectUser }) {
  const router = useRouter();
  const [sortBy, setSortBy] = useState('round'); // 'round' or 'total'

  const { data: standings, loading } = useApiData(
    roundId ? `/api/rounds/standings?roundId=${roundId}` : null,
    { dependencies: [roundId] }
  );

  // Sort standings based on selected column
  const sortedStandings = useMemo(() => {
    if (!standings) return [];
    return [...standings].sort((a, b) => {
      const aVal = sortBy === 'round' ? a.round_points || a.points : a.total_points || 0;
      const bVal = sortBy === 'round' ? b.round_points || b.points : b.total_points || 0;
      return bVal - aVal;
    });
  }, [standings, sortBy]);

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
      className="sticky top-6 h-[800px] overflow-y-auto custom-scrollbar"
    >
      <div className="w-full mx-auto px-1">
        {/* Table Header */}
        <div className="flex items-center text-[10px] font-bold uppercase tracking-widest px-4 mb-2">
          <div className="w-8 text-center text-muted-foreground">#</div>
          <div className="flex-1 ml-4 text-muted-foreground">Manager</div>
          <button
            onClick={() => setSortBy('round')}
            className={cn(
              'w-14 text-right flex items-center justify-end gap-1 cursor-pointer transition-colors',
              sortBy === 'round'
                ? 'text-orange-400'
                : 'text-muted-foreground hover:text-orange-400/70'
            )}
          >
            Jornada
            {sortBy === 'round' && <ArrowUpDown size={10} />}
          </button>
          <button
            onClick={() => setSortBy('total')}
            className={cn(
              'w-16 text-right flex items-center justify-end gap-1 cursor-pointer transition-colors',
              sortBy === 'total' ? 'text-cyan-400' : 'text-muted-foreground hover:text-cyan-400/70'
            )}
          >
            Total
            {sortBy === 'total' && <ArrowUpDown size={10} />}
          </button>
        </div>

        {/* Leaderboard Rows */}
        <div className="flex flex-col">
          {sortedStandings.map((user, index) => {
            const isSelected = String(user.id) === String(selectedUserId);
            const isLast = index === sortedStandings.length - 1;
            const rank = index + 1;

            // Dynamic Styling for Top 3
            let rankColor = 'text-zinc-500';
            let rowBg = 'hover:bg-zinc-800/40';
            let icon = null;

            if (rank === 1) {
              rankColor = 'text-yellow-400'; // Gold
              icon = <Medal size={16} className="text-yellow-500 fill-yellow-500/20" />;
            } else if (rank === 2) {
              rankColor = 'text-zinc-300'; // Silver
              icon = <Medal size={16} className="text-zinc-300 fill-zinc-300/20" />;
            } else if (rank === 3) {
              rankColor = 'text-amber-700'; // Bronze
              icon = <Medal size={16} className="text-amber-700 fill-amber-700/20" />;
            }

            // Get user's characteristic color for hover effect
            const userColor = getColorForUser(user.id, user.name, user.color_index);

            return (
              <button
                key={user.id}
                onClick={() => onSelectUser(user.id)}
                className={cn(
                  'relative group flex items-center w-full px-4 py-3 transition-all duration-200 text-left cursor-pointer',
                  // Separator (border-b for all except last)
                  !isLast && 'border-b border-white/10',
                  // Background Logic
                  rowBg,
                  // Active State (Overrides everything)
                  isSelected &&
                    'bg-primary/10 ring-1 ring-primary/50 rounded-lg shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)] z-10 border-transparent'
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
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/user/${user.id}`);
                      }}
                      className="text-sm font-medium truncate transition-colors cursor-pointer hover:brightness-125"
                      style={{ color: userColor.stroke }}
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

                {/* Points Columns */}
                <div className="w-14 text-right shrink-0">
                  <span
                    className={cn(
                      'text-lg font-bold tracking-tight',
                      isSelected ? 'text-orange-300' : 'text-orange-400'
                    )}
                  >
                    {user.round_points || user.points}
                  </span>
                  <span className="text-[9px] text-orange-400/50 block -mt-1 font-medium">PTS</span>
                </div>
                <div className="w-16 text-right shrink-0">
                  <span
                    className={cn(
                      'text-lg font-bold tracking-tight',
                      isSelected ? 'text-cyan-300' : 'text-cyan-400'
                    )}
                  >
                    {user.total_points || 0}
                  </span>
                  <span className="text-[9px] text-cyan-400/50 block -mt-1 font-medium">TOTAL</span>
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
