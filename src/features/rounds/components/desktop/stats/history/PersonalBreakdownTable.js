'use client';

import { useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { IconButton } from '@/components/ui/foundation';

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
    {
      label: 'Puntos Ideales',
      key: 'ideal_points',
      type: 'points',
      color: 'text-muted-foreground',
    },
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
    <div className="w-full overflow-hidden rounded-xl border border-border bg-[hsl(var(--surface-card))]/20 flex flex-col">
      <div
        ref={scrollRef}
        role="region"
        aria-label="Historial desplazable"
        tabIndex={0}
        className="overflow-x-auto custom-scrollbar scroll-smooth w-full focus-visible:outline-2 focus-visible:outline-primary"
        style={{ scrollBehavior: 'smooth' }}
      >
        <table
          aria-label="Desglose por jornada"
          className="border-separate border-spacing-0 w-max min-w-full"
        >
          <tbody>
            {metrics.map((metric, rowIndex) => (
              <tr key={metric.label} className="hover:bg-secondary/50">
                {/* Sticky Label Column */}
                <th
                  scope="row"
                  className="sticky left-0 bg-[hsl(var(--surface-card))] z-20 min-w-[120px] border-r border-border shadow-[4px_0_10px_rgba(0,0,0,0.5)] py-3"
                >
                  <span
                    className={`text-[10px] uppercase font-black tracking-widest ${rowIndex === 0 ? 'text-muted-foreground' : 'text-foreground'}`}
                  >
                    {metric.label}
                  </span>
                </th>

                {/* Data Columns (Rounds) */}
                {sortedHistory.map((round) => {
                  const lost = Math.max(0, round.ideal_points - round.actual_points);

                  let content;
                  let colorClass = metric.color || 'text-foreground';

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
                        className={`font-bold tabular-nums ${lost > 0 ? 'text-[var(--round-danger)]/80' : 'text-muted-foreground'}`}
                      >
                        {lost > 0 ? `-${lost.toFixed(0)}` : '0'}
                      </span>
                    );
                  } else if (metric.type === 'efficiency') {
                    const effColor =
                      round.efficiency >= 90
                        ? 'text-[var(--round-ideal)]'
                        : round.efficiency >= 80
                          ? 'text-[var(--round-record)]'
                          : round.efficiency >= 70
                            ? 'text-primary'
                            : 'text-[var(--round-danger)]';

                    content = (
                      <div className="flex flex-col items-center">
                        <span className={`font-black tabular-nums ${effColor}`}>
                          {round.efficiency.toFixed(1)}%
                        </span>
                        <div className="w-8 h-0.5 bg-secondary rounded-full mt-1 overflow-hidden">
                          <div
                            className={`h-full bg-current ${effColor}`}
                            style={{ width: `${round.efficiency}%` }}
                          />
                        </div>
                      </div>
                    );
                  }

                  const Cell = metric.type === 'header' ? 'th' : 'td';
                  return (
                    <Cell
                      scope={metric.type === 'header' ? 'col' : undefined}
                      key={`${round.round_id}-${metric.label}`}
                      className="px-3 py-3 text-center min-w-[90px] border-r border-border last:border-r-0"
                    >
                      {content}
                    </Cell>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Navigation Controls */}
      <div className="p-2 bg-[hsl(var(--surface-card))]/60 flex items-center justify-between border-t border-border px-6">
        <IconButton
          variant="ghost"
          onClick={() => handleScroll('left')}
          className="p-2 rounded-full bg-secondary hover:bg-secondary text-muted-foreground hover:text-foreground transition-all cursor-pointer active:scale-95 border border-border"
          aria-label="Desplazar a la izquierda"
        >
          <ChevronLeft size={20} />
        </IconButton>

        <span className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.3em] flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
          Historial
          <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
        </span>

        <IconButton
          variant="ghost"
          onClick={() => handleScroll('right')}
          className="p-2 rounded-full bg-secondary hover:bg-secondary text-muted-foreground hover:text-foreground transition-all cursor-pointer active:scale-95 border border-border"
          aria-label="Desplazar a la derecha"
        >
          <ChevronRight size={20} />
        </IconButton>
      </div>
    </div>
  );
}
