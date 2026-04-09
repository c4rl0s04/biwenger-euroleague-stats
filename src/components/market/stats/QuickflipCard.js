'use client';

import { Zap, Timer } from 'lucide-react';
import MarketPodiumCard from './MarketPodiumCard';
import { formatEuro } from '@/lib/utils/currency';
import { TooltipHeader } from '@/components/ui/Tooltip';
import { HeroStatGroup, ManagerPill, ManagerName } from './StatUIComponents';

export default function QuickflipCard({ data, onViewAll }) {
  if (!data || !Array.isArray(data) || data.length === 0) return null;

  const formatShortEuro = (val) => {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(0) + 'k';
    return val?.toLocaleString('es-ES');
  };

  const formatTime = (hours) => {
    if (hours < 1) return `${Math.round(hours * 60)}min`;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    return `${(hours / 24).toFixed(1)}d`;
  };

  return (
    <MarketPodiumCard
      onViewAll={onViewAll}
      data={data}
      title="El Quickflip"
      icon={Zap}
      color="orange"
      info={
        <>
          <TooltipHeader>El Quickflip</TooltipHeader>
          <p>
            La operación de compraventa más rápida con beneficio. Premia a los managers que detectan
            valor y venden en el menor tiempo posible para liberar presupuesto.
          </p>
        </>
      }
      winnerLabel="EL QUICKFLIP"
      renderHeroValue={(item) => (
        <div className="flex flex-col items-center gap-0.5">
          <div className="inline-flex items-center gap-2 mb-1">
            <Timer className="w-5 h-5 text-orange-400" />
            <span className="text-3xl font-black text-orange-400">
              {formatTime(item.hours_held)}
            </span>
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
          <span className="text-sm font-black text-orange-400">{formatTime(item.hours_held)}</span>
          <span className="text-[10px] text-emerald-400 font-bold">
            +{formatShortEuro(item.profit)}€
          </span>
        </div>
      )}
      renderRunnerUpMeta={(item) => <ManagerName user={item} className="text-xs" />}
      renderListItemValue={(item) => (
        <span className="text-xs font-bold text-orange-400">{formatTime(item.hours_held)}</span>
      )}
      renderListItemMeta={(item) => <ManagerName user={item} className="text-[10px] ml-2" />}
    />
  );
}
