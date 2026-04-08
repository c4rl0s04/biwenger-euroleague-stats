'use client';

import { Briefcase } from 'lucide-react';
import MarketPodiumCard from './MarketPodiumCard';
import { formatProfit } from '@/lib/utils/currency';
import { TooltipHeader } from '@/components/ui/Tooltip';
import { HeroStatGroup, ManagerPill, ManagerName } from './StatUIComponents';

export default function BestSellerCard({ seller }) {
  if (!seller || !Array.isArray(seller) || seller.length === 0) return null;

  return (
    <MarketPodiumCard
      data={seller}
      title="El Negociador"
      icon={Briefcase}
      color="emerald"
      winnerLabel="MAYOR BENEFICIO"
      useTeamColors={false}
      info={
        <>
          <TooltipHeader>El Negociador</TooltipHeader>
          <p>
            Muestra el beneficio neto total obtenido por cada manager a través de todas sus
            operaciones de compra y venta. Es la medida real de quién está sacando más partido al
            mercado.
          </p>
        </>
      }
      renderHeroValue={(item) => (
        <span
          className={`text-3xl font-black ${item.net_profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
        >
          {formatProfit(item.net_profit)}
        </span>
      )}
      renderHeroStats={(item) => (
        <HeroStatGroup stats={[{ label: 'Ventas', value: item.sales_count }]} />
      )}
      renderHeroMeta={(item) => <ManagerPill user={item} />}
      renderRunnerUpValue={(item) => (
        <div className="flex flex-col items-end">
          <span
            className={`text-sm font-black ${item.net_profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
          >
            {formatProfit(item.net_profit)}
          </span>
          <span className="text-[9px] text-zinc-500 font-bold">{item.sales_count} ventas</span>
        </div>
      )}
      renderRunnerUpMeta={(item) => (
        <ManagerName user={item} className="text-[10px] opacity-80 hover:opacity-100" />
      )}
      renderListItemValue={(item) => (
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-bold ${item.net_profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
          >
            {formatProfit(item.net_profit)}
          </span>
          <span className="text-[9px] text-zinc-500 font-medium">({item.sales_count} v.)</span>
        </div>
      )}
    />
  );
}
