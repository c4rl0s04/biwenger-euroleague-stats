'use client';

import { Flame } from 'lucide-react';
import MarketPodiumCard from './MarketPodiumCard';
import { formatEuro } from '@/lib/utils/currency';
import { TooltipHeader } from '@/components/ui/Tooltip';
import { HeroStatGroup, ManagerName } from './StatUIComponents';

export default function HottestRivalryCard({ data, onViewAll }) {
  if (!data) return null;

  return (
    <MarketPodiumCard
      onViewAll={onViewAll}
      data={[data]}
      title="Rivalidad Más Caliente"
      icon={Flame}
      color="orange"
      useTeamColors={false}
      info={
        <>
          <TooltipHeader>Rivalidad Más Caliente</TooltipHeader>
          <p>
            La pareja de managers que más veces se ha enfrentado cara a cara en una subasta. Indica
            dónde saltan chispas cada vez que sale un jugador al mercado.
          </p>
        </>
      }
      fields={{
        name: 'user1_name', // We'll customize the render
        value: 'duels',
      }}
      renderHeroValue={(item) => (
        <span className="text-3xl font-black text-orange-400">{item.duels}</span>
      )}
      renderHeroStats={(item) => (
        <HeroStatGroup
          stats={[
            { label: 'Marcador', value: `${item.wins1} - ${item.wins2}` },
            { label: 'Margen Medio', value: `+${formatEuro(item.avg_margin)}`, suffix: '€' },
          ]}
        />
      )}
      renderHeroMeta={(item) => (
        <div className="flex items-center justify-center gap-2 text-base font-black uppercase tracking-tight text-white/90">
          <ManagerName
            user={{
              user_id: item.user1_id,
              user_name: item.user1_name,
              user_color_index: item.user1_color,
            }}
          />
          <span className="text-zinc-500 text-xs mx-1">VS</span>
          <ManagerName
            user={{
              user_id: item.user2_id,
              user_name: item.user2_name,
              user_color_index: item.user2_color,
            }}
          />
        </div>
      )}
      renderRunnerUpValue={() => null} // Only one result
    />
  );
}
