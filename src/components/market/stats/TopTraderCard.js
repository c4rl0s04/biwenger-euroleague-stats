'use client';

import { Repeat } from 'lucide-react';
import MarketPodiumCard from './MarketPodiumCard';
import { getColorForUser } from '@/lib/constants/colors';
import { TooltipHeader } from '@/components/ui/Tooltip';
import { formatEuro } from '@/lib/utils/currency';
import Link from 'next/link';

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
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
            Operaciones
          </span>
        </div>
      )}
      renderHeroStats={(item) => (
        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">
          Balance:{' '}
          <span className={item.total_profit >= 0 ? 'text-emerald-400' : 'text-red-400'}>
            {formatProfit(item.total_profit)}€
          </span>
        </p>
      )}
      renderHeroMeta={(item) => {
        const userColor = getColorForUser(item.user_id, item.user_name, item.user_color_index);
        return (
          <Link href={`/user/${item.user_id}`} className="group/user">
            <div
              className={`px-4 py-1.5 rounded-full text-xs font-black ${userColor.bg} ${userColor.text} bg-opacity-20 border border-current border-opacity-10 group-hover/user:bg-opacity-30 transition-all`}
            >
              {item.user_name}
            </div>
          </Link>
        );
      }}
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
      renderRunnerUpMeta={(item) => {
        const userColor = getColorForUser(item.user_id, item.user_name, item.user_color_index);
        return (
          <Link
            href={`/user/${item.user_id}`}
            className={`text-[10px] font-bold ${userColor.text} opacity-80 hover:opacity-100`}
          >
            {item.user_name}
          </Link>
        );
      }}
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
      renderListItemMeta={(item) => {
        const userColor = getColorForUser(item.user_id, item.user_name, item.user_color_index);
        return (
          <Link
            href={`/user/${item.user_id}`}
            className={`text-[9px] font-black uppercase tracking-wider ${userColor.text} opacity-60 hover:opacity-100 ml-2`}
          >
            {item.user_name}
          </Link>
        );
      }}
    />
  );
}
