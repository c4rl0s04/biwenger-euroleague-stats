'use client';

import { Landmark } from 'lucide-react';
import { StatsTable } from '@/components/ui';

export default function ManagerFinancesTable({ data }) {
  const columns = [
    {
      key: 'purchases_count',
      label: 'Nº Compras',
      align: 'center',
      variant: 'numeric',
      color: 'red',
    },
    {
      key: 'purchases_total',
      label: 'Total Compras',
      align: 'center',
      variant: 'numeric',
      color: 'red',
      render: (val) => (val != null ? `${val.toLocaleString()} €` : '-'),
    },
    {
      key: 'sales_count',
      label: 'Nº Ventas',
      align: 'center',
      variant: 'numeric',
      color: 'emerald',
    },
    {
      key: 'sales_total',
      label: 'Total Ventas',
      align: 'center',
      variant: 'numeric',
      color: 'emerald',
      render: (val) => (val != null ? `${val.toLocaleString()} €` : '-'),
    },
    {
      key: 'ops',
      label: 'Total Ops',
      align: 'center',
      variant: 'numeric',
      color: 'indigo',
      sortValue: (row) => row.purchases_count + row.sales_count,
      render: (_, row) => row.purchases_count + row.sales_count,
    },
    {
      key: 'balance',
      label: 'Balance',
      align: 'center',
      variant: 'numeric',
      color: 'orange',
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
      managerKey="user_name"
      managerIdKey="user_id"
      managerIconKey="user_icon"
      managerColorIndexKey="color_index"
    />
  );
}
