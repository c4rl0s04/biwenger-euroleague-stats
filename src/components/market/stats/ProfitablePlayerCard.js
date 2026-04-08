'use client';

import { Egg } from 'lucide-react';
import MarketPodiumCard from './MarketPodiumCard';
import { TooltipHeader } from '@/components/ui/Tooltip';

export default function ProfitablePlayerCard({ data }) {
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
      title="La Gallina"
      icon={Egg}
      color="yellow"
      info={
        <>
          <TooltipHeader>La Gallina</TooltipHeader>
          <p>
            Muestra los jugadores que más beneficio total han generado para el conjunto de managers
            que los han comprado y vendido. Es el ranking de los jugadores más rentables
            históricamente en la liga.
          </p>
        </>
      }
      winnerLabel="MÁQUINA DE DINERO"
      renderHeroValue={(item) => (
        <div className="flex flex-col items-center">
          <span className="text-3xl font-black text-yellow-500">
            +{formatShortEuro(item.total_profit)}€
          </span>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
            Generados
          </span>
        </div>
      )}
      renderHeroStats={(item) => (
        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">
          {item.trade_count} operaciones rentables
        </p>
      )}
      renderRunnerUpValue={(item) => (
        <div className="flex flex-col items-end">
          <span className="text-sm font-black text-yellow-500">
            +{formatShortEuro(item.total_profit)}€
          </span>
          <span className="text-[9px] text-zinc-500 font-bold">{item.trade_count} ops.</span>
        </div>
      )}
      renderListItemValue={(item) => (
        <span className="text-xs font-bold text-yellow-500/80">
          +{formatShortEuro(item.total_profit)}€
        </span>
      )}
    />
  );
}
