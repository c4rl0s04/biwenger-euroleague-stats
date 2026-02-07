'use client';

import { Search, Trophy, XCircle } from 'lucide-react';
import Link from 'next/link';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';

export default function BiggestStealCard({ data }) {
  if (!data || !Array.isArray(data) || data.length === 0) return null;

  const winner = data[0];
  const runnerUps = data.slice(1);

  const formatEuro = (val) => {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(0) + 'k';
    return val?.toLocaleString('es-ES');
  };

  return (
    <div className="h-full hover:scale-[1.02] transition-transform duration-200">
      <ElegantCard
        title="Mayor Robo"
        icon={Search}
        color="cyan"
        info="El fichaje ganado por la mínima diferencia respecto a la segunda puja más alta."
      >
        <div className="flex flex-col h-full">
          {/* Winner Section */}
          <div className="mt-2 text-center">
            <div className="text-xs text-cyan-500 uppercase tracking-widest font-black mb-1">
              MÍNIMA DIFERENCIA
            </div>

            <Link href={`/player/${winner.player_id}`} className="block group">
              <div className="text-xl md:text-2xl font-black text-cyan-500 group-hover:text-cyan-400 transition-colors truncate px-2 leading-tight">
                {winner.player_name}
              </div>
            </Link>

            <div className="text-xl md:text-2xl font-black text-white mt-1">
              +{formatEuro(winner.price_diff)} €
            </div>

            {/* Comparison */}
            <div className="grid grid-cols-2 gap-2 mt-2 px-2">
              <div className="bg-cyan-900/10 border border-cyan-500/20 rounded-lg p-1.5">
                <Trophy size={10} className="text-cyan-400 inline mr-1" />
                <span className="text-[9px] text-cyan-400 uppercase font-black">Ganador</span>
                <div className="text-[10px] font-bold text-white truncate">{winner.winner}</div>
              </div>
              <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-1.5">
                <XCircle size={10} className="text-zinc-500 inline mr-1" />
                <span className="text-[9px] text-zinc-500 uppercase font-black">2º Lugar</span>
                <div className="text-[10px] font-bold text-zinc-300 truncate">
                  {winner.second_bidder_name || 'Desconocido'}
                </div>
              </div>
            </div>
          </div>

          {/* Runner-ups List */}
          {runnerUps.length > 0 && (
            <div className="mt-3 border-t border-zinc-800 pt-2 max-h-28 overflow-y-auto">
              <div className="space-y-1">
                {runnerUps.map((item, index) => (
                  <div
                    key={item.transfer_id || index}
                    className="flex items-center justify-between px-2 py-1 text-xs hover:bg-zinc-800/50 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500 font-bold w-4">{index + 2}.</span>
                      <span className="text-zinc-300 truncate">{item.player_name}</span>
                    </div>
                    <span className="text-cyan-400 font-semibold">
                      +{formatEuro(item.price_diff)}€
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ElegantCard>
    </div>
  );
}
