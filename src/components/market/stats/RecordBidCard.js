'use client';

import { Gavel } from 'lucide-react';
import MarketPodiumCard from './MarketPodiumCard';
import { formatEuro } from '@/lib/utils/currency';
import { TooltipHeader } from '@/components/ui/Tooltip';

export default function RecordBidCard({ record }) {
  if (!record || !Array.isArray(record) || record.length === 0) return null;

  return (
    <MarketPodiumCard
      data={record}
      title="Récord Pujas"
      icon={Gavel}
      color="purple"
      info={
        <>
          <TooltipHeader>Récord de Pujas</TooltipHeader>
          <p>
            Los fichajes con mayor competencia en la subasta, ordenados por el número total de pujas
            recibidas. Refleja las peleas más intensas por un jugador.
          </p>
        </>
      }
      winnerLabel="MÁS PUJAS"
      renderHeroValue={(item) => (
        <div className="flex flex-col items-center">
          <span className="text-3xl font-black text-purple-400">{item.bid_count}</span>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
            Pujas
          </span>
        </div>
      )}
      renderHeroStats={(item) => (
        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">
          Ganador: {item.comprador} • {formatEuro(item.precio)}€
        </p>
      )}
      renderRunnerUpValue={(item) => (
        <div className="flex flex-col items-end">
          <span className="text-sm font-black text-purple-400">{item.bid_count}</span>
          <span className="text-[9px] text-zinc-500 font-bold">pujas</span>
        </div>
      )}
      renderRunnerUpMeta={(item) => (
        <p className="text-[10px] text-zinc-500 truncate">
          {item.comprador} • {formatEuro(item.precio)}€
        </p>
      )}
      renderListItemValue={(item) => (
        <span className="text-xs font-bold text-purple-400/80">{item.bid_count} pujas</span>
      )}
    />
  );
}
