'use client';

import { Landmark } from 'lucide-react';
import { StatsTable } from '@/components/ui';

export default function ManagerFinancesTable({ data }) {
  const columns = [
    {
      key: 'total_compras',
      label: 'Compras',
      align: 'right',
      variant: 'numeric',
      render: (val) => (val != null ? `${val.toLocaleString()} €` : '-'),
    },
    {
      key: 'total_ventas',
      label: 'Ventas',
      align: 'right',
      variant: 'numeric',
      render: (val) => (val != null ? `${val.toLocaleString()} €` : '-'),
    },
    {
      key: 'balance',
      label: 'Balance',
      align: 'right',
      variant: 'numeric',
      className: (val) => (val >= 0 ? 'text-emerald-500' : 'text-red-500'),
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
