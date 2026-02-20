'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui';
import { Target, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

function SortableHeader({ label, sortKey, currentSort, onSort, className }) {
  const isSorted = currentSort.key === sortKey;

  return (
    <th
      className={cn('cursor-pointer select-none hover:bg-muted/50 transition-colors', className)}
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center justify-center gap-1">
        {label}
        {isSorted ? (
          currentSort.direction === 'asc' ? (
            <ArrowUp className="w-3 h-3 text-foreground" />
          ) : (
            <ArrowDown className="w-3 h-3 text-foreground" />
          )
        ) : (
          <ArrowUpDown className="w-3 h-3 text-muted-foreground/30" />
        )}
      </div>
    </th>
  );
}

export function PredictableTeamsCard({ teams }) {
  const [sortConfig, setSortConfig] = useState({ key: 'percentage', direction: 'desc' });

  // Process and sort data
  const sortedTeams = useMemo(() => {
    if (!teams) return [];

    // Pre-calculate derived values for sorting
    const processed = teams.map((team) => {
      const winAcc = team.predicted_wins > 0 ? (team.correct_wins / team.predicted_wins) * 100 : -1; // -1 for "no data" to sort to bottom

      const lossAcc =
        team.predicted_losses > 0 ? (team.correct_losses / team.predicted_losses) * 100 : -1;

      return {
        ...team,
        winAccuracy: winAcc,
        lossAccuracy: lossAcc,
        // Ensure numeric sorting for raw values
        percentage: Number(team.percentage),
        predicted_wins: Number(team.predicted_wins),
        predicted_losses: Number(team.predicted_losses),
      };
    });

    return processed.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [teams, sortConfig]);

  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  if (!teams || teams.length === 0) {
    return (
      <Card title="Equipos Predecibles" icon={Target} color="green" className="h-full">
        <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
          No hay suficientes datos
        </div>
      </Card>
    );
  }

  return (
    <Card title="Equipos Predecibles" icon={Target} color="green" className="h-full">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            {/* Top Header Row - Groups */}
            <tr className="border-b border-border/50 text-muted-foreground">
              <th className="py-2 pl-3 font-medium text-left w-[25%]">Equipo</th>
              <th className="py-2 px-1 text-center font-medium w-[15%]">Global</th>
              <th
                colSpan={2}
                className="py-2 px-1 text-center font-bold text-blue-400/80 border-b border-blue-500/20 w-[30%]"
              >
                Predicción: Victoria
              </th>
              <th
                colSpan={2}
                className="py-2 px-1 text-center font-bold text-orange-400/80 border-b border-orange-500/20 w-[30%]"
              >
                Predicción: Derrota
              </th>
            </tr>
            {/* Sub Header Row - Columns */}
            <tr className="text-[10px] text-muted-foreground border-b border-border/50">
              <th className="py-2 pl-3">{/* Spacer for Team Name */}</th>
              <SortableHeader
                label="% Ac."
                sortKey="percentage"
                currentSort={sortConfig}
                onSort={requestSort}
                className="py-2 px-1 text-center font-bold text-green-500 hover:text-green-400"
              />
              {/* Win Pred Columns */}
              <SortableHeader
                label="Total"
                sortKey="predicted_wins"
                currentSort={sortConfig}
                onSort={requestSort}
                className="py-2 px-1 text-center font-normal text-blue-300/70 hover:text-blue-300"
              />
              <SortableHeader
                label="% Acierto"
                sortKey="winAccuracy"
                currentSort={sortConfig}
                onSort={requestSort}
                className="py-2 px-1 text-center font-normal text-blue-300/70 hover:text-blue-300"
              />
              {/* Loss Pred Columns */}
              <SortableHeader
                label="Total"
                sortKey="predicted_losses"
                currentSort={sortConfig}
                onSort={requestSort}
                className="py-2 px-1 text-center font-normal text-orange-300/70 hover:text-orange-300"
              />
              <SortableHeader
                label="% Acierto"
                sortKey="lossAccuracy"
                currentSort={sortConfig}
                onSort={requestSort}
                className="py-2 px-1 text-center font-normal text-orange-300/70 hover:text-orange-300"
              />
            </tr>
          </thead>
          <tbody>
            {sortedTeams.map((team, index) => {
              const isTop =
                index === 0 && sortConfig.key === 'percentage' && sortConfig.direction === 'desc';

              return (
                <tr
                  key={team.id}
                  className={`border-b border-border/30 last:border-0 hover:bg-muted/10 transition-colors ${
                    isTop ? 'bg-green-500/5' : ''
                  }`}
                >
                  {/* Team Name & Logo */}
                  <td className="py-3 pl-3 flex items-center gap-3">
                    <div className="relative w-8 h-8 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={team.img}
                        alt={team.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span
                      className={`font-bold text-sm whitespace-nowrap ${
                        isTop ? 'text-green-500' : 'text-slate-200'
                      }`}
                    >
                      {team.name}
                    </span>
                  </td>

                  {/* Global % */}
                  <td className="py-3 px-1 text-center font-black text-green-400 text-lg">
                    {Math.round(team.percentage)}%
                  </td>

                  {/* Win Predictions */}
                  <td className="py-3 px-1 text-center text-muted-foreground text-sm font-medium">
                    {team.predicted_wins > 0 ? team.predicted_wins : '-'}
                  </td>
                  <td
                    className={`py-3 px-1 text-center font-bold text-base ${
                      team.winAccuracy !== -1 && team.winAccuracy >= 50
                        ? 'text-blue-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {team.winAccuracy !== -1 ? `${Math.round(team.winAccuracy)}%` : '-'}
                  </td>

                  {/* Loss Predictions */}
                  <td className="py-3 px-1 text-center text-muted-foreground text-sm font-medium">
                    {team.predicted_losses > 0 ? team.predicted_losses : '-'}
                  </td>
                  <td
                    className={`py-3 px-1 text-center font-bold text-base ${
                      team.lossAccuracy !== -1 && team.lossAccuracy >= 50
                        ? 'text-orange-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {team.lossAccuracy !== -1 ? `${Math.round(team.lossAccuracy)}%` : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
