'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { getColorForUser } from '@/lib/constants/colors';

export function StatsTable({ data, title, type = 'global' }) {
  const [sortConfig, setSortConfig] = useState({ key: 'points', direction: 'desc' });

  // Columns Configuration
  // Columns Configuration
  const columns = useMemo(
    () => [
      { key: 'index', label: '#', className: 'w-16 text-center' },
      { key: 'name', label: 'Jugador', className: 'text-left', activeColor: 'text-amber-500' },
      {
        key: 'points',
        label: 'Pts',
        className: 'text-right font-black text-indigo-400 group-hover/col:text-indigo-300',
        activeColor: 'text-indigo-400',
      },
      {
        key: 'form',
        label: 'Racha',
        className: 'text-center hidden md:table-cell',
        activeColor: 'text-zinc-400',
      },
      { key: 'played', label: 'PJ', className: 'text-right text-white', activeColor: 'text-white' },
      {
        key: 'won',
        label: 'V',
        className: 'text-right text-green-400',
        activeColor: 'text-green-400',
      },
      {
        key: 'drawn',
        label: 'E',
        className: 'text-right text-zinc-400',
        activeColor: 'text-zinc-400',
      },
      {
        key: 'lost',
        label: 'D',
        className: 'text-right text-red-400',
        activeColor: 'text-red-400',
      },
      {
        key: 'gf',
        label: 'PF',
        className: 'text-right hidden sm:table-cell',
        getValue: (row) => (type === 'league' ? row.scored : row.gf),
        activeColor: 'text-zinc-400',
      },
      {
        key: 'ga',
        label: 'PC',
        className: 'text-right hidden sm:table-cell',
        getValue: (row) => (type === 'league' ? row.against : row.ga),
        activeColor: 'text-zinc-500',
      },
      {
        key: 'dif',
        label: 'DIF',
        className: 'text-right hidden sm:table-cell',
        getValue: (row) =>
          (type === 'league' ? row.scored : row.gf) - (type === 'league' ? row.against : row.ga),
        activeColor: 'text-zinc-400',
      },
    ],
    [type]
  );

  const handleSort = (key) => {
    setSortConfig((current) => {
      if (current.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'desc' };
    });
  };

  const sortedData = useMemo(() => {
    if (!data) return [];

    return [...data].sort((a, b) => {
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
  }, [data, sortConfig, columns]);

  if (!data || data.length === 0) return null;

  return (
    <div className="w-full overflow-hidden rounded-xl border border-white/5 bg-card/20 backdrop-blur-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/5">
        <h3 className="text-lg font-bold text-white font-display ml-2">{title}</h3>
        <span className="text-xs text-zinc-500 uppercase font-medium tracking-wider px-3 py-1 rounded-full bg-black/20">
          {type === 'league' ? 'Solo Ligas' : 'Global (Todo)'}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-zinc-500 border-b border-white/5">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 font-medium cursor-pointer transition-colors hover:text-white group/col ${col.className}`}
                  onClick={() => col.key !== 'index' && handleSort(col.key)}
                >
                  <div
                    className={`flex items-center gap-1 ${col.className.includes('text-right') ? 'justify-end' : col.className.includes('text-center') ? 'justify-center' : 'justify-start'}`}
                  >
                    {/* For right-aligned columns, put arrow on left to keep label right-aligned */}
                    {col.key !== 'index' && col.className.includes('text-right') && (
                      <span
                        className={`transition-opacity ${sortConfig.key === col.key ? `opacity-100 ${col.activeColor}` : 'opacity-0 group-hover/col:opacity-30'}`}
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
                    )}

                    {col.label}

                    {/* For other columns (left/center), put arrow on right */}
                    {col.key !== 'index' && !col.className.includes('text-right') && (
                      <span
                        className={`transition-opacity ${sortConfig.key === col.key ? `opacity-100 ${col.activeColor}` : 'opacity-0 group-hover/col:opacity-30'}`}
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
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sortedData.map((row, index) => {
              const pf = type === 'league' ? row.scored : row.gf;
              const pc = type === 'league' ? row.against : row.ga;
              const dif = pf - pc;

              return (
                <tr key={row.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-4 py-3 text-center text-zinc-500 font-mono text-xs">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link href={`/user/${row.id}`} className="group/user flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-800 shrink-0 border border-white/10 group-hover/user:border-white/30 transition-colors">
                          {row.icon ? (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={
                                  row.icon.startsWith('http')
                                    ? row.icon
                                    : `https://cdn.biwenger.com/${row.icon}`
                                }
                                alt={row.name}
                                className="w-full h-full object-cover"
                              />
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-500">
                              {row.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <span
                          className={`font-medium transition-colors truncate max-w-[150px] sm:max-w-none ${
                            getColorForUser(row.id, row.name, row.colorIndex).text
                          } group-hover/user:opacity-80`}
                        >
                          {row.name}
                        </span>
                      </Link>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-right font-black text-indigo-400 font-mono text-base">
                    {row.points}
                  </td>

                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex items-center justify-center gap-1">
                      {row.form &&
                        row.form.map((result, i) => (
                          <div
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full ${
                              result === 'W'
                                ? 'bg-green-500'
                                : result === 'D'
                                  ? 'bg-zinc-500'
                                  : 'bg-red-500'
                            }`}
                            title={
                              result === 'W' ? 'Victoria' : result === 'D' ? 'Empate' : 'Derrota'
                            }
                          />
                        ))}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-right text-white font-bold">{row.played}</td>
                  <td className="px-4 py-3 text-right text-green-400/90 font-medium">{row.won}</td>
                  <td className="px-4 py-3 text-right text-zinc-400/90 font-medium">{row.drawn}</td>
                  <td className="px-4 py-3 text-right text-red-400/90 font-medium">{row.lost}</td>

                  <td className="px-4 py-3 text-right text-zinc-400 hidden sm:table-cell">{pf}</td>
                  <td className="px-4 py-3 text-right text-zinc-500 hidden sm:table-cell">{pc}</td>

                  <td
                    className={`px-4 py-3 text-right font-medium hidden sm:table-cell ${
                      dif > 0 ? 'text-emerald-500' : 'text-rose-500'
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
    </div>
  );
}
