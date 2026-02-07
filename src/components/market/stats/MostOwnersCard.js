'use client';

import { Briefcase } from 'lucide-react';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';

export default function MostOwnersCard({ player }) {
  if (!player || !Array.isArray(player) || player.length === 0) return null;

  const winner = player[0];
  const runnerUps = player.slice(1);

  return (
    <div className="h-full hover:scale-[1.02] transition-transform duration-200">
      <ElegantCard
        title="El Inquieto"
        icon={Briefcase}
        color="purple"
        info="Más Equipos Diferentes. El jugador que ha pasado por más manos distintas."
      >
        <div className="flex flex-col h-full">
          {/* Winner Section */}
          <div className="mt-2 text-center">
            <div className="text-xs text-purple-500 uppercase tracking-widest font-black mb-1">
              TROTAMUNDOS
            </div>

            <div className="text-xl md:text-2xl font-black text-purple-500 truncate px-2 leading-tight">
              {winner.player_name}
            </div>

            <div className="text-xl md:text-2xl font-black text-white mt-1">
              {winner.distinct_owners_count}{' '}
              <span className="text-sm md:text-base font-bold text-zinc-500">equipos</span>
            </div>
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
                      <span className="text-zinc-300 truncate">{item.player_name}</span>
                    </div>
                    <span className="text-zinc-400 font-semibold">
                      {item.distinct_owners_count}
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
