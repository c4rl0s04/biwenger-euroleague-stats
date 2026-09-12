'use client';

import { useMemo } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { StatsTable } from '@/components/ui';
import { cn } from '@/lib/utils';

export function TournamentHistoryTable({ data, title, type = 'global' }) {
  // Columns Configuration
  const columns = useMemo(
    () => [
      {
        key: 'points',
        label: 'Pts',
        align: 'center',
        // Cambiado: se eliminó font-display, text-lg y uppercase
        className: 'font-bold text-indigo-400',
        headerClassName: 'text-indigo-400',
        sortable: true,
      },
      {
        key: 'form',
        label: 'Racha',
        align: 'center',
        className: 'hidden md:table-cell text-violet-400/80',
        headerClassName: 'text-violet-400',
        render: (form) => (
          <div className="flex items-center justify-center gap-1">
            {form &&
              form.map((result, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    result === 'W' ? 'bg-green-500' : result === 'D' ? 'bg-zinc-500' : 'bg-red-500'
                  )}
                  title={result === 'W' ? 'Victoria' : result === 'D' ? 'Empate' : 'Derrota'}
                />
              ))}
          </div>
        ),
      },
      {
        key: 'played',
        label: 'PJ',
        align: 'center',
        className: 'text-sky-400/90 font-bold',
        headerClassName: 'text-sky-400',
      },
      {
        key: 'won',
        label: 'V',
        align: 'center',
        className: 'text-green-400/90 font-medium',
        headerClassName: 'text-green-400',
      },
      {
        key: 'drawn',
        label: 'E',
        align: 'center',
        className: 'text-amber-400/90 font-medium',
        headerClassName: 'text-amber-400',
      },
      {
        key: 'lost',
        label: 'D',
        align: 'center',
        className: 'text-rose-400/90 font-medium',
        headerClassName: 'text-rose-400',
      },
      {
        key: type === 'league' ? 'scored' : 'gf',
        label: 'PF',
        align: 'center',
        className: 'text-emerald-400/90 hidden sm:table-cell',
        headerClassName: 'text-emerald-400',
      },
      {
        key: type === 'league' ? 'against' : 'ga',
        label: 'PC',
        align: 'center',
        className: 'text-pink-400/90 hidden sm:table-cell',
        headerClassName: 'text-pink-400',
      },
      {
        key: 'dif',
        label: 'DIF',
        align: 'center',
        headerClassName: 'text-zinc-500',
        className: 'hidden sm:table-cell',
        sortValue: (row) => {
          const pf = type === 'league' ? row.scored : row.gf;
          const pc = type === 'league' ? row.against : row.ga;
          return pf - pc;
        },
        render: (_, row) => {
          const pf = type === 'league' ? row.scored : row.gf;
          const pc = type === 'league' ? row.against : row.ga;
          const dif = pf - pc;
          return (
            <span
              className={cn('font-medium', dif > 0 ? 'text-emerald-400/90' : 'text-rose-400/90')}
            >
              {dif > 0 ? '+' : ''}
              {dif}
            </span>
          );
        },
      },
    ],
    [type]
  );

  if (!data || data.length === 0) return null;

  return (
    <StatsTable
      title={title}
      icon={ArrowUpDown}
      color="indigo"
      data={data}
      columns={columns}
      managerKey="name"
      managerIdKey="id"
      managerIconKey="icon"
      managerColorIndexKey="colorIndex"
      managerAlign="left"
      defaultSort={{ key: 'points', direction: 'desc' }}
      actionRight={
        <span className="text-xs text-zinc-500 uppercase font-medium tracking-wider px-3 py-1 rounded-full bg-black/20">
          {type === 'league' ? 'Solo Ligas' : 'Global (Todo)'}
        </span>
      }
      className="w-full"
    />
  );
}
