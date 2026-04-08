'use client';

import { Flame } from 'lucide-react';
import Link from 'next/link';
import MarketPodiumCard from './MarketPodiumCard';
import { formatEuro } from '@/lib/utils/currency';
import { TooltipHeader } from '@/components/ui/Tooltip';

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
          <span className="text-4xl font-black text-orange-400">{item.transfer_count}</span>
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">
            Fichajes
          </span>
        </div>
      )}
      renderHeroStats={(item) => (
        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">
          Avg: {formatEuro(item.avg_price)} €
        </p>
      )}
      renderRunnerUpValue={(item) => (
        <span className="text-lg font-black text-orange-400">{item.transfer_count}</span>
      )}
      renderRunnerUpMeta={(item) => (
        <div className="text-[10px] text-zinc-500 truncate mt-0.5">
          Avg: {formatEuro(item.avg_price)} €
        </div>
      )}
      renderListItemValue={(item) => (
        <span className="text-xs font-bold text-orange-400/80">
          {item.transfer_count} <span className="text-[9px] opacity-60">fich.</span>
        </span>
      )}
    />
  );
}
