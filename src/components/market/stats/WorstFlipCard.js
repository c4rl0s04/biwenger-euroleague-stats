'use client';

import { TrendingDown } from 'lucide-react';
import MarketPodiumCard from './MarketPodiumCard';
import { formatEuro } from '@/lib/utils/currency';
import { TooltipHeader } from '@/components/ui/Tooltip';
import { HeroStatGroup, ManagerPill, ManagerName } from './StatUIComponents';

export default function WorstFlipCard({ data, onViewAll }) {
  if (!data || !Array.isArray(data) || data.length === 0) return null;

  return (
    <MarketPodiumCard
      onViewAll={onViewAll}
      data={data}
      title="El Fiasco"
      icon={TrendingDown}
      color="red"
      info={
        <>
          <TooltipHeader>El Fiasco</TooltipHeader>
          <p>
            Muestra las operaciones de compraventa que han generado la mayor pérdida neta absoluta.
            Es el ranking de los peores movimientos de mercado de la temporada.
          </p>
        </>
      }
      winnerLabel="EL FIASCO"
      renderHeroValue={(item) => (
        <span className="text-3xl font-black text-rose-400">-{formatEuro(item.profit, true)}€</span>
      )}
      renderHeroStats={(item) => (
        <HeroStatGroup
          stats={[
            { label: 'Compra', value: formatEuro(item.purchase_price, true), suffix: '€' },
            { label: 'Venta', value: formatEuro(item.sale_price, true), suffix: '€' },
          ]}
        />
      )}
      renderHeroMeta={(item) => <ManagerPill user={item} />}
      renderRunnerUpValue={(item) => (
        <span className="text-sm font-black text-rose-400">-{formatEuro(item.profit, true)}€</span>
      )}
      renderRunnerUpMeta={(item) => <ManagerName user={item} className="text-xs" />}
      renderListItemValue={(item) => (
        <span className="text-xs font-bold text-rose-400">-{formatEuro(item.profit, true)}€</span>
      )}
      renderListItemMeta={(item) => <ManagerName user={item} className="text-[10px] ml-2" />}
    />
  );
}
