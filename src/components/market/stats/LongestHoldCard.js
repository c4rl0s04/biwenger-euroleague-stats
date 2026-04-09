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
        <div className="flex flex-col items-center">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-teal-600/20 to-cyan-600/20 px-6 py-3 rounded-2xl border border-teal-500/30 mb-3">
            <span className="text-3xl font-black text-pink-400">
              {item.hold_days} <span className="text-sm">días</span>
            </span>
          </div>
        </div>
      )}
      renderHeroMeta={(item) => <ManagerPill user={item} />}
      renderRunnerUpValue={(item) => (
        <span className="text-sm font-black text-pink-400">{item.hold_days} días</span>
      )}
      renderRunnerUpMeta={(item) => <ManagerName user={item} className="text-xs" />}
      renderListItemValue={(item) => (
        <span className="text-xs font-bold text-pink-400">
          {item.hold_days} <span className="text-[10px]">días</span>
        </span>
      )}
      renderListItemMeta={(item) => <ManagerName user={item} className="text-[10px] ml-2" />}
    />
  );
}
