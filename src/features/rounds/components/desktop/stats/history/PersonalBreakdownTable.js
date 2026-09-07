'use client';

import { useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Table, TableRow, TableCell } from '@/components/ui/StatsTable';

/**
 * PersonalBreakdownTable - Transposed version (Horizontal Scroll) with Navigation Arrows.
 * Fixed scroll logic for better compatibility.
 */
export default function PersonalBreakdownTable({ history = [] }) {
  const scrollRef = useRef(null);

  const sortedHistory = useMemo(() => {
    return [...history].sort((a, b) => b.round_number - a.round_number); // Newest first
  }, [history]);

  if (!history || history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm uppercase font-bold tracking-widest">
        No hay datos de historial disponibles
      </div>
    );
  }

  // Define the rows we want to show
  const metrics = [
    { label: 'Jornada', key: 'round_number', type: 'header' },
    { label: 'Puntos Reales', key: 'actual_points', type: 'points' },
    { label: 'Puntos Ideales', key: 'ideal_points', type: 'points', color: 'text-zinc-400' },
    { label: 'Perdidos', key: 'lost', type: 'lost' },
    { label: 'Eficiencia', key: 'efficiency', type: 'efficiency' },
  ];

  const handleScroll = (direction) => {
    const container = scrollRef.current;
    if (container) {
      const scrollAmount = 300; // Adjusted for better feel
      const targetScroll =
        container.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);

      container.scrollTo({
        left: targetScroll,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="w-full overflow-hidden rounded-xl border border-white/5 bg-zinc-950/20 flex flex-col">
      <div
        ref={scrollRef}
        className="overflow-x-auto custom-scrollbar scroll-smooth w-full"
        style={{ scrollBehavior: 'smooth' }}
      >
        <Table className="border-separate border-spacing-0 w-max min-w-full">
          <tbody>
            {metrics.map((metric, rowIndex) => (
              <TableRow key={metric.label} hovering={rowIndex !== 0}>
                {/* Sticky Label Column */}
                <TableCell
                  align="left"
                  className="sticky left-0 bg-zinc-950 z-20 min-w-[120px] border-r border-white/10 shadow-[4px_0_10px_rgba(0,0,0,0.5)] py-3"
                >
                  <span
                    className={`text-[10px] uppercase font-black tracking-widest ${rowIndex === 0 ? 'text-zinc-500' : 'text-zinc-300'}`}
                  >
                    {metric.label}
                  </span>
                </TableCell>

                {/* Data Columns (Rounds) */}
                {sortedHistory.map((round) => {
                  const lost = Math.max(0, round.ideal_points - round.actual_points);

                  let content;
                  let colorClass = metric.color || 'text-white';

                  if (metric.type === 'header') {
                    content = (
                      <span className="font-display text-xl text-primary drop-shadow-[0_0_8px_rgba(250,80,1,0.3)]">
                        J{round.round_number}
                      </span>
                    );
                  } else if (metric.type === 'points') {
                    content = (
                      <span className={`font-black tabular-nums ${colorClass}`}>
                        {round[metric.key].toFixed(0)}
                      </span>
                    );
                  } else if (metric.type === 'lost') {
                    content = (
                      <span
                        className={`font-bold tabular-nums ${lost > 0 ? 'text-red-500/80' : 'text-zinc-600'}`}
                      >
                        {lost > 0 ? `-${lost.toFixed(0)}` : '0'}
                      </span>
                    );
                  } else if (metric.type === 'efficiency') {
                    const effColor =
                      round.efficiency >= 90
                        ? 'text-emerald-400'
                        : round.efficiency >= 80
                          ? 'text-yellow-400'
                          : round.efficiency >= 70
                            ? 'text-orange-400'
                            : 'text-red-400';

                    content = (
                      <div className="flex flex-col items-center">
                        <span className={`font-black tabular-nums ${effColor}`}>
                          {round.efficiency.toFixed(1)}%
                        </span>
                        <div className="w-8 h-0.5 bg-zinc-800 rounded-full mt-1 overflow-hidden">
                          <div
                            className={`h-full ${effColor.replace('text', 'bg')}`}
                            style={{ width: `${round.efficiency}%` }}
                          />
                        </div>
                      </div>
                    );
                  }

                  return (
                    <TableCell
                      key={`${round.round_id}-${metric.label}`}
                      align="center"
                      className="min-w-[90px] border-r border-white/5 last:border-r-0"
                    >
                      {content}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </tbody>
        </Table>
      </div>

      {/* Navigation Controls */}
      <div className="p-2 bg-zinc-950/60 flex items-center justify-between border-t border-white/5 px-6">
        <button
          onClick={() => handleScroll('left')}
          className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer active:scale-95 border border-white/5"
          title="Desplazar a la izquierda"
        >
          <ChevronLeft size={20} />
        </button>

        <span className="text-[10px] uppercase font-black text-zinc-500 tracking-[0.3em] flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
          Historial
          <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
        </span>

        <button
          onClick={() => handleScroll('right')}
          className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer active:scale-95 border border-white/5"
          title="Desplazar a la derecha"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
