'use client';

import { Clock } from 'lucide-react';
import MarketPodiumCard from './MarketPodiumCard';
import { formatEuro } from '@/lib/utils/currency';
import { TooltipHeader } from '@/components/ui/Tooltip';
import { HeroStatGroup, ManagerPill, ManagerName } from './StatUIComponents';

export default function MissedOpportunityCard({ data }) {
  if (!data || !Array.isArray(data) || data.length === 0) return null;

  const formatShortEuro = (val) => {
    const absVal = Math.abs(val);
    if (absVal >= 1000000) return (absVal / 1000000).toFixed(1) + 'M';
    if (absVal >= 1000) return (absVal / 1000).toFixed(0) + 'k';
    return absVal?.toLocaleString('es-ES');
  };

  return (
    <MarketPodiumCard
      data={data}
      title="El Impaciente"
      icon={Clock}
      color="amber"
      info={
        <>
          <TooltipHeader>El Impaciente</TooltipHeader>
          <p>
            Destaca a los managers que vendieron a un jugador justo antes de que su valor se
            disparara. Es la diferencia entre el precio de venta y su valor de mercado pico o
            actual.
          </p>
        </>
      }
      winnerLabel="EL IMPACIENTE"
      renderHeroValue={(item) => (
        <span className="text-3xl font-black text-amber-400">
          +{formatShortEuro(item.missed_profit)}€
        </span>
      )}
      renderHeroStats={(item) => (
        <HeroStatGroup
          stats={[
            { label: 'Venta', value: formatShortEuro(item.sale_price), suffix: '€' },
            { label: 'Actual', value: formatShortEuro(item.current_price), suffix: '€' },
          ]}
        />
      )}
      renderHeroMeta={(item) => <ManagerPill user={item} />}
      renderRunnerUpValue={(item) => (
        <span className="text-sm font-black text-amber-400">
          +{formatShortEuro(item.missed_profit)}€
        </span>
      )}
      renderRunnerUpMeta={(item) => (
        <ManagerName user={item} className="text-[10px] opacity-80 hover:opacity-100" />
      )}
      renderListItemValue={(item) => (
        <span className="text-xs font-bold text-amber-400/80">
          +{formatShortEuro(item.missed_profit)}€
        </span>
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
