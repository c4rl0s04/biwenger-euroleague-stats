'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { User, Medal, ListOrdered, ArrowUpDown } from 'lucide-react';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import { useApiData } from '@/lib/hooks/useApiData';
import { cn } from '@/lib/utils';
import { getColorForUser } from '@/lib/constants/colors';

export default function RoundStandings({
  roundId,
  selectedUserId,
  onSelectUser,
  standings: propStandings,
}) {
  const router = useRouter();
  const [sortBy, setSortBy] = useState('round'); // 'round' or 'total'

  // If props provided, don't fetch. Else fetch.
  const shouldFetch = !propStandings && roundId;

  const { data: fetchedStandings, loading } = useApiData(
    shouldFetch ? `/api/rounds/standings?roundId=${roundId}` : null,
    { dependencies: [roundId] }
  );

  const standings = propStandings || fetchedStandings;

  // Sort standings based on selected column
  const sortedStandings = useMemo(() => {
    if (!standings) return [];
    return [...standings].sort((a, b) => {
      let aVal = 0;
      let bVal = 0;

      if (sortBy === 'round') {
        aVal = a.round_points || a.points || 0;
        bVal = b.round_points || b.points || 0;
      } else if (sortBy === 'ideal') {
        aVal = a.ideal_points || 0;
        bVal = b.ideal_points || 0;
      } else if (sortBy === 'efficiency') {
        // Calculate efficiency on the fly for sorting
        const aActual = a.round_points || a.points || 0;
        const aIdeal = a.ideal_points || 0;
        const aEff = aIdeal > 0 ? aActual / aIdeal : 0;

        const bActual = b.round_points || b.points || 0;
        const bIdeal = b.ideal_points || 0;
        const bEff = bIdeal > 0 ? bActual / bIdeal : 0;

        aVal = aEff;
        bVal = bEff;
      } else {
        // Fallback for 'total' or default
        aVal = a.total_points || 0;
        bVal = b.total_points || 0;
      }

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
      <div className="w-full mx-auto px-2">
        {/* Table Header - Simplified & Sortable */}
        <div className="grid grid-cols-[2rem_1fr_3rem_3rem_3rem] gap-2 items-center text-[10px] font-bold uppercase tracking-widest px-4 mb-2 select-none">
          <div className="text-center text-muted-foreground">#</div>
          <div className="text-center text-muted-foreground">Manager</div>

          {/* Sort by Efficiency */}
          <button
            onClick={() => setSortBy('efficiency')}
            className={cn(
              'flex items-center justify-center relative transition-all cursor-pointer group',
              sortBy === 'efficiency'
                ? 'text-blue-400 opacity-100'
                : 'text-muted-foreground hover:text-blue-400 opacity-50 hover:opacity-100'
            )}
            title="Ordenar por Eficiencia"
          >
            %
            <ArrowUpDown
              size={10}
              className={cn(
                'absolute right-0 opacity-0 transition-opacity',
                sortBy === 'efficiency' && 'opacity-100'
              )}
            />
          </button>

          {/* Sort by Round Points */}
          <button
            onClick={() => setSortBy('round')}
            className={cn(
              'flex items-center justify-center relative transition-all cursor-pointer group',
              sortBy === 'round'
                ? 'text-orange-400 opacity-100'
                : 'text-muted-foreground hover:text-orange-400 opacity-50 hover:opacity-100'
            )}
            title="Ordenar por Puntos Jornada"
          >
            Pts
            <ArrowUpDown
              size={10}
              className={cn(
                'absolute right-0 opacity-0 transition-opacity',
                sortBy === 'round' && 'opacity-100'
              )}
            />
          </button>

          {/* Sort by Ideal Points */}
          <button
            onClick={() => setSortBy('ideal')}
            className={cn(
              'flex items-center justify-center relative transition-all cursor-pointer group',
              sortBy === 'ideal'
                ? 'text-emerald-400 opacity-100'
                : 'text-muted-foreground hover:text-emerald-400 opacity-50 hover:opacity-100'
            )}
            title="Ordenar por Puntos Ideales"
          >
            Max
            <ArrowUpDown
              size={10}
              className={cn(
                'absolute right-0 opacity-0 transition-opacity',
                sortBy === 'ideal' && 'opacity-100'
              )}
            />
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
              rankColor = 'text-yellow-400';
              icon = <Medal size={16} className="text-yellow-500 fill-yellow-500/20" />;
            } else if (rank === 2) {
              rankColor = 'text-zinc-300';
              icon = <Medal size={16} className="text-zinc-300 fill-zinc-300/20" />;
            } else if (rank === 3) {
              rankColor = 'text-amber-700';
              icon = <Medal size={16} className="text-amber-700 fill-amber-700/20" />;
            }

            // Calculate Efficiency
            const actual = user.round_points || user.points || 0;
            const ideal = user.ideal_points || 0;
            const eff = ideal > 0 ? (actual / ideal) * 100 : 0;

            // Color Coding for Efficiency
            let effColor = 'text-red-400';
            if (eff >= 90) effColor = 'text-emerald-400';
            else if (eff >= 80) effColor = 'text-blue-400';
            else if (eff >= 70) effColor = 'text-orange-400';

            return (
              <button
                key={user.id}
                onClick={() => onSelectUser(user.id)}
                className={cn(
                  'relative group grid grid-cols-[2rem_1fr_3rem_3rem_3rem] gap-2 items-center w-full min-w-fit px-4 py-3 transition-all duration-200 cursor-pointer text-left',
                  // Separator
                  !isLast && 'border-b border-white/10',
                  rowBg,
                  isSelected &&
                    'bg-primary/10 ring-1 ring-primary/50 rounded-lg shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)] z-10 border-transparent'
                )}
              >
                {/* 1. Rank */}
                <div
                  className={cn(
                    'font-mono font-bold text-lg flex justify-center shrink-0',
                    rankColor
                  )}
                >
                  {icon || rank}
                </div>

                {/* 2. Manager Image */}
                <div className="flex justify-center w-full">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/user/${user.id}`);
                    }}
                    className={cn(
                      'relative w-10 h-10 rounded-full overflow-hidden border-2 shrink-0 cursor-pointer hover:scale-110 transition-transform shadow-lg',
                      isSelected ? 'border-primary' : 'border-zinc-700'
                    )}
                  >
                    {user.icon ? (
                      <Image src={user.icon} alt={user.name} fill className="object-cover" />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full bg-zinc-800 text-zinc-500">
                        <User size={18} />
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Efficiency Column */}
                <div className="flex justify-center shrink-0">
                  <span className={cn('text-sm font-bold', effColor)}>{Math.round(eff)}%</span>
                </div>

                {/* 4. Actual Points */}
                <div className="flex justify-center shrink-0">
                  <span
                    className={cn(
                      'text-lg font-bold tracking-tight',
                      isSelected ? 'text-orange-300' : 'text-orange-400'
                    )}
                  >
                    {Math.round(actual)}
                  </span>
                </div>

                {/* 5. Ideal Points */}
                <div className="flex justify-center shrink-0">
                  <span
                    className={cn(
                      'text-lg font-bold tracking-tight',
                      isSelected ? 'text-emerald-300' : 'text-emerald-400'
                    )}
                  >
                    {Math.round(ideal)}
                  </span>
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
