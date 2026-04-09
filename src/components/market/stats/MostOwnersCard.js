'use client';

import { Briefcase } from 'lucide-react';
import MarketPodiumCard from './MarketPodiumCard';
import { TooltipHeader } from '@/components/ui/Tooltip';
import { HeroStatGroup, ManagerName, ManagerPill } from './StatUIComponents';

export default function MostOwnersCard({ player, onViewAll }) {
  if (!player || !Array.isArray(player) || player.length === 0) return null;

  return (
    <MarketPodiumCard
      onViewAll={onViewAll}
      data={player}
      title="El Inquieto"
      icon={Briefcase}
      color="purple"
      info={
        <>
          <TooltipHeader>El Inquieto</TooltipHeader>
          <p>
            Muestra los jugadores que han pasado por más manos distintas a lo largo de la temporada.
            Es un indicador de alta rotación y de jugadores que no terminan de encajar en los
            equipos o se usan para especular.
          </p>
        </>
      }
      winnerLabel="TROTAMUNDOS"
      renderHeroValue={(item) => (
        <div className="flex flex-col items-center">
          <span className="text-3xl font-black text-purple-400">{item.distinct_owners_count}</span>
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mt-2">
            Equipos
          </span>
        </div>
      )}
      renderHeroStats={() => (
        <HeroStatGroup stats={[{ label: 'Recurrencia', value: 'Alta rotación' }]} />
      )}
      renderHeroMeta={(item) => <ManagerPill user={item} />}
      renderRunnerUpValue={(item) => (
        <span className="text-lg font-black text-purple-400">{item.distinct_owners_count}</span>
      )}
      renderRunnerUpMeta={(item) => <ManagerName user={item} className="text-xs" />}
      renderListItemValue={(item) => (
        <span className="text-xs font-bold text-purple-400">
          {item.distinct_owners_count} <span className="text-[10px]">eq.</span>
        </span>
      )}
      renderListItemMeta={(item) => <ManagerName user={item} className="text-[10px] ml-2" />}
    />
  );
}
