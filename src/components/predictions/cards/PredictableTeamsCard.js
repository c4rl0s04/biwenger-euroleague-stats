'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  Table,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableCell,
  TableIdentity,
} from '@/components/ui';
import { Target, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

function SortableHeader({ label, sortKey, currentSort, onSort, className, color }) {
  const isSorted = currentSort.key === sortKey;

  return (
    <TableHeaderCell
      className={cn('cursor-pointer select-none hover:bg-white/5 transition-colors', className)}
      onClick={() => onSort(sortKey)}
      color={color}
    >
      <div className="flex items-center justify-center gap-1">
        {label}
        {isSorted ? (
          currentSort.direction === 'asc' ? (
            <ArrowUp className="w-3 h-3 text-primary" />
          ) : (
            <ArrowDown className="w-3 h-3 text-primary" />
          )
        ) : (
          <ArrowUpDown className="w-3 h-3 text-slate-400/30" />
        )}
      </div>
    </TableHeaderCell>
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
      <Table>
        <TableHeader>
          {/* Top Header Row - Groups */}
          <TableRow hovering={false}>
            <TableHeaderCell align="left" className="w-[25%] px-3">
              Equipo
            </TableHeaderCell>
            <TableHeaderCell className="w-[15%]">Global</TableHeaderCell>
            <TableHeaderCell
              colSpan={2}
              color="blue"
              className="font-bold border-b border-blue-500/20 w-[30%]"
            >
              Predicción: Victoria
            </TableHeaderCell>
            <TableHeaderCell
              colSpan={2}
              color="orange"
              className="font-bold border-b border-orange-500/20 w-[30%]"
            >
              Predicción: Derrota
            </TableHeaderCell>
          </TableRow>
          {/* Sub Header Row - Columns */}
          <TableRow hovering={false} className="text-[10px]">
            <TableHeaderCell className="pl-3">{/* Spacer for Team Name */}</TableHeaderCell>
            <SortableHeader
              label="% Ac."
              sortKey="percentage"
              currentSort={sortConfig}
              onSort={requestSort}
              color="green"
              className="font-bold"
            />
            {/* Win Pred Columns */}
            <SortableHeader
              label="Total"
              sortKey="predicted_wins"
              currentSort={sortConfig}
              onSort={requestSort}
              color="blue"
              className="font-normal opacity-70"
            />
            <SortableHeader
              label="% Acierto"
              sortKey="winAccuracy"
              currentSort={sortConfig}
              onSort={requestSort}
              color="blue"
              className="font-normal opacity-70"
            />
            {/* Loss Pred Columns */}
            <SortableHeader
              label="Total"
              sortKey="predicted_losses"
              currentSort={sortConfig}
              onSort={requestSort}
              color="orange"
              className="font-normal opacity-70"
            />
            <SortableHeader
              label="% Acierto"
              sortKey="lossAccuracy"
              currentSort={sortConfig}
              onSort={requestSort}
              color="orange"
              className="font-normal opacity-70"
            />
          </TableRow>
        </TableHeader>
        <tbody>
          {sortedTeams.map((team, index) => {
            const isTop =
              index === 0 && sortConfig.key === 'percentage' && sortConfig.direction === 'desc';

            return (
              <TableRow key={team.id} className={isTop ? 'bg-emerald-500/5' : ''}>
                <TableCell align="left" className="pl-3">
                  <TableIdentity
                    name={team.name}
                    image={team.img}
                    color={isTop ? 'text-emerald-500' : 'text-slate-200'}
                    size="sm"
                    className="!p-0"
                  />
                </TableCell>

                {/* Global % */}
                <TableCell color="emerald">{Math.round(team.percentage)}%</TableCell>

                {/* Win Predictions */}
                <TableCell className="text-slate-400">
                  {team.predicted_wins > 0 ? team.predicted_wins : '-'}
                </TableCell>
                <TableCell
                  color={team.winAccuracy !== -1 && team.winAccuracy >= 50 ? 'blue' : null}
                  className={cn(
                    team.winAccuracy !== -1 && team.winAccuracy >= 50 ? '' : 'text-slate-500'
                  )}
                >
                  {team.winAccuracy !== -1 ? `${Math.round(team.winAccuracy)}%` : '-'}
                </TableCell>

                {/* Loss Predictions */}
                <TableCell className="text-slate-400">
                  {team.predicted_losses > 0 ? team.predicted_losses : '-'}
                </TableCell>
                <TableCell
                  color={team.lossAccuracy !== -1 && team.lossAccuracy >= 50 ? 'orange' : null}
                  className={cn(
                    team.lossAccuracy !== -1 && team.lossAccuracy >= 50 ? '' : 'text-slate-500'
                  )}
                >
                  {team.lossAccuracy !== -1 ? `${Math.round(team.lossAccuracy)}%` : '-'}
                </TableCell>
              </TableRow>
            );
          })}
        </tbody>
      </Table>
    </Card>
  );
}
