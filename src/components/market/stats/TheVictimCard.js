'use client';

import { Frown } from 'lucide-react';
import MarketPodiumCard from './MarketPodiumCard';
import { TooltipHeader } from '@/components/ui/Tooltip';
import { HeroStatGroup, ManagerPill, ManagerName } from './StatUIComponents';

export default function TheVictimCard({ data }) {
  if (!data || !Array.isArray(data) || data.length === 0) return null;

  return (
    <MarketPodiumCard
      data={data}
      title="La Víctima"
      icon={Frown}
      color="pink"
      info={
        <>
          <TooltipHeader>La Víctima</TooltipHeader>
          <p>
            Identifica a los managers que más pujas han perdido. Son aquellos que se han quedado a
            las puertas de conseguir un fichaje porque otro manager pujó más.
          </p>
        </>
      }
      winnerLabel="MÁS PUJAS PERDIDAS"
      useTeamColors={false}
      renderHeroValue={(item) => (
        <span className="text-3xl font-black text-pink-500">{item.failed_bids_count}</span>
      )}
      renderHeroStats={() => (
        <HeroStatGroup stats={[{ label: 'Condición', value: 'Donde otro manager ganó' }]} />
      )}
      renderHeroMeta={(item) => <ManagerPill user={item} />}
      renderRunnerUpValue={(item) => (
        <div className="flex flex-col items-end">
          <span className="text-sm font-black text-pink-500">{item.failed_bids_count}</span>
          <span className="text-[10px] text-zinc-500 font-bold">fallos</span>
        </div>
      )}
      renderRunnerUpMeta={(item) => (
        <ManagerName user={item} className="text-xs opacity-80 hover:opacity-100" />
      )}
      renderListItemValue={(item) => (
        <span className="text-xs font-bold text-pink-500/80">{item.failed_bids_count} fallos</span>
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
