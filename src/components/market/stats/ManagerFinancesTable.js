'use client';

import { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Wallet } from 'lucide-react';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import { getColorForUser } from '@/lib/constants/colors';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';

function SortableHeader({ label, sortKey, currentSort, onSort, align = 'center' }) {
  const isSorted = currentSort.key === sortKey;

  return (
    <th
      className={cn(
        'px-6 py-3 cursor-pointer select-none hover:bg-white/5 transition-colors text-slate-400 font-medium text-xs uppercase tracking-wider font-display font-black',
        align === 'left' ? 'text-left' : align === 'right' ? 'text-right' : 'text-center'
      )}
      onClick={() => onSort(sortKey)}
    >
      <div
        className={cn(
          'flex items-center gap-2',
          align === 'left' ? 'justify-start' : align === 'right' ? 'justify-end' : 'justify-center'
        )}
      >
        {label}
        {isSorted ? (
          currentSort.direction === 'asc' ? (
            <ArrowUp className="w-3 h-3 text-primary" />
          ) : (
            <ArrowDown className="w-3 h-3 text-primary" />
          )
        ) : (
          <ArrowUpDown className="w-3 h-3 text-slate-400/30" />
        )}
      </div>
    </th>
  );
}

export default function ManagerFinancesTable({ stats }) {
  const [sortConfig, setSortConfig] = useState({ key: 'balance', direction: 'desc' });

  const sortedData = useMemo(() => {
    if (!stats) return [];

    let sortableItems = [...stats];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Columnas calculadas
        if (sortConfig.key === 'total_ops') {
          aValue = a.purchases_count + a.sales_count;
          bValue = b.purchases_count + b.sales_count;
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [stats, sortConfig]);

  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const formatMillions = (val, withSign = false) => {
    const millions = val / 1000000;
    const sign = withSign && millions > 0 ? '+' : '';
    return `${sign}${millions.toFixed(1)}M`;
  };

  if (!stats || !stats.length) return null;

  return (
    <ElegantCard title="Finanzas Managers" icon={Wallet} color="emerald" className="h-full">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-white/5 border-y border-white/5">
            <tr>
              <SortableHeader
                label="Manager"
                sortKey="user_name"
                currentSort={sortConfig}
                onSort={requestSort}
                align="left"
              />
              <SortableHeader
                label="Compras"
                sortKey="purchases_count"
                currentSort={sortConfig}
                onSort={requestSort}
              />
              <SortableHeader
                label="Ventas"
                sortKey="sales_count"
                currentSort={sortConfig}
                onSort={requestSort}
              />
              <SortableHeader
                label="Ops"
                sortKey="total_ops"
                currentSort={sortConfig}
                onSort={requestSort}
              />
              <SortableHeader
                label="Gastado"
                sortKey="purchases_total"
                currentSort={sortConfig}
                onSort={requestSort}
                align="right"
              />
              <SortableHeader
                label="Ingresado"
                sortKey="sales_total"
                currentSort={sortConfig}
                onSort={requestSort}
                align="right"
              />
              <SortableHeader
                label="Balance"
                sortKey="balance"
                currentSort={sortConfig}
                onSort={requestSort}
                align="right"
              />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sortedData.map((row, idx) => {
              const color = getColorForUser(row.user_id, row.user_name, row.color_index);
              return (
                <tr key={idx} className="hover:bg-white/[0.03] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 shrink-0">
                        {row.user_icon ? (
                          <Image
                            src={row.user_icon}
                            alt={row.user_name}
                            fill
                            className="rounded-full object-cover border border-white/5 shadow-md"
                            sizes="40px"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-base font-black text-white shadow-md border border-white/5">
                            {row.user_name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <Link
                        href={`/user/${row.user_id || row.user_name}`}
                        className={cn(
                          'font-bold transition-all group-hover:scale-105 origin-left text-lg tracking-tight hover:underline',
                          color.text
                        )}
                      >
                        {row.user_name}
                      </Link>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-display font-black text-emerald-400 text-lg">
                    {row.purchases_count}
                  </td>
                  <td className="px-6 py-4 text-center font-display font-black text-red-400 text-lg">
                    {row.sales_count}
                  </td>
                  <td className="px-6 py-4 text-center font-display font-black text-white text-lg">
                    {row.purchases_count + row.sales_count}
                  </td>
                  <td className="px-6 py-4 text-right font-display font-black text-red-500 tabular-nums text-lg">
                    -{formatMillions(row.purchases_total)}
                  </td>
                  <td className="px-6 py-4 text-right font-display font-black text-emerald-500 tabular-nums text-lg">
                    +{formatMillions(row.sales_total)}
                  </td>
                  <td
                    className={cn(
                      'px-6 py-4 text-right font-display font-black text-xl tabular-nums',
                      row.balance >= 0 ? 'text-primary' : 'text-red-500'
                    )}
                  >
                    {formatMillions(row.balance, true)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </ElegantCard>
  );
}
