'use client';

import { Skull } from 'lucide-react';
import MarketPodiumCard from './MarketPodiumCard';
import { TooltipHeader } from '@/components/ui/Tooltip';

export default function LossyPlayerCard({ data }) {
  if (!data || !Array.isArray(data) || data.length === 0) return null;

  const formatShortEuro = (val) => {
    const absVal = Math.abs(val);
    if (absVal >= 1000000) return (absVal / 1000000).toFixed(1) + 'M';
    if (absVal >= 1000) return (absVal / 1000).toFixed(0) + 'k';
    return absVal?.toLocaleString('es-ES');
  };

  return (
    <MarketPodiumCard
      data={data}
      title="El Ruinoso"
      icon={Skull}
      color="red"
      info={
        <>
          <TooltipHeader>El Ruinoso</TooltipHeader>
          <p>
            Muestra los jugadores que más pérdidas totales han generado para el conjunto de managers
            que los han comprado y vendido. Son las &quot;patatas calientes&quot; del mercado.
          </p>
        </>
      }
      winnerLabel="FÁBRICA DE PÉRDIDAS"
      renderHeroValue={(item) => (
        <div className="flex flex-col items-center">
          <span className="text-3xl font-black text-red-500">
            -{formatShortEuro(item.total_loss)}€
          </span>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
            Perdidos
          </span>
        </div>
      )}
      renderHeroStats={(item) => (
        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">
          {item.trade_count} operaciones ruinosas
        </p>
      )}
      renderRunnerUpValue={(item) => (
        <div className="flex flex-col items-end">
          <span className="text-sm font-black text-red-500">
            -{formatShortEuro(item.total_loss)}€
          </span>
          <span className="text-[9px] text-zinc-500 font-bold">{item.trade_count} ops.</span>
        </div>
      )}
      renderListItemValue={(item) => (
        <span className="text-xs font-bold text-red-500/80">
          -{formatShortEuro(item.total_loss)}€
        </span>
      )}
    />
  );
}
