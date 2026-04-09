'use client';

import { Hourglass, Clock } from 'lucide-react';
import MarketPodiumCard from './MarketPodiumCard';
import { formatEuro } from '@/lib/utils/currency';
import { TooltipHeader } from '@/components/ui/Tooltip';
import { HeroStatGroup, ManagerPill, ManagerName } from './StatUIComponents';

export default function LongestHoldCard({ data, onViewAll }) {
  if (!data || !Array.isArray(data) || data.length === 0) return null;

  const formatShortEuro = (val) => {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(0) + 'k';
    return val?.toLocaleString('es-ES');
  };

  const formatDays = (days) => {
    if (days >= 365) return `${(days / 365).toFixed(1)}a`;
    if (days >= 30) return `${(days / 30).toFixed(1)}m`;
    return `${days.toFixed(0)}d`;
  };

  return (
    <MarketPodiumCard
      onViewAll={onViewAll}
      data={data}
      title="El Hold"
      icon={Hourglass}
      color="teal"
      info={
        <>
          <TooltipHeader>El Hold</TooltipHeader>
          <p>
            Muestra las inversiones más pacientes: jugadores que han permanecido más tiempo en la
            plantilla de un manager y han acabado generando un beneficio neto al ser vendidos.
          </p>
        </>
      }
      winnerLabel="EL HOLD"
      renderHeroValue={(item) => (
        <div className="flex flex-col items-center gap-0.5">
          <div className="inline-flex items-center gap-2 mb-1">
            <Hourglass className="w-5 h-5 text-teal-400" />
            <span className="text-3xl font-black text-teal-400">{formatDays(item.days_held)}</span>
          </div>
          <div className="text-emerald-400 text-xl font-black">
            +{formatShortEuro(item.profit)}€
          </div>
        </div>
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
        <div className="flex flex-col items-end">
          <span className="text-sm font-black text-teal-400">{formatDays(item.days_held)}</span>
          <span className="text-[10px] text-emerald-400 font-bold">
            +{formatShortEuro(item.profit)}€
          </span>
        </div>
      )}
      renderRunnerUpMeta={(item) => <ManagerName user={item} className="text-xs" />}
      renderListItemValue={(item) => (
        <span className="text-xs font-bold text-teal-400">{formatDays(item.days_held)}</span>
      )}
      renderListItemMeta={(item) => <ManagerName user={item} className="text-[10px] ml-2" />}
    />
  );
}
