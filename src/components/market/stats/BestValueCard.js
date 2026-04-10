'use client';

import { Tag } from 'lucide-react';
import MarketPodiumCard from './MarketPodiumCard';
import { formatEuro } from '@/lib/utils/currency';
import { TooltipHeader } from '@/components/ui/Tooltip';
import { HeroStatGroup, ManagerPill, ManagerName } from './StatUIComponents';

export default function BestValueCard({ data, onViewAll }) {
  if (!data || !Array.isArray(data) || data.length === 0) return null;

  return (
    <MarketPodiumCard
      onViewAll={onViewAll}
      data={data}
      title="El Chollo"
      icon={Tag}
      color="amber"
      info={
        <>
          <TooltipHeader>El Chollo</TooltipHeader>
          <p>
            Muestra los jugadores con mejor relación puntos/precio (Puntos por cada millón
            invertido). Identifica a los jugadores más eficientes que han aportado un gran
            rendimiento por un coste bajo.
          </p>
        </>
      }
      winnerLabel="EL CHOLLO"
      renderHeroValue={(item) => (
        <div className="flex flex-col items-center">
          <span className="text-3xl font-black text-amber-400">
            {item.points_per_million?.toFixed(1)} PTS/M
          </span>
        </div>
      )}
      renderHeroStats={(item) => (
        <HeroStatGroup
          stats={[
            { label: 'Puntos', value: item.total_points },
            { label: 'Compra', value: formatEuro(item.purchase_price), suffix: '€' },
          ]}
        />
      )}
      renderHeroMeta={(item) => <ManagerPill user={item} />}
      renderRunnerUpValue={(item) => (
        <div className="flex flex-col items-end">
          <span className="text-lg font-black text-amber-400">
            {item.points_per_million?.toFixed(1)}
          </span>
          <span className="text-[8px] text-zinc-500 font-bold -mt-1 uppercase tracking-tighter">
            pts/M
          </span>
        </div>
      )}
      renderRunnerUpMeta={(item) => <ManagerName user={item} className="text-xs" />}
      renderListItemValue={(item) => (
        <span className="text-xs font-bold text-amber-400">
          {item.points_per_million?.toFixed(1)}{' '}
          <span className="text-[10px] opacity-60">pts/M</span>
        </span>
      )}
      renderListItemMeta={(item) => <ManagerName user={item} className="text-[10px] ml-2" />}
    />
  );
}
