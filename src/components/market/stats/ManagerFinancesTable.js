'use client';

import { Landmark } from 'lucide-react';
import { StatsTable } from '@/components/ui';

export default function ManagerFinancesTable({ data }) {
  const columns = [
    {
      key: 'total_compras',
      label: 'Compras',
      align: 'center',
      variant: 'numeric',
      color: 'blue',
      render: (val) => (val != null ? `${val.toLocaleString()} €` : '-'),
    },
    {
      key: 'total_ventas',
      label: 'Ventas',
      align: 'center',
      variant: 'numeric',
      color: 'orange',
      render: (val) => (val != null ? `${val.toLocaleString()} €` : '-'),
    },
    {
      key: 'balance',
      label: 'Balance',
      align: 'center',
      variant: 'numeric',
      // Dynamic className overrides the fixed color prop if returned
      className: (val) => (val >= 0 ? 'text-emerald-400' : 'text-red-400'),
      render: (val) => (val != null ? `${val.toLocaleString()} €` : '-'),
    },
  ];

  return (
    <StatsTable
      title="Finanzas de Managers"
      icon={Landmark}
      color="emerald"
      data={data}
      columns={columns}
      defaultSort={{ key: 'balance', direction: 'desc' }}
      managerKey="manager_name"
      managerIdKey="manager_id"
      managerIconKey="manager_icon"
      managerColorIndexKey="color_index"
    />
  );
}
