'use client';

import { ThumbsDown } from 'lucide-react';
import MarketPodiumCard from './MarketPodiumCard';
import { formatEuro } from '@/lib/utils/currency';
import { TooltipHeader } from '@/components/ui/Tooltip';
import { ManagerPill, ManagerName, HeroStatGroup } from './StatUIComponents';

export default function WorstValueCard({ player, onViewAll }) {
  if (!player || !Array.isArray(player) || player.length === 0) return null;

  const formatNumber = (val) => {
    return val?.toLocaleString('es-ES', { maximumFractionDigits: 1 });
  };

  const formatShortEuro = (val) => {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(0) + 'k';
    return val?.toLocaleString('es-ES');
  };

  return (
    <MarketPodiumCard
      onViewAll={onViewAll}
      data={player}
      title="El Flop"
      icon={ThumbsDown}
      color="red"
      info={
        <>
          <TooltipHeader>El Flop</TooltipHeader>
          <p>
            Identifica a los jugadores caros (precio &gt; 2M) con la peor relación puntos/precio.
            Representa las grandes decepciones de la temporada en términos de rendimiento por euro
            invertido.
          </p>
        </>
      }
      winnerLabel="LA DECEPCIÓN"
      renderHeroValue={(item) => (
        <div className="flex flex-col items-center">
          <span className="text-3xl font-black text-red-500">
            {formatNumber(item.points_per_million)}
          </span>
          <span className="text-[11px] uppercase font-black tracking-widest text-zinc-500 mt-2">
            PTS / MILLÓN €
          </span>
        </div>
      )}
      renderHeroStats={(item) => (
        <HeroStatGroup
          stats={[
            { label: 'Puntos', value: item.total_points },
            { label: 'Compra', value: formatShortEuro(item.purchase_price), suffix: '€' },
          ]}
        />
      )}
      renderHeroMeta={(item) => <ManagerPill user={item} />}
      renderRunnerUpValue={(item) => (
        <div className="flex flex-col items-end">
          <span className="text-lg font-black text-red-500">
            {formatNumber(item.points_per_million)}
          </span>
          <span className="text-[8px] text-zinc-500 font-bold -mt-1 uppercase tracking-tighter">
            pts/M
          </span>
        </div>
      )}
      renderRunnerUpMeta={(item) => <ManagerName user={item} className="text-xs" />}
      renderListItemValue={(item) => (
        <span className="text-xs font-bold text-rose-400">
          {item.points_per_million?.toFixed(1)}{' '}
          <span className="text-[10px] opacity-60">pts/M</span>
        </span>
      )}
      renderListItemMeta={(item) => <ManagerName user={item} className="text-[10px] ml-2" />}
    />
  );
}
