'use client';

import { Rocket } from 'lucide-react';
import { formatEuro } from '@/lib/utils/currency';
import MarketPodiumCard from './MarketPodiumCard';
import { HeroStatGroup, ManagerPill, ManagerName } from './StatUIComponents';
import { TooltipHeader } from '@/components/ui/Tooltip';

export default function BestFlipCard({ flip, onViewAll }) {
  if (!flip || !Array.isArray(flip) || flip.length === 0) return null;

  const formatShortEuro = (val) => {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(0) + 'k';
    return val?.toLocaleString('es-ES');
  };

  return (
    <MarketPodiumCard
      onViewAll={onViewAll}
      data={flip}
      title="El Pelotazo"
      icon={Rocket}
      color="emerald"
      info={
        <>
          <TooltipHeader>El Pelotazo</TooltipHeader>
          <p>
            Muestra las operaciones de compraventa que han generado el mayor beneficio neto absoluto
            (Precio de Venta - Precio de Compra). Es el ranking de los mejores flips de la temporada
            en términos de dinero real.
          </p>
        </>
      }
      winnerLabel="EL PELOTAZO"
      renderHeroValue={(item) => (
        <span className="text-3xl font-black text-emerald-400">
          +{formatShortEuro(item.profit)}€
        </span>
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
        <span className="text-sm font-black text-emerald-400">
          +{formatShortEuro(item.profit)}€
        </span>
      )}
      renderRunnerUpMeta={(item) => (
        <ManagerName user={item} className="text-xs opacity-80 hover:opacity-100" />
      )}
      renderListItemValue={(item) => (
        <span className="text-xs font-bold text-emerald-400/80">
          +{formatShortEuro(item.profit)}€
        </span>
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
