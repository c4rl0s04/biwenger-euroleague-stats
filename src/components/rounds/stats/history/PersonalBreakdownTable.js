'use client';

import { useMemo, useState } from 'react';

const CHART_HEIGHT = 280; // Height in pixels for the chart area

/**
 * PersonalBreakdownChart - Visual bar chart showing actual vs ideal points per round
 * Each bar shows actual points (solid) + lost points (semi-transparent)
 */
export default function PersonalBreakdownTable({ history = [] }) {
  const [hoveredRound, setHoveredRound] = useState(null);

  const sortedHistory = useMemo(() => {
    return [...history].sort((a, b) => a.round_number - b.round_number);
  }, [history]);

  // Find max ideal points for scaling
  const maxIdeal = useMemo(() => {
    if (!sortedHistory.length) return 300;
    return Math.max(...sortedHistory.map((r) => r.ideal_points));
  }, [sortedHistory]);

  if (!history || history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No hay datos de historial disponibles
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Chart container */}
      <div
        className="flex items-end gap-1 px-2 pb-6 relative"
        style={{ height: CHART_HEIGHT + 24 }}
      >
        {/* Y-axis labels */}
        <div
          className="absolute left-0 top-0 flex flex-col justify-between text-xs text-muted-foreground w-8"
          style={{ height: CHART_HEIGHT }}
        >
          <span>{Math.round(maxIdeal)}</span>
          <span>{Math.round(maxIdeal / 2)}</span>
          <span>0</span>
        </div>

        {/* Bars container */}
        <div className="flex items-end gap-1 flex-1 ml-10" style={{ height: CHART_HEIGHT }}>
          {sortedHistory.map((round) => {
            const lost = Math.max(0, round.ideal_points - round.actual_points);
            const actualHeight = (round.actual_points / maxIdeal) * CHART_HEIGHT;
            const lostHeight = (lost / maxIdeal) * CHART_HEIGHT;
            const isHovered = hoveredRound === round.round_id;

            // Color based on efficiency
            const barColor =
              round.efficiency >= 90
                ? 'bg-emerald-500'
                : round.efficiency >= 80
                  ? 'bg-yellow-500'
                  : round.efficiency >= 70
                    ? 'bg-orange-500'
                    : 'bg-red-500';

            const lostColor =
              round.efficiency >= 90
                ? 'bg-emerald-500/30'
                : round.efficiency >= 80
                  ? 'bg-yellow-500/30'
                  : round.efficiency >= 70
                    ? 'bg-orange-500/30'
                    : 'bg-red-500/30';

            return (
              <div
                key={round.round_id}
                className="flex-1 flex flex-col justify-end items-center relative cursor-pointer"
                style={{ height: CHART_HEIGHT }}
                onMouseEnter={() => setHoveredRound(round.round_id)}
                onMouseLeave={() => setHoveredRound(null)}
              >
                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute -top-20 left-1/2 -translate-x-1/2 bg-zinc-800 border border-border rounded-lg px-3 py-2 text-xs z-10 whitespace-nowrap shadow-lg">
                    <div className="text-foreground font-medium">Jornada {round.round_number}</div>
                    <div className="text-emerald-400">Real: {round.actual_points.toFixed(0)}</div>
                    <div className="text-muted-foreground">
                      Ideal: {round.ideal_points.toFixed(0)}
                    </div>
                    <div className="text-red-400">Perdidos: -{lost.toFixed(0)}</div>
                    <div className="text-yellow-400">
                      Eficiencia: {round.efficiency.toFixed(1)}%
                    </div>
                  </div>
                )}

                {/* Lost portion (semi-transparent, on top) */}
                {lost > 0 && (
                  <div
                    className={`w-full rounded-t transition-all duration-200 ${lostColor} ${isHovered ? 'opacity-80' : ''}`}
                    style={{ height: lostHeight, minHeight: 2 }}
                  />
                )}
                {/* Actual portion (solid, bottom) */}
                <div
                  className={`w-full ${lost > 0 ? '' : 'rounded-t'} rounded-b transition-all duration-200 ${barColor} ${isHovered ? 'brightness-125' : ''}`}
                  style={{ height: actualHeight, minHeight: 4 }}
                />

                {/* X-axis label */}
                <div className="absolute -bottom-5 text-xs text-muted-foreground whitespace-nowrap">
                  {round.round_number}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-emerald-500" />
          <span>Puntos reales</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-emerald-500/30" />
          <span>Puntos perdidos</span>
        </div>
      </div>
    </div>
  );
}
