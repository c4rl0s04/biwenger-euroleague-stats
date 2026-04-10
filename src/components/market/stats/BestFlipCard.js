'use client';

import { Rocket } from 'lucide-react';
import { formatEuro } from '@/lib/utils/currency';
import MarketPodiumCard from './MarketPodiumCard';
import { HeroStatGroup, ManagerPill, ManagerName } from './StatUIComponents';
import { TooltipHeader } from '@/components/ui/Tooltip';

export default function BestFlipCard({ data, onViewAll }) {
  if (!data || !Array.isArray(data) || data.length === 0) return null;

  return (
    <MarketPodiumCard
      onViewAll={onViewAll}
      data={data}
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
          +{formatEuro(item.profit, true)}€
        </span>
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
        <span className="text-sm font-black text-emerald-400">
          +{formatEuro(item.profit, true)}€
        </span>
      )}
      renderRunnerUpMeta={(item) => <ManagerName user={item} className="text-xs" />}
      renderListItemValue={(item) => (
        <span className="text-xs font-bold text-emerald-400/80">
          +{formatEuro(item.profit, true)}€
        </span>
      )}
      renderListItemMeta={(item) => <ManagerName user={item} className="text-[10px] ml-2" />}
    />
  );
}
