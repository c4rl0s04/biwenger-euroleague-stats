'use client';

import { TrendingDown } from 'lucide-react';
import MarketPodiumCard from './MarketPodiumCard';
import { formatEuro } from '@/lib/utils/currency';
import { TooltipHeader } from '@/components/ui/Tooltip';
import { HeroStatGroup, ManagerPill, ManagerName } from './StatUIComponents';

export default function WorstFlipCard({ flip, onViewAll }) {
  if (!flip || !Array.isArray(flip) || flip.length === 0) return null;

  const formatShortEuro = (val) => {
    const absVal = Math.abs(val);
    if (absVal >= 1000000) return (absVal / 1000000).toFixed(1) + 'M';
    if (absVal >= 1000) return (absVal / 1000).toFixed(0) + 'k';
    return absVal?.toLocaleString('es-ES');
  };

  return (
    <MarketPodiumCard
      onViewAll={onViewAll}
      data={flip}
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
        <span className="text-3xl font-black text-rose-400">-{formatShortEuro(item.profit)}€</span>
      )}
      renderHeroStats={(item) => (
        <HeroStatGroup
          stats={[
            { label: 'Compra', value: formatShortEuro(item.purchase_price), suffix: '€' },
            { label: 'Venta', value: formatShortEuro(item.sale_price), suffix: '€' },
          ]}
        />
      )}
      renderHeroMeta={(item) => <ManagerPill user={item} />}
      renderRunnerUpValue={(item) => (
        <span className="text-sm font-black text-rose-400">-{formatShortEuro(item.profit)}€</span>
      )}
      renderRunnerUpMeta={(item) => (
        <ManagerName user={item} className="text-xs opacity-80 hover:opacity-100" />
      )}
      renderListItemValue={(item) => (
        <span className="text-xs font-bold text-rose-400/80">-{formatShortEuro(item.profit)}€</span>
      )}
      renderListItemMeta={(item) => (
        <ManagerName
          user={item}
          className="text-[10px] font-black uppercase tracking-wider opacity-60 hover:opacity-100 ml-2"
        />
      )}
    />
  );
}
