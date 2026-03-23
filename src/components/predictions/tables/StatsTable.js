'use client';

import { BarChart3 } from 'lucide-react';
import { ManagerTable } from '@/components/ui';

export function StatsTable({ data }) {
  if (!data) return null;

  const getColorClass = (val) => {
    const num = Number(val);
    if (num >= 6) return 'text-green-500 font-bold';
    if (num >= 5) return 'text-emerald-500 font-bold';
    if (num >= 4) return 'text-yellow-500 font-medium';
    if (num >= 3) return 'text-orange-500';
    return 'text-red-500';
  };

  const columns = [
    {
      label: 'Promedio',
      key: 'promedio',
      align: 'center',
      className: (val) => getColorClass(val),
      render: (val) => Number(val).toFixed(2),
    },
    {
      label: 'Jornadas',
      key: 'jornadas_jugadas',
      align: 'center',
      className: 'text-muted-foreground',
    },
    {
      label: 'Total',
      key: 'total_aciertos',
      align: 'center',
      className: 'text-foreground font-bold',
    },
    {
      label: 'Mejor',
      key: 'mejor_jornada',
      align: 'center',
      className: 'text-blue-500 font-bold',
    },
    {
      label: 'Peor',
      key: 'peor_jornada',
      align: 'center',
      className: 'text-red-500 font-bold',
    },
  ];

  return (
    <ManagerTable
      title="Estadísticas Detalladas"
      icon={BarChart3}
      color="cyan"
      data={data}
      columns={columns}
      defaultSort={{ key: 'promedio', direction: 'desc' }}
      managerKey="usuario"
    />
  );
}
