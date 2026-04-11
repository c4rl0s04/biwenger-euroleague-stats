'use client';

import { Crown, Target, Layers, TrendingUp, TrendingDown, Star } from 'lucide-react';
import Link from 'next/link';
import { StatsTable } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';

export default function CaptainStandingsCard() {
  const { data: { stats = [] } = {}, loading } = useApiData('/api/standings/captains');

  const columns = [
    {
      key: 'total_captain_points',
      label: 'Puntos Cap.',
      align: 'center',
      color: 'orange',
      variant: 'numeric',
      render: (val) => <span className="font-bold text-orange-500 text-lg md:text-xl">{val}</span>,
    },
    {
      key: 'avg_captain_points',
      label: 'Media',
      align: 'center',
      variant: 'numeric',
      className: 'hidden md:table-cell',
      render: (val) => <span className="text-foreground/90 font-bold">{val.toFixed(1)}</span>,
    },
    {
      key: 'success_rate',
      label: 'Acierto Ópt.',
      align: 'center',
      variant: 'numeric',
      color: 'green',
      render: (val) => (
        <div className="flex flex-col items-center">
          <span className="text-green-400 font-bold text-base md:text-lg">{val.toFixed(1)}%</span>
        </div>
      ),
    },
    {
      key: 'unique_captains',
      label: 'Variedad',
      align: 'center',
      variant: 'numeric',
      className: 'hidden sm:table-cell',
      render: (val) => (
        <div className="flex items-center justify-center gap-1">
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-medium">{val}</span>
        </div>
      ),
    },
    {
      key: 'most_used_captain',
      label: 'Fiel a',
      align: 'left',
      className: 'hidden lg:table-cell max-w-[120px]',
      render: (val, row) => {
        if (!val) return <span className="text-xs text-muted-foreground italic">N/A</span>;

        // Ensure we have a valid ID before rendering a Link
        if (!row.most_used_captain_id) {
          return (
            <span className="text-xs font-semibold truncate block text-muted-foreground italic">
              {val}
            </span>
          );
        }

        return (
          <Link
            href={`/player/${row.most_used_captain_id}`}
            className="text-xs font-semibold truncate inline-block text-muted-foreground italic hover:text-orange-500 transition-all hover:scale-105 origin-left"
          >
            {val}
          </Link>
        );
      },
    },
    {
      key: 'best_points',
      label: 'Récords',
      align: 'center',
      className: 'hidden xl:table-cell',
      render: (val, row) => (
        <div className="flex items-center justify-center gap-3">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-green-400" />
            <span className="text-sm font-bold text-green-400">{val}</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingDown className="w-3 h-3 text-red-400" />
            <span className="text-sm font-bold text-red-400">{row.worst_points}</span>
          </div>
        </div>
      ),
    },
  ];

  return (
    <StatsTable
      title="Rendimiento de Capitanes"
      icon={Crown}
      color="orange"
      data={stats}
      columns={columns}
      loading={loading}
      className="lg:col-span-2"
      defaultSort={{ key: 'total_captain_points', direction: 'desc' }}
      managerKey="user_name"
      managerIdKey="user_id"
      managerIconKey="user_icon"
      managerColorIndexKey="color_index"
      managerSubtitleKey="total_rounds"
      managerSubtitleRender={(val) => `${val} jornadas`}
      managerColumnIndex={0}
    />
  );
}
