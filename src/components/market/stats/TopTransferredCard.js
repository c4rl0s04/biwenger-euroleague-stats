'use client';

import { Flame } from 'lucide-react';
import Link from 'next/link';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';

export default function TopTransferredCard({ player }) {
  if (!player || !Array.isArray(player) || player.length === 0) return null;

  const winner = player[0];
  const runnerUps = player.slice(1);

  const formatEuro = (val) => {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(0) + 'k';
    return val.toLocaleString('es-ES');
  };

  return (
    <div className="h-full hover:scale-[1.02] transition-transform duration-200">
      <ElegantCard title="El más fichado" icon={Flame} color="orange">
        <div className="flex flex-col h-full">
          {/* Winner Section */}
          <div className="mt-2 text-center">
            <div className="text-xs text-orange-500 uppercase tracking-widest font-black mb-1">
              JUGADOR DE MODA
            </div>

            <Link href={`/player/${winner.player_id}`} className="block group">
              <div className="text-xl md:text-2xl font-black text-orange-500 group-hover:text-orange-400 transition-colors truncate px-2 leading-tight">
                {winner.name}
              </div>
            </Link>

            <div className="text-xl md:text-2xl font-black text-white mt-1">
              {winner.transfer_count}{' '}
              <span className="text-sm md:text-base font-bold text-zinc-500">fichajes</span>
            </div>
            <p className="text-[10px] text-zinc-500 font-bold">
              Avg: {formatEuro(winner.avg_price)} €
            </p>
          </div>

          {/* Runner-ups List */}
          {runnerUps.length > 0 && (
            <div className="mt-3 border-t border-zinc-800 pt-2 max-h-32 overflow-y-auto">
              <div className="space-y-1">
                {runnerUps.map((item, index) => (
                  <div
                    key={item.player_id || index}
                    className="flex items-center justify-between px-2 py-1 text-xs hover:bg-zinc-800/50 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500 font-bold w-4">{index + 2}.</span>
                      <Link
                        href={`/player/${item.player_id}`}
                        className="text-zinc-300 hover:text-orange-400 truncate"
                      >
                        {item.name}
                      </Link>
                    </div>
                    <span className="text-zinc-400 font-semibold">{item.transfer_count}</span>
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
