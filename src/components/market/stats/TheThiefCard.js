'use client';

import { Swords } from 'lucide-react';
import MarketPodiumCard from './MarketPodiumCard';
import { TooltipHeader } from '@/components/ui/Tooltip';
import { HeroStatGroup, ManagerPill, ManagerName } from './StatUIComponents';

export default function TheThiefCard({ data, onViewAll }) {
  if (!data || !Array.isArray(data) || data.length === 0) return null;

  return (
    <MarketPodiumCard
      onViewAll={onViewAll}
      data={data}
      title="El Ladrón"
      icon={Swords}
      color="red"
      info={
        <>
          <TooltipHeader>El Ladrón</TooltipHeader>
          <p>
            El usuario que ha ganado más fichajes habiendo otras pujas de rivales. Identifica a los
            managers que más &quot;roban&quot; jugadores en subastas competitivas.
          </p>
        </>
      }
      winnerLabel="MÁS ROBOS"
      useTeamColors={false}
      renderHeroValue={(item) => (
        <span className="text-3xl font-black text-red-500">{item.stolen_count}</span>
      )}
      renderHeroStats={() => (
        <HeroStatGroup stats={[{ label: 'Condición', value: 'Con rivales pujando' }]} />
      )}
      renderHeroMeta={() => null}
      renderRunnerUpValue={(item) => (
        <div className="flex flex-col items-end">
          <span className="text-sm font-black text-red-500">{item.stolen_count}</span>
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
            robos
          </span>
        </div>
      )}
      renderRunnerUpMeta={() => null}
      renderListItemValue={(item) => (
        <span className="text-xs font-bold text-red-500">{item.stolen_count} robos</span>
      )}
    />
  );
}
