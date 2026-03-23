'use client';

import { Trophy } from 'lucide-react';
import { StatsTable } from '@/components/ui';

export function PredictionsStatsTable({ data }) {
  const columns = [
    { key: 'jornadas_jugadas', label: 'Jornadas', align: 'center', variant: 'numeric' },
    { key: 'total_aciertos', label: 'Aciertos', align: 'center', variant: 'numeric' },
    {
      key: 'exacts',
      label: 'Plenos (+8)',
      align: 'center',
      variant: 'numeric',
      color: 'primary',
    },
    {
      key: 'perfects',
      label: 'Perfectos',
      align: 'center',
      variant: 'numeric',
      render: (val) => (val > 0 ? <span className="text-yellow-500">★ {val}</span> : '-'),
    },
    {
      key: 'promedio',
      label: 'Media',
      align: 'right',
      variant: 'numeric',
      render: (val) => (typeof val === 'number' ? val.toFixed(2) : '-'),
    },
  ];

  return (
    <StatsTable
      title="Clasificación General"
      icon={Trophy}
      color="purple"
      data={data}
      columns={columns}
      defaultSort={{ key: 'total_aciertos', direction: 'desc' }}
      managerKey="usuario"
      managerIdKey="user_id"
      managerIconKey="user_icon"
      managerColorIndexKey="color_index"
    />
  );
}
