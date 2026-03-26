'use client';

import { Trophy, Medal, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { StatsTable } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';

export default function FullStandingsCard() {
  const { data: standings = [], loading } = useApiData('/api/standings/full');

  const getPositionStyle = (position) => {
    if (position === 1) return 'bg-yellow-500 text-slate-900';
    if (position === 2) return 'bg-slate-300 text-slate-900';
    if (position === 3) return 'bg-orange-600 text-white';
    return 'bg-slate-700 text-slate-300';
  };

  const getPriceTrendIcon = (trend) => {
    if (trend > 0) return <TrendingUp className="w-3 h-3 text-green-400" />;
    if (trend < 0) return <TrendingDown className="w-3 h-3 text-red-400" />;
    return <Minus className="w-3 h-3 text-slate-400" />;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-ES').format(price);
  };

  const leader =
    standings.length > 0 ? [...standings].sort((a, b) => b.total_points - a.total_points)[0] : null;

  const columns = [
    {
      key: 'position',
      label: 'Pos',
      align: 'center',
      render: (val) => (
        <span
          className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${getPositionStyle(val)}`}
        >
          {val}
        </span>
      ),
    },
    {
      key: 'total_points',
      label: 'Puntos',
      align: 'center',
      color: 'orange',
      variant: 'numeric',
      render: (val, row) => {
        const gapToLeader = leader ? leader.total_points - val : 0;
        return (
          <div className="flex flex-col items-center">
            <span className="font-bold text-orange-500 text-lg md:text-xl leading-tight">
              {val}
            </span>
            {gapToLeader > 0 && (
              <span className="text-sm text-red-400 font-semibold">-{gapToLeader}</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'avg_points',
      label: 'Media',
      align: 'center',
      variant: 'numeric',
      className: 'hidden md:table-cell',
      render: (val, row) => (
        <div className="flex flex-col items-center">
          <span className="text-slate-200 text-base md:text-lg font-bold leading-tight">{val}</span>
          <span className="text-sm text-slate-500 tabular-nums font-medium">
            {row.best_round} / {row.worst_round}
          </span>
        </div>
      ),
    },
    {
      key: 'round_wins',
      label: 'Victorias',
      align: 'center',
      variant: 'numeric',
      color: 'yellow',
      className: 'hidden lg:table-cell',
      render: (val) => (
        <div className="flex items-center justify-center gap-1.5">
          {val > 0 && <Medal className="w-4 h-4 text-yellow-500" />}
          <span
            className={
              val > 0
                ? 'text-yellow-400 font-bold text-base md:text-lg'
                : 'text-slate-500 opacity-50'
            }
          >
            {val}
          </span>
        </div>
      ),
    },
    {
      key: 'team_value',
      label: 'Valor',
      align: 'center',
      variant: 'numeric',
      render: (val, row) => (
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-300 text-sm font-bold">{formatPrice(val)}€</span>
            {getPriceTrendIcon(row.price_trend)}
          </div>
          {row.price_trend !== 0 && (
            <div
              className={`text-sm font-medium ${row.price_trend > 0 ? 'text-green-400' : 'text-red-400'}`}
            >
              {row.price_trend > 0 ? '+' : ''}
              {formatPrice(row.price_trend)}€
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <StatsTable
      title="Clasificación General"
      icon={Trophy}
      color="indigo"
      data={standings}
      columns={columns}
      loading={loading}
      className="lg:col-span-2"
      defaultSort={{ key: 'position', direction: 'asc' }}
      managerKey="name"
      managerIdKey="user_id"
      managerIconKey="icon"
      managerColorIndexKey="color_index"
      managerSubtitleKey="rounds_played"
      managerSubtitleRender={(val) => `${val} jornadas`}
      managerColumnIndex={1}
    />
  );
}
