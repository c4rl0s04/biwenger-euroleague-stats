'use client';

import { ThumbsDown } from 'lucide-react';
import Link from 'next/link';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';

export default function WorstValueCard({ player }) {
  if (!player || !Array.isArray(player) || player.length === 0) return null;

  const winner = player[0];
  const runnerUps = player.slice(1);

  const formatNumber = (val) => {
    return val?.toLocaleString('es-ES', { maximumFractionDigits: 1 });
  };

  const formatEuro = (val) => {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(0) + 'k';
    return val?.toLocaleString('es-ES');
  };

  return (
    <div className="h-full hover:scale-[1.02] transition-transform duration-200">
      <ElegantCard
        title="El Flop"
        icon={ThumbsDown}
        color="red"
        info="Peor Rentabilidad. Puntos por millón más bajos entre jugadores caros (>2M). La gran decepción."
      >
        <div className="flex flex-col h-full">
          {/* Winner Section */}
          <div className="mt-2 text-center">
            <div className="text-xs text-red-500 uppercase tracking-widest font-black mb-1">
              LA DECEPCIÓN
            </div>

            <div className="text-xl md:text-2xl font-black text-red-500 truncate px-2 leading-tight">
              {winner.player_name}
            </div>

            <div className="text-xl md:text-2xl font-black text-white mt-1">
              {formatNumber(winner.points_per_million)}{' '}
              <span className="text-sm md:text-base font-bold text-zinc-500">pts/M€</span>
            </div>

            <Link href={`/user/${winner.user_id}`} className="group">
              <span className="text-xs font-bold text-red-400 group-hover:brightness-110 transition-all">
                {winner.user_name}
              </span>
            </Link>
          </div>

          {/* Runner-ups List */}
          {runnerUps.length > 0 && (
            <div className="mt-3 border-t border-zinc-800 pt-2">
              <div className="space-y-1">
                {runnerUps.map((item, index) => (
                  <div
                    key={item.player_id + '-' + index}
                    className="flex items-center justify-between px-2 py-1 text-xs hover:bg-zinc-800/50 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500 font-bold w-4">{index + 2}.</span>
                      <span className="text-zinc-300 truncate">{item.player_name}</span>
                    </div>
                    <span className="text-red-400 font-semibold">
                      {formatNumber(item.points_per_million)}
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
