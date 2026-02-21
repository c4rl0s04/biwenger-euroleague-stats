'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { User, Medal, ListOrdered, ArrowUpDown } from 'lucide-react';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import { useApiData } from '@/lib/hooks/useApiData';
import { cn } from '@/lib/utils';
import { getColorForUser } from '@/lib/constants/colors';
import { calcEfficiency } from '@/lib/utils/efficiency';

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
        const aEff = calcEfficiency(aActual, aIdeal);

        const bActual = b.round_points || b.points || 0;
        const bIdeal = b.ideal_points || 0;
        const bEff = calcEfficiency(bActual, bIdeal);

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
      className="h-full flex flex-col overflow-hidden"
    >
      <div className="w-full mx-auto px-1 flex-1 flex flex-col min-h-0">
        {/* Table Header - Updated Widths: Manager fixed, stats fill space */}
        <div className="grid grid-cols-[1.5rem_3rem_1fr_1fr_1fr_1fr] gap-1 items-center text-[10px] font-bold uppercase tracking-widest px-2 mb-2 select-none">
          <div className="text-center text-muted-foreground">#</div>
          <div className="text-center text-muted-foreground">Mgr</div>

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

          {/* Sort by Total Points */}
          <button
            onClick={() => setSortBy('total')}
            className={cn(
              'flex items-center justify-center relative transition-all cursor-pointer group',
              sortBy === 'total'
                ? 'text-yellow-400 opacity-100'
                : 'text-muted-foreground hover:text-yellow-400 opacity-50 hover:opacity-100'
            )}
            title="Ordenar por Puntos Totales"
          >
            Tot
            <ArrowUpDown
              size={10}
              className={cn(
                'absolute right-0 opacity-0 transition-opacity',
                sortBy === 'total' && 'opacity-100'
              )}
            />
          </button>
        </div>
        <div className="flex-1 w-full overflow-y-auto custom-scrollbar relative">
          <div className="flex flex-col justify-between min-h-full py-2">
            {sortedStandings.map((user, index) => {
              const isSelected = String(user.id) === String(selectedUserId);
              const rank = index + 1;

              // Dynamic Styling for Top 3
              let rankColor = 'text-zinc-500';
              let rowBg = 'hover:bg-zinc-800/40 bg-zinc-900/40 rounded-lg'; // Added default bg and rounding
              let icon = null;

              if (rank === 1) {
                rankColor = 'text-yellow-400';
                icon = <Medal size={14} className="text-yellow-500 fill-yellow-500/20" />;
              } else if (rank === 2) {
                rankColor = 'text-zinc-300';
                icon = <Medal size={14} className="text-zinc-300 fill-zinc-300/20" />;
              } else if (rank === 3) {
                rankColor = 'text-amber-700';
                icon = <Medal size={14} className="text-amber-700 fill-amber-700/20" />;
              }

              // Calculate Efficiency
              const actual = user.round_points || user.points || 0;
              const ideal = user.ideal_points || 0;
              const eff = calcEfficiency(actual, ideal);

              // Color Coding for Efficiency
              let effColor = 'text-red-400';
              if (eff >= 90) effColor = 'text-emerald-400';
              else if (eff >= 80) effColor = 'text-blue-400';
              else if (eff >= 70) effColor = 'text-orange-400';

              return (
                <button
                  key={user.id}
                  onClick={() => onSelectUser(user.id)}
                  // Updated Row Widths to match Header
                  className={cn(
                    'relative group grid grid-cols-[1.5rem_3rem_1fr_1fr_1fr_1fr] gap-1 items-center w-full px-2 py-2 transition-all duration-200 cursor-pointer text-left',
                    rowBg,
                    isSelected &&
                      'bg-primary/10 ring-1 ring-primary/50 shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)] z-10'
                  )}
                >
                  {/* 1. Rank */}
                  <div
                    className={cn(
                      'font-mono font-bold text-sm flex justify-center shrink-0',
                      rankColor
                    )}
                  >
                    {icon || rank}
                  </div>

                  {/* 2. Manager Image (Compact Column) */}
                  <div className="flex justify-center w-full">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/user/${user.id}`);
                      }}
                      className={cn(
                        'relative w-8 h-8 rounded-full overflow-hidden border-2 shrink-0 cursor-pointer hover:scale-110 transition-transform shadow-lg z-10',
                        isSelected ? 'border-primary' : 'border-zinc-700'
                      )}
                    >
                      {user.icon ? (
                        <Image src={user.icon} alt={user.name} fill className="object-cover" />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full bg-zinc-800 text-zinc-500">
                          <User size={14} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3. Efficiency Column */}
                  <div className="flex justify-center shrink-0 w-full">
                    <span className={cn('text-xs font-bold', effColor)}>{Math.round(eff)}%</span>
                  </div>

                  {/* 4. Actual Points */}
                  <div className="flex justify-center shrink-0 w-full">
                    <span
                      className={cn(
                        'text-sm font-bold tracking-tight',
                        isSelected ? 'text-orange-300' : 'text-orange-400'
                      )}
                    >
                      {Math.round(actual)}
                    </span>
                  </div>

                  {/* 5. Ideal Points */}
                  <div className="flex justify-center shrink-0 w-full">
                    <span
                      className={cn(
                        'text-sm font-bold tracking-tight',
                        isSelected ? 'text-emerald-300' : 'text-emerald-400'
                      )}
                    >
                      {Math.round(ideal)}
                    </span>
                  </div>

                  {/* 6. Total Points */}
                  <div className="flex justify-center shrink-0 w-full">
                    <span
                      className={cn(
                        'text-sm font-bold tracking-tight',
                        isSelected ? 'text-yellow-300' : 'text-yellow-400'
                      )}
                    >
                      {Math.round(user.total_points || 0)}
                    </span>
                  </div>

                  {/* Desktop Visual Cue (Arrow) */}
                  {isSelected && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 hidden lg:block">
                      <div className="w-1 h-4 bg-primary rounded-r-full shadow-[0_0_10px_rgba(var(--primary-rgb),0.8)]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </ElegantCard>
  );
}
