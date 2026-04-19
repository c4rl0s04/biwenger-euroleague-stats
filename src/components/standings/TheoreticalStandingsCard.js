'use client';

import { Calculator, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { StatsTable } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';

export default function TheoreticalStandingsCard() {
  const { data: standings = [], loading } = useApiData('/api/standings/theoretical');

  const columns = [
    {
      key: 'position',
      label: 'Pos',
      align: 'center',
      render: (val, row, index) => (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
          {index + 1}
        </span>
      ),
    },
    {
      key: 'total_ideal',
      label: 'Pts Ideales',
      align: 'center',
      color: 'indigo',
      variant: 'numeric',
      render: (val) => (
        <span className="font-bold text-indigo-400 text-lg md:text-xl leading-tight">
          {Math.round(val)}
        </span>
      ),
    },
    {
      key: 'total_actual',
      label: 'Pts Reales',
      align: 'center',
      color: 'slate',
      variant: 'numeric',
      render: (val) => (
        <span className="font-medium text-slate-400 text-base md:text-lg leading-tight">
          {Math.round(val)}
        </span>
      ),
    },
    {
      key: 'gap',
      label: 'Puntos Perdidos',
      align: 'center',
      color: 'red',
      variant: 'numeric',
      render: (val) => (
        <div className="flex flex-col items-center">
          <span className="font-bold text-red-400 text-base md:text-lg leading-tight">
            -{Math.round(val)}
          </span>
          <span className="text-[10px] uppercase tracking-tighter text-slate-500 font-bold">
            pts dejados
          </span>
        </div>
      ),
    },
    {
      key: 'efficiency',
      label: 'Eficiencia',
      align: 'center',
      color: 'emerald',
      variant: 'numeric',
      render: (val) => {
        const colorClass =
          val >= 90 ? 'text-emerald-400' : val >= 80 ? 'text-yellow-400' : 'text-orange-400';
        return (
          <div className="flex flex-col items-center">
            <span className={`font-black text-lg md:text-xl ${colorClass}`}>{val.toFixed(1)}%</span>
            <div className="w-12 h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
              <div
                className={`h-full rounded-full ${val >= 90 ? 'bg-emerald-500' : val >= 80 ? 'bg-yellow-500' : 'bg-orange-500'}`}
                style={{ width: `${Math.min(val, 100)}%` }}
              />
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <StatsTable
      title="Clasificación Teórica (100% Eficiencia)"
      icon={Calculator}
      color="indigo"
      data={standings}
      columns={columns}
      loading={loading}
      className="lg:col-span-3"
      defaultSort={{ key: 'total_ideal', direction: 'desc' }}
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
