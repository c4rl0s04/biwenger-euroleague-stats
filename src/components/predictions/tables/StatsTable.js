import { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getColorForUser } from '@/lib/constants/colors';
import { Card } from '@/components/ui';

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
            <ArrowUp className="w-3 h-3 text-cyan-500" />
          ) : (
            <ArrowDown className="w-3 h-3 text-cyan-500" />
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
    <Card title="Estadísticas Detalladas" icon={BarChart3} color="cyan">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-muted/50 border-y border-border/50">
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
          <tbody className="divide-y divide-border/50 border-b border-border/50">
            {sortedData.map((row, idx) => {
              const colorInfo = getColorForUser(row.user_id, row.usuario, row.color_index);
              const userColor = colorInfo.text;

              return (
                <tr key={idx} className="hover:bg-muted/30 transition-colors group">
                  <td
                    className={cn(
                      'px-6 py-4 font-bold transition-colors text-lg tracking-tight',
                      userColor
                    )}
                  >
                    {row.usuario}
                  </td>
                  <td
                    className={`px-6 py-4 text-center font-mono text-lg ${getColorClass(Number(row.promedio))}`}
                  >
                    {Number(row.promedio).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-center text-muted-foreground text-base">
                    {row.jornadas_jugadas}
                  </td>
                  <td className="px-6 py-4 text-center text-foreground font-mono font-bold text-lg">
                    {row.total_aciertos}
                  </td>
                  <td className="px-6 py-4 text-center text-blue-500 font-mono text-lg font-bold">
                    {row.mejor_jornada}
                  </td>
                  <td className="px-6 py-4 text-center text-red-500 font-mono text-lg font-bold">
                    {row.peor_jornada}
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
