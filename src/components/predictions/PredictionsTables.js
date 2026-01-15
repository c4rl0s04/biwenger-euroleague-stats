'use client';

import { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

function SortableHeader({ label, sortKey, currentSort, onSort, align = 'center' }) {
  const isSorted = currentSort.key === sortKey;

  return (
    <th
      className={cn(
        'px-6 py-3 cursor-pointer select-none hover:bg-muted/50 transition-colors text-muted-foreground font-medium text-xs uppercase tracking-wider',
        align === 'left' ? 'text-left' : 'text-center'
      )}
      onClick={() => onSort(sortKey)}
    >
      <div
        className={cn(
          'flex items-center gap-2',
          align === 'left' ? 'justify-start' : 'justify-center'
        )}
      >
        {label}
        {isSorted ? (
          currentSort.direction === 'asc' ? (
            <ArrowUp className="w-3 h-3 text-primary" />
          ) : (
            <ArrowDown className="w-3 h-3 text-primary" />
          )
        ) : (
          <ArrowUpDown className="w-3 h-3 text-muted-foreground/50" />
        )}
      </div>
    </th>
  );
}

export function StatsTable({ data }) {
  const [sortConfig, setSortConfig] = useState({ key: 'promedio', direction: 'desc' });

  const sortedData = useMemo(() => {
    if (!data) return [];

    let sortableItems = [...data];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle numeric strings if any
        if (!isNaN(parseFloat(aValue)) && isFinite(aValue)) {
          aValue = parseFloat(aValue);
          bValue = parseFloat(bValue);
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [data, sortConfig]);

  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const getColorClass = (val) => {
    if (val >= 6) return 'text-green-500 font-bold';
    if (val >= 5) return 'text-emerald-500 font-bold';
    if (val >= 4) return 'text-yellow-500 font-medium';
    if (val >= 3) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
      <div className="p-6 border-b border-border bg-muted/20">
        <h2 className="text-lg font-bold text-foreground">Estadísticas Detalladas</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <SortableHeader
                label="Jugador"
                sortKey="usuario"
                currentSort={sortConfig}
                onSort={requestSort}
                align="left"
              />
              <SortableHeader
                label="Promedio"
                sortKey="promedio"
                currentSort={sortConfig}
                onSort={requestSort}
              />
              <SortableHeader
                label="Jornadas"
                sortKey="jornadas_jugadas"
                currentSort={sortConfig}
                onSort={requestSort}
              />
              <SortableHeader
                label="Total"
                sortKey="total_aciertos"
                currentSort={sortConfig}
                onSort={requestSort}
              />
              <SortableHeader
                label="Mejor"
                sortKey="mejor_jornada"
                currentSort={sortConfig}
                onSort={requestSort}
              />
              <SortableHeader
                label="Peor"
                sortKey="peor_jornada"
                currentSort={sortConfig}
                onSort={requestSort}
              />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sortedData.map((row, idx) => (
              <tr key={idx} className="hover:bg-muted/30 transition-colors group">
                <td className="px-6 py-4 font-medium text-foreground group-hover:text-primary transition-colors">
                  {row.usuario}
                </td>
                <td
                  className={`px-6 py-4 text-center font-mono ${getColorClass(Number(row.promedio))}`}
                >
                  {Number(row.promedio).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-center text-muted-foreground">
                  {row.jornadas_jugadas}
                </td>
                <td className="px-6 py-4 text-center text-foreground font-mono font-medium">
                  {row.total_aciertos}
                </td>
                <td className="px-6 py-4 text-center text-blue-500 font-mono">
                  {row.mejor_jornada}
                </td>
                <td className="px-6 py-4 text-center text-red-500 font-mono">{row.peor_jornada}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function HistoryTable({ history }) {
  if (!history) return null;
  const { users, jornadas } = history;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
      <div className="p-6 border-b border-border bg-muted/20">
        <h2 className="text-lg font-bold text-foreground">Histórico por Jornadas</h2>
      </div>
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="text-xs uppercase bg-muted/50 sticky top-0 z-20">
            <tr>
              <th className="px-6 py-3 whitespace-nowrap bg-card z-30 sticky left-0 border-b border-r border-border font-medium text-muted-foreground min-w-[120px]">
                Jornada
              </th>
              {users.map((user) => (
                <th
                  key={user}
                  className="px-4 py-3 text-center whitespace-nowrap min-w-[100px] border-b border-border font-medium text-muted-foreground"
                >
                  {user}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {jornadas.map((row) => (
              <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-3 font-medium text-foreground whitespace-nowrap bg-card z-10 sticky left-0 border-r border-border shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]">
                  {row.name}
                </td>
                {users.map((user) => {
                  const score = row.scores[user];
                  let colorClass = 'text-muted-foreground/30';
                  if (score !== null && score !== undefined) {
                    if (score >= 7) colorClass = 'text-green-500 font-black scale-110 inline-block';
                    else if (score >= 5) colorClass = 'text-emerald-500 font-bold';
                    else if (score >= 4) colorClass = 'text-yellow-500 font-medium';
                    else if (score >= 3) colorClass = 'text-orange-500';
                    else colorClass = 'text-red-500';
                  }

                  return (
                    <td
                      key={user}
                      className="px-4 py-3 text-center font-mono text-sm border-l border-border/30 first:border-l-0"
                    >
                      <span className={colorClass}>{score ?? '-'}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
