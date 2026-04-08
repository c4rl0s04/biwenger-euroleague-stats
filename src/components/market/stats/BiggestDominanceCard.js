'use client';

import { Crown } from 'lucide-react';
import MarketPodiumCard from './MarketPodiumCard';
import { TooltipHeader } from '@/components/ui/Tooltip';
import { HeroStatGroup, ManagerName } from './StatUIComponents';

export default function BiggestDominanceCard({ data }) {
  if (!data || !data.leader_id || !data.trailer_id) return null;

  const leaderWins = data.user1_id === data.leader_id ? data.wins1 : data.wins2;
  const trailerWins = data.user1_id === data.trailer_id ? data.wins1 : data.wins2;

  return (
    <MarketPodiumCard
      data={[data]}
      title="Dominio Más Claro"
      icon={Crown}
      color="emerald"
      useTeamColors={false}
      info={
        <>
          <TooltipHeader>Dominio Más Claro</TooltipHeader>
          <p>
            Identifica el enfrentamiento más desequilibrado entre dos managers. Muestra quién ha
            &quot;tomado la medida&quot; a quién en las subastas directas.
          </p>
        </>
      }
      fields={{
        name: 'leader_name',
        value: 'wins1',
      }}
      renderHeroValue={(item) => (
        <span className="text-3xl font-black text-emerald-400">
          {leaderWins} - {trailerWins}
        </span>
      )}
      renderHeroStats={(item) => (
        <HeroStatGroup stats={[{ label: 'Duelos Totales', value: item.duels }]} />
      )}
      renderHeroMeta={(item) => (
        <div className="flex items-center justify-center gap-2 text-base font-black uppercase tracking-tight text-white/90">
          <ManagerName
            user={{
              user_id: item.leader_id,
              user_name: item.leader_name,
              user_color_index: item.leader_color,
            }}
          />
          <span className="text-zinc-500 text-xs mx-1">SOBRE</span>
          <ManagerName
            user={{
              user_id: item.trailer_id,
              user_name: item.trailer_name,
              user_color_index: item.trailer_color,
            }}
          />
        </div>
      )}
      renderRunnerUpValue={() => null}
    />
  );
}
