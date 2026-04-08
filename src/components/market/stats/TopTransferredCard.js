'use client';

import { Flame } from 'lucide-react';
import MarketPodiumCard from './MarketPodiumCard';
import { formatEuro } from '@/lib/utils/currency';
import { TooltipHeader } from '@/components/ui/Tooltip';
import { HeroStatGroup } from './StatUIComponents';

export default function TopTransferredCard({ player }) {
  if (!player || !Array.isArray(player) || player.length === 0) return null;

  return (
    <MarketPodiumCard
      data={player}
      title="El más fichado"
      icon={Flame}
      color="orange"
      info={
        <>
          <TooltipHeader>El más fichado</TooltipHeader>
          <p>
            Muestra los jugadores que han protagonizado más traspasos entre managers. Un alto
            volumen de fichajes suele indicar jugadores clave que cambian de manos frecuentemente
            por estrategia o necesidad de caja.
          </p>
        </>
      }
      winnerLabel="JUGADOR DE MODA"
      renderHeroValue={(item) => (
        <div className="flex flex-col items-center">
          <span className="text-3xl font-black text-orange-400">{item.transfer_count}</span>
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mt-2">
            Fichajes
          </span>
        </div>
      )}
      renderHeroStats={(item) => (
        <HeroStatGroup stats={[{ label: 'Avg', value: formatEuro(item.avg_price), suffix: '€' }]} />
      )}
      renderRunnerUpValue={(item) => (
        <span className="text-lg font-black text-orange-400">{item.transfer_count}</span>
      )}
      renderRunnerUpMeta={(item) => (
        <div className="text-xs text-zinc-500 font-bold truncate mt-0.5">
          Avg: {formatEuro(item.avg_price)} €
        </div>
      )}
      renderListItemValue={(item) => (
        <span className="text-xs font-bold text-orange-400/80">
          {item.transfer_count} <span className="text-[10px] opacity-60">fich.</span>
        </span>
      )}
    />
  );
}
