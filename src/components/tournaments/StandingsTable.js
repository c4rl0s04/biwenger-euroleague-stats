'use client';

import { Trophy } from 'lucide-react';
import { getColorForUser } from '@/lib/constants/colors';
import StatsTable from '@/components/ui/StatsTable';

export default function StandingsTable({ standings }) {
  const columns = [
    {
      key: 'position',
      label: 'Pos',
      align: 'center',
      className: 'w-12',
      render: (val, row) =>
        row.position === 1 ? (
          <Trophy size={14} className="text-amber-500 mx-auto" />
        ) : (
          <span className="text-xs text-blue-400 font-bold">{row.position}</span>
        ),
    },
    {
      key: 'points',
      label: 'Pts',
      align: 'center',
      color: 'primary',
      className: 'font-black font-mono text-base',
    },
    {
      key: 'played',
      label: 'PJ',
      align: 'center',
      color: 'indigo',
      className: 'font-bold',
      render: (val, row) => row.won + row.lost + (row.drawn || 0),
    },
    {
      key: 'won',
      label: 'V',
      align: 'center',
      color: 'green',
      headerClassName: 'hidden sm:table-cell',
      className: 'hidden sm:table-cell font-medium opacity-90',
    },
    {
      key: 'drawn',
      label: 'E',
      align: 'center',
      color: 'amber',
      headerClassName: 'hidden sm:table-cell',
      className: 'hidden sm:table-cell font-medium opacity-90',
      render: (val) => val || 0,
    },
    {
      key: 'lost',
      label: 'D',
      align: 'center',
      color: 'red',
      headerClassName: 'hidden sm:table-cell',
      className: 'hidden sm:table-cell font-medium opacity-90',
    },
    {
      key: 'scored',
      label: 'GF',
      align: 'center',
      color: 'cyan',
      headerClassName: 'hidden md:table-cell',
      className: 'hidden md:table-cell opacity-80',
    },
    {
      key: 'against',
      label: 'GC',
      align: 'center',
      color: 'pink',
      headerClassName: 'hidden md:table-cell',
      className: 'hidden md:table-cell opacity-70',
    },
    {
      key: 'diff',
      label: 'DIF',
      align: 'center',
      headerClassName: 'hidden sm:table-cell',
      className: (val, row) => {
        const dif = row.scored - row.against;
        return `hidden sm:table-cell font-medium ${
          dif > 0 ? 'text-emerald-500' : dif < 0 ? 'text-rose-500' : 'text-zinc-500'
        }`;
      },
      render: (val, row) => {
        const dif = row.scored - row.against;
        return `${dif > 0 ? '+' : ''}${dif}`;
      },
    },
  ];

  if (!standings || standings.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">No hay clasificación disponible.</div>
    );
  }

  return (
    <StatsTable
      data={standings}
      columns={columns}
      defaultSort={{ key: 'points', direction: 'desc' }}
      showManagerColumn={true}
      managerColumnIndex={1}
      managerKey="user_name"
      managerIdKey="user_id"
      managerIconKey="user_icon"
      managerColorIndexKey="user_color"
      managerAlign="left"
      className="w-full"
    />
  );
}
