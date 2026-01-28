'use client';

import { useMemo } from 'react';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

/**
 * PersonalBreakdownTable - Round-by-round stats table for a single user
 * Shows: Round, Actual Points, Ideal Points, Lost Points, Efficiency
 */
export default function PersonalBreakdownTable({ history = [] }) {
  const sortedHistory = useMemo(() => {
    return [...history].sort((a, b) => a.round_number - b.round_number);
  }, [history]);

  if (!history || history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No hay datos de historial disponibles
      </div>
    );
  }

  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="py-3 px-2 font-semibold text-muted-foreground">Jornada</th>
            <th className="py-3 px-2 font-semibold text-muted-foreground text-right">Real</th>
            <th className="py-3 px-2 font-semibold text-muted-foreground text-right">Ideal</th>
            <th className="py-3 px-2 font-semibold text-muted-foreground text-right">Perdidos</th>
            <th className="py-3 px-2 font-semibold text-muted-foreground text-right">Eficiencia</th>
          </tr>
        </thead>
        <tbody>
          {sortedHistory.map((round) => {
            const lost = round.ideal_points - round.actual_points;
            const effColor =
              round.efficiency >= 90
                ? 'text-emerald-400'
                : round.efficiency >= 75
                  ? 'text-yellow-400'
                  : 'text-red-400';

            return (
              <tr
                key={round.round_id}
                className="border-b border-border/50 hover:bg-white/5 transition-colors"
              >
                <td className="py-2.5 px-2 text-foreground font-medium">J{round.round_number}</td>
                <td className="py-2.5 px-2 text-right text-foreground">
                  {round.actual_points.toFixed(0)}
                </td>
                <td className="py-2.5 px-2 text-right text-muted-foreground">
                  {round.ideal_points.toFixed(0)}
                </td>
                <td className="py-2.5 px-2 text-right">
                  <span className="inline-flex items-center gap-1 text-red-400">
                    {lost > 0 ? (
                      <>
                        <TrendingDown size={12} />-{lost.toFixed(0)}
                      </>
                    ) : lost < 0 ? (
                      <>
                        <TrendingUp size={12} />+{Math.abs(lost).toFixed(0)}
                      </>
                    ) : (
                      <>
                        <Minus size={12} />0
                      </>
                    )}
                  </span>
                </td>
                <td className={`py-2.5 px-2 text-right font-medium ${effColor}`}>
                  {round.efficiency.toFixed(1)}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
