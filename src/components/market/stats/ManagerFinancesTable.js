'use client';

import { Wallet } from 'lucide-react';
import { ManagerTable } from '@/components/ui';

export default function ManagerFinancesTable({ stats }) {
  if (!stats || !stats.length) return null;

  const formatMillions = (val, withSign = false) => {
    const millions = val / 1000000;
    const sign = withSign && millions > 0 ? '+' : '';
    return `${sign}${millions.toFixed(1)}M`;
  };

  const columns = [
    {
      label: 'Compras',
      key: 'purchases_count',
      align: 'center',
      className: 'text-emerald-400',
    },
    {
      label: 'Ventas',
      key: 'sales_count',
      align: 'center',
      className: 'text-red-400',
    },
    {
      label: 'Ops',
      key: 'total_ops',
      align: 'center',
      className: 'text-white',
      sortValue: (row) => row.purchases_count + row.sales_count,
      render: (val, row) => row.purchases_count + row.sales_count,
    },
    {
      label: 'Gastado',
      key: 'purchases_total',
      align: 'right',
      className: 'text-red-500',
      render: (val) => `-${formatMillions(val)}`,
    },
    {
      label: 'Ingresado',
      key: 'sales_total',
      align: 'right',
      className: 'text-emerald-500',
      render: (val) => `+${formatMillions(val)}`,
    },
    {
      label: 'Balance',
      key: 'balance',
      align: 'right',
      className: (val) => (val >= 0 ? 'text-primary text-xl' : 'text-red-500 text-xl'),
      render: (val) => formatMillions(val, true),
    },
  ];

  return (
    <ManagerTable
      title="Finanzas Managers"
      icon={Wallet}
      color="emerald"
      data={stats}
      columns={columns}
      defaultSort={{ key: 'balance', direction: 'desc' }}
    />
  );
}
