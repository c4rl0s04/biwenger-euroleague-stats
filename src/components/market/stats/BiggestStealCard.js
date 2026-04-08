'use client';

import { Search, Trophy, XCircle } from 'lucide-react';
import Link from 'next/link';
import MarketPodiumCard from './MarketPodiumCard';
import { formatEuro } from '@/lib/utils/currency';
import { TooltipHeader } from '@/components/ui/Tooltip';

export default function BiggestStealCard({ data }) {
  if (!data || !Array.isArray(data) || data.length === 0) return null;

  const formatShortEuro = (val) => {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(0) + 'k';
    return val?.toLocaleString('es-ES');
  };

  return (
    <MarketPodiumCard
      data={data}
      title="Mayor Robo"
      icon={Search}
      color="cyan"
      info={
        <>
          <TooltipHeader>Mayor Robo</TooltipHeader>
          <p>
            Muestra los fichajes ganados por la mínima diferencia respecto a la segunda puja más
            alta. Representa la máxima eficiencia al pujar.
          </p>
        </>
      }
      winnerLabel="MÍNIMA DIFERENCIA"
      renderHeroValue={(item) => (
        <span className="text-3xl font-black text-cyan-400">
          +{formatShortEuro(item.price_diff)}€
        </span>
      )}
      renderHeroStats={(item) => (
        <div className="grid grid-cols-2 gap-2 mt-2 px-2">
          <div className="bg-cyan-900/10 border border-cyan-500/20 rounded-lg p-1.5">
            <Trophy size={10} className="text-cyan-400 inline mr-1" />
            <span className="text-[9px] text-cyan-400 uppercase font-black">Ganador</span>
            <div className="text-[10px] font-bold text-white truncate">{item.winner}</div>
          </div>
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-1.5">
            <XCircle size={10} className="text-zinc-500 inline mr-1" />
            <span className="text-[9px] text-zinc-500 uppercase font-black">2º Lugar</span>
            <div className="text-[10px] font-bold text-zinc-300 truncate">
              {item.second_bidder_name || 'Desconocido'}
            </div>
          </div>
        </div>
      )}
      renderRunnerUpValue={(item) => (
        <span className="text-sm font-black text-cyan-400">
          +{formatShortEuro(item.price_diff)}€
        </span>
      )}
      renderRunnerUpMeta={(item) => (
        <div className="text-[10px] text-zinc-500 truncate mt-0.5">
          {item.winner} vs {item.second_bidder_name || 'desconocido'}
        </div>
      )}
      renderListItemValue={(item) => (
        <span className="text-xs font-bold text-cyan-400/80">
          +{formatShortEuro(item.price_diff)}€
        </span>
      )}
      renderListItemMeta={(item) => (
        <div className="text-[9px] text-zinc-600 truncate ml-2 font-medium">
          {item.winner} vs {item.second_bidder_name || '...'}
        </div>
      )}
    />
  );
}
