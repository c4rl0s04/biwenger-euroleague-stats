'use client';

import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import { Wallet } from 'lucide-react';

export default function ManagerFinancesTable({ stats }) {
  if (!stats || !stats.length) return null;

  const formatMillions = (val, withSign = false) => {
    const millions = val / 1000000;
    const sign = withSign && millions > 0 ? '+' : '';
    return `${sign}${millions.toFixed(1)}M`;
  };

  return (
    <ElegantCard title="Finanzas Managers" icon={Wallet} color="emerald" className="h-full">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
            <tr>
              <th className="px-4 py-3">Manager</th>
              <th className="px-4 py-3 text-center">Operaciones</th>
              <th className="px-4 py-3 text-right">Importes</th>
              <th className="px-4 py-3 text-right">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {stats.map((row) => (
              <tr key={row.user_name} className="hover:bg-slate-700/50 transition-colors">
                <td className="px-4 py-3 font-medium text-white">{row.user_name}</td>
                <td className="px-4 py-3 text-xs">
                  <div className="flex flex-col items-center gap-1 font-medium">
                    <span className="text-emerald-400">{row.purchases_count} compras</span>
                    <span className="text-red-400">{row.sales_count} ventas</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-xs">
                  <div className="flex flex-col items-end gap-1 font-mono font-medium">
                    <span className="text-red-400">-{formatMillions(row.purchases_total)}</span>
                    <span className="text-emerald-400">+{formatMillions(row.sales_total)}</span>
                  </div>
                </td>
                <td
                  className={`px-4 py-3 text-right font-mono font-bold ${row.balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                >
                  {formatMillions(row.balance, true)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ElegantCard>
  );
}
