'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowUpDown, ArrowUp, ArrowDown, Trophy } from 'lucide-react';
import { getColorForUser } from '@/lib/constants/colors';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';

export default function StandingsTable({ standings }) {
  const [sortConfig, setSortConfig] = useState({ key: 'points', direction: 'desc' });

  // Columns Configuration
  const columns = useMemo(
    () => [
      {
        key: 'position',
        label: 'Pos',
        className: 'w-16 text-center',
        activeColor: 'text-amber-500',
      },
      {
        key: 'user_name',
        label: 'Equipo',
        className: 'text-left',
        activeColor: 'text-amber-500',
      },
      {
        key: 'points',
        label: 'Pts',
        className: 'text-right font-black text-primary group-hover/col:text-primary/80',
        activeColor: 'text-primary',
      },
      {
        key: 'played',
        label: 'PJ',
        className: 'text-right text-white',
        getValue: (row) => row.won + row.lost + (row.drawn || 0),
        activeColor: 'text-white',
      },
      {
        key: 'won',
        label: 'V',
        className: 'text-center hidden sm:table-cell text-green-400',
        activeColor: 'text-green-400',
      },
      {
        key: 'drawn',
        label: 'E',
        className: 'text-center hidden sm:table-cell text-zinc-400',
        getValue: (row) => row.drawn || 0,
        activeColor: 'text-zinc-400',
      },
      {
        key: 'lost',
        label: 'D',
        className: 'text-center hidden sm:table-cell text-red-400',
        activeColor: 'text-red-400',
      },
      {
        key: 'scored',
        label: 'GF',
        className: 'text-center hidden md:table-cell text-zinc-400',
        activeColor: 'text-zinc-400',
      },
      {
        key: 'against',
        label: 'GC',
        className: 'text-center hidden md:table-cell text-zinc-500',
        activeColor: 'text-zinc-500',
      },
      {
        key: 'diff',
        label: 'DIF',
        className: 'text-right hidden sm:table-cell',
        getValue: (row) => row.scored - row.against,
        activeColor: 'text-zinc-400',
      },
    ],
    []
  );

  const handleSort = (key) => {
    setSortConfig((current) => {
      if (current.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'desc' }; // Default to descending for new sort
    });
  };

  const sortedData = useMemo(() => {
    if (!standings) return [];

    return [...standings].sort((a, b) => {
      const getDateValue = (row, key) => {
        const col = columns.find((c) => c.key === key);
        if (col && col.getValue) return col.getValue(row);
        return row[key];
      };

      const aValue = getDateValue(a, sortConfig.key);
      const bValue = getDateValue(b, sortConfig.key);

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [standings, sortConfig, columns]);

  if (!standings || standings.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">No hay clasificación disponible.</div>
    );
  }

  return (
    <ElegantCard className="w-full">
      <div className="overflow-x-auto -mx-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-zinc-500 border-b border-white/5 bg-white/5">
              {columns.map((col) => (
                <th
                  key={col.key}
                  title={col.title}
                  className={`px-4 py-3 font-medium cursor-pointer transition-colors hover:text-white group/col ${col.className}`}
                  onClick={() => handleSort(col.key)}
                >
                  <div
                    className={`flex items-center gap-1 ${
                      col.className.includes('text-right')
                        ? 'justify-end'
                        : col.className.includes('text-center')
                          ? 'justify-center'
                          : 'justify-start'
                    }`}
                  >
                    {/* Arrow logic similar to StatsTable */}
                    {col.className.includes('text-right') ||
                    col.className.includes('text-center') ? (
                      <span
                        className={`transition-opacity ${
                          sortConfig.key === col.key
                            ? `opacity-100 ${col.activeColor}`
                            : 'opacity-0 group-hover/col:opacity-30'
                        }`}
                      >
                        {sortConfig.key === col.key ? (
                          sortConfig.direction === 'asc' ? (
                            <ArrowUp size={12} />
                          ) : (
                            <ArrowDown size={12} />
                          )
                        ) : (
                          <ArrowUpDown size={12} />
                        )}
                      </span>
                    ) : null}

                    {col.label}

                    {!col.className.includes('text-right') &&
                    !col.className.includes('text-center') ? (
                      <span
                        className={`transition-opacity ${
                          sortConfig.key === col.key
                            ? `opacity-100 ${col.activeColor}`
                            : 'opacity-0 group-hover/col:opacity-30'
                        }`}
                      >
                        {sortConfig.key === col.key ? (
                          sortConfig.direction === 'asc' ? (
                            <ArrowUp size={12} />
                          ) : (
                            <ArrowDown size={12} />
                          )
                        ) : (
                          <ArrowUpDown size={12} />
                        )}
                      </span>
                    ) : null}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sortedData.map((row, index) => {
              const played = row.won + row.lost + (row.drawn || 0);
              const dif = row.scored - row.against;
              const isLeader = index === 0;

              return (
                <tr key={row.user_id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-4 py-3 text-center font-medium">
                    {row.position === 1 ? (
                      <Trophy size={14} className="text-amber-500 mx-auto" />
                    ) : (
                      <span className={`text-xs ${isLeader ? 'text-amber-500' : 'text-zinc-500'}`}>
                        {row.position}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/user/${row.user_id}`}
                        className="group/user flex items-center gap-3"
                      >
                        <div className="relative w-8 h-8 rounded-full overflow-hidden bg-zinc-800 shrink-0 border border-white/10 group-hover/user:border-white/30 transition-colors">
                          {row.user_icon ? (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={
                                  row.user_icon.startsWith('http')
                                    ? row.user_icon
                                    : `https://cdn.biwenger.com/${row.user_icon}`
                                }
                                alt={row.user_name}
                                className="w-full h-full object-cover"
                              />
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-500">
                              {row.user_name?.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <span
                          className={`font-medium transition-colors truncate max-w-[150px] sm:max-w-none ${
                            getColorForUser(row.user_id, row.user_name).text
                          } group-hover/user:opacity-80`}
                        >
                          {row.user_name}
                        </span>
                      </Link>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-right font-black text-primary font-mono text-base">
                    {row.points}
                  </td>

                  <td className="px-4 py-3 text-right text-white font-bold">{played}</td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell text-green-400/90 font-medium">
                    {row.won}
                  </td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell text-zinc-400/90 font-medium">
                    {row.drawn || 0}
                  </td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell text-red-400/90 font-medium">
                    {row.lost}
                  </td>

                  <td className="px-4 py-3 text-center text-zinc-400 hidden md:table-cell">
                    {row.scored}
                  </td>
                  <td className="px-4 py-3 text-center text-zinc-500 hidden md:table-cell">
                    {row.against}
                  </td>

                  <td
                    className={`px-4 py-3 text-right font-medium hidden sm:table-cell ${
                      dif > 0 ? 'text-emerald-500' : dif < 0 ? 'text-rose-500' : 'text-zinc-500'
                    }`}
                  >
                    {dif > 0 ? '+' : ''}
                    {dif}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </ElegantCard>
  );
}
