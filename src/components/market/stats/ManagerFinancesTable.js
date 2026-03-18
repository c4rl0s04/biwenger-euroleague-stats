'use client';

import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import { Wallet } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getColorForUser } from '@/lib/constants/colors';

export default function ManagerFinancesTable({ stats }) {
  const [sortConfig, setSortConfig] = useState({ key: 'balance', direction: 'desc' });
  if (!stats || !stats.length) return null;

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedStats = [...stats].sort((a, b) => {
    let aVal = a[sortConfig.key];
    let bVal = b[sortConfig.key];
    // Soporte para columna calculada
    if (sortConfig.key === 'total_ops') {
      aVal = a.purchases_count + a.sales_count;
      bVal = b.purchases_count + b.sales_count;
    }
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return '↕';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const formatMillions = (val, withSign = false) => {
    const millions = val / 1000000;
    const sign = withSign && millions > 0 ? '+' : '';
    return `${sign}${millions.toFixed(1)}M`;
  };

  return (
    <ElegantCard title="Finanzas Managers" icon={Wallet} color="emerald" className="h-full">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-[10px] text-slate-500 uppercase bg-white/5 font-display tracking-[0.15em]">
            <tr>
              <th className="px-3 py-3 rounded-l-xl font-black">Manager</th>
              <th
                className="px-3 py-3 text-center cursor-pointer hover:text-white transition-colors font-black"
                onClick={() => handleSort('purchases_count')}
              >
                Compras {getSortIndicator('purchases_count')}
              </th>
              <th
                className="px-3 py-3 text-center cursor-pointer hover:text-white transition-colors font-black"
                onClick={() => handleSort('sales_count')}
              >
                Ventas {getSortIndicator('sales_count')}
              </th>
              <th
                className="px-3 py-3 text-center cursor-pointer hover:text-white transition-colors font-black"
                onClick={() => handleSort('total_ops')}
              >
                Ops {getSortIndicator('total_ops')}
              </th>
              <th
                className="px-3 py-3 text-right cursor-pointer hover:text-white transition-colors font-black"
                onClick={() => handleSort('purchases_total')}
              >
                Gastado {getSortIndicator('purchases_total')}
              </th>
              <th
                className="px-3 py-3 text-right cursor-pointer hover:text-white transition-colors font-black"
                onClick={() => handleSort('sales_total')}
              >
                Ingresado {getSortIndicator('sales_total')}
              </th>
              <th
                className="px-3 py-3 text-right cursor-pointer hover:text-white transition-colors rounded-r-xl font-black"
                onClick={() => handleSort('balance')}
              >
                Balance {getSortIndicator('balance')}
              </th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {sortedStats.map((row) => {
              const color = getColorForUser(row.user_id, row.user_name, row.color_index);
              return (
                <tr
                  key={row.user_id || row.user_name}
                  className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors group"
                >
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-2 group hover:opacity-100">
                      {row.user_icon ? (
                        <div className="relative w-8 h-8 shrink-0">
                          <Image
                            src={row.user_icon}
                            alt={row.user_name}
                            fill
                            className="rounded-full transition-opacity group-hover:opacity-80 object-cover"
                            sizes="32px"
                          />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-medium transition-opacity group-hover:opacity-80">
                          {row.user_name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div
                          className={`font-black transition-transform group-hover:scale-105 origin-left inline-block font-display tracking-tight text-[13px] ${color.text}`}
                        >
                          {row.user_name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-center font-display font-black text-emerald-400">
                    {row.purchases_count}
                  </td>
                  <td className="px-3 py-4 text-center font-display font-black text-red-400">
                    {row.sales_count}
                  </td>
                  <td className="px-3 py-4 text-center font-display font-black text-white px-2">
                    {row.purchases_count + row.sales_count}
                  </td>
                  <td className="px-3 py-4 text-right font-display font-black text-red-500 tabular-nums">
                    -{formatMillions(row.purchases_total)}
                  </td>
                  <td className="px-3 py-4 text-right font-display font-black text-emerald-500 tabular-nums">
                    +{formatMillions(row.sales_total)}
                  </td>
                  <td
                    className={`px-3 py-4 text-right font-display font-black text-base tabular-nums ${row.balance >= 0 ? 'text-primary' : 'text-red-500'}`}
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
