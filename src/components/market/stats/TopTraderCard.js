'use client';

import { Repeat } from 'lucide-react';
import MarketPodiumCard from './MarketPodiumCard';
import { getColorForUser } from '@/lib/constants/colors';
import { TooltipHeader } from '@/components/ui/Tooltip';
import { formatEuro } from '@/lib/utils/currency';
import { ManagerPill, ManagerName, HeroStatGroup } from './StatUIComponents';

export default function TopTraderCard({ data }) {
  if (!data || !Array.isArray(data) || data.length === 0) return null;

  const formatProfit = (val) => {
    const prefix = val >= 0 ? '+' : '-';
    // formatEuro already includes the symbol and formatting, we just need the sign
    return `${prefix}${formatEuro(Math.abs(val))}`;
  };

  return (
    <MarketPodiumCard
      data={data}
      title="El Especulador"
      icon={Repeat}
      color="indigo"
      info={
        <>
          <TooltipHeader>El Especulador</TooltipHeader>
          <p>
            El usuario con más operaciones completas de compraventa (ciclos compra→venta).
            Representa la actividad de trading pura en el mercado.
          </p>
        </>
      }
      winnerLabel="MÁS OPERACIONES"
      useTeamColors={false}
      renderHeroValue={(item) => (
        <div className="flex flex-col items-center">
          <span className="text-3xl font-black text-indigo-400">{item.trade_count}</span>
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mt-2">
            Operaciones
          </span>
        </div>
      )}
      renderHeroStats={(item) => (
        <HeroStatGroup
          stats={[
            {
              label: 'Balance',
              value: formatProfit(item.total_profit),
              suffix: '€',
              className: item.total_profit >= 0 ? 'text-emerald-400' : 'text-red-400',
            },
          ]}
        />
      )}
      renderHeroMeta={(item) => <ManagerPill user={item} />}
      renderRunnerUpValue={(item) => (
        <div className="flex flex-col items-end">
          <span className="text-sm font-black text-indigo-400">{item.trade_count}</span>
          <span
            className={`text-[9px] font-bold ${item.total_profit >= 0 ? 'text-emerald-500/80' : 'text-red-500/80'}`}
          >
            ({formatProfit(item.total_profit)}€)
          </span>
        </div>
      )}
      renderRunnerUpMeta={(item) => (
        <ManagerName user={item} className="text-[10px] opacity-80 hover:opacity-100" />
      )}
      renderListItemValue={(item) => (
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-indigo-400/80">{item.trade_count} ops.</span>
          <span
            className={`text-[10px] font-medium ${item.total_profit >= 0 ? 'text-emerald-500/60' : 'text-red-500/60'}`}
          >
            ({formatProfit(item.total_profit)}€)
          </span>
        </div>
      )}
      renderListItemMeta={(item) => (
        <ManagerName
          user={item}
          className="text-[9px] font-black uppercase tracking-wider opacity-60 hover:opacity-100 ml-2"
        />
      )}
    />
  );
}
