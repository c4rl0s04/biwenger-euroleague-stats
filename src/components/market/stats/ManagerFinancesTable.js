'use client';

import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import { Wallet } from 'lucide-react';

export default function ManagerFinancesTable({ stats }) {
  if (!stats || !stats.length) return null;

  const formatMillions = (val) => {
    const millions = val / 1000000;
    const sign = millions > 0 ? '+' : '';
    return `${sign}${millions.toFixed(1)}M`;
  };

  return (
    <ElegantCard title="Finanzas Managers" icon={Wallet} color="emerald" className="h-full">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
            <tr>
              <th className="px-4 py-3">Manager</th>
              <th className="px-4 py-3 text-center">Ops</th>
              <th className="px-4 py-3 text-right">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {stats.map((row) => (
              <tr key={row.user_name} className="hover:bg-slate-700/50 transition-colors">
                <td className="px-4 py-3 font-medium text-white">{row.user_name}</td>
                <td className="px-4 py-3 text-center text-slate-400 text-xs">
                  <span className="text-emerald-400">{row.purchases_count}C</span> /
                  <span className="text-red-400"> {row.sales_count}V</span>
                </td>
                <td
                  className={`px-4 py-3 text-right font-mono font-bold ${row.balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                >
                  {formatMillions(row.balance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ElegantCard>
  );
}
