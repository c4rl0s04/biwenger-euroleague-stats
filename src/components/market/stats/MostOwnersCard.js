'use client';

import { Briefcase } from 'lucide-react';
import MarketPodiumCard from './MarketPodiumCard';

export default function MostOwnersCard({ player }) {
  if (!player || !Array.isArray(player) || player.length === 0) return null;

  return (
    <MarketPodiumCard
      data={player}
      title="El Inquieto"
      icon={Briefcase}
      color="purple"
      info="Más Equipos Diferentes. El jugador que ha pasado por más manos distintas."
      winnerLabel="TROTAMUNDOS"
      renderHeroValue={(item) => (
        <div className="flex flex-col items-center">
          <span className="text-4xl font-black text-purple-400">{item.distinct_owners_count}</span>
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">
            Equipos
          </span>
        </div>
      )}
      renderRunnerUpValue={(item) => (
        <span className="text-lg font-black text-purple-400">{item.distinct_owners_count}</span>
      )}
      renderRunnerUpMeta={(item) => (
        <div className="text-[10px] text-zinc-500 truncate mt-0.5">Equipos diferentes</div>
      )}
      renderListItemValue={(item) => (
        <span className="text-xs font-bold text-purple-400/80">
          {item.distinct_owners_count} <span className="text-[9px] opacity-60">eq.</span>
        </span>
      )}
    />
  );
}
