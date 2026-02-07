'use client';

import { Telescope } from 'lucide-react';
import Link from 'next/link';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';

export default function BestRevaluationCard({ data }) {
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
        title="El Visionario"
        icon={Telescope}
        color="purple"
        info="Mayor incremento de valor de un jugador desde su fichaje hasta hoy. (Valor Actual - Precio Compra)"
      >
        <div className="flex flex-col h-full">
          {/* Winner Section */}
          <div className="mt-2 text-center">
            <div className="text-xs text-purple-500 uppercase tracking-widest font-black mb-1">
              MAYOR REVALORIZACIÓN
            </div>

            <Link href={`/player/${winner.player_id}`} className="block group">
              <div className="text-xl md:text-2xl font-black text-purple-400 group-hover:text-purple-300 transition-colors truncate px-2 leading-tight">
                {winner.player_name}
              </div>
            </Link>

            <div className="text-xl md:text-2xl font-black text-white mt-1">
              +{formatEuro(winner.revaluation)} €
            </div>

            <Link href={`/user/${winner.user_id}`} className="group">
              <span className="text-xs font-bold text-purple-400 group-hover:brightness-110 transition-all">
                {winner.user_name}
              </span>
            </Link>
          </div>

          {/* Runner-ups List */}
          {runnerUps.length > 0 && (
            <div className="mt-3 border-t border-zinc-800 pt-2 max-h-32 overflow-y-auto">
              <div className="space-y-1">
                {runnerUps.map((item, index) => (
                  <div
                    key={item.player_id + '-' + index}
                    className="flex items-center justify-between px-2 py-1 text-xs hover:bg-zinc-800/50 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500 font-bold w-4">{index + 2}.</span>
                      <Link
                        href={`/player/${item.player_id}`}
                        className="text-zinc-300 hover:text-purple-400 truncate"
                      >
                        {item.player_name}
                      </Link>
                    </div>
                    <span className="text-purple-400 font-semibold">
                      +{formatEuro(item.revaluation)}€
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
