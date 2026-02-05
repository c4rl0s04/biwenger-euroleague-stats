'use client';

import { Briefcase, Users } from 'lucide-react';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';

export default function MostOwnersCard({ player }) {
  if (!player) return null;

  return (
    <div className="h-full hover:scale-[1.02] transition-transform duration-200">
      <ElegantCard
        title="El Inquieto"
        icon={Briefcase}
        color="purple"
        info="Más Equipos Diferentes. El jugador que ha pasado por más manos distintas."
      >
        <div className="flex flex-col h-full justify-between">
          <div className="mt-4 text-center">
            <div className="text-sm text-purple-500 uppercase tracking-widest font-black mb-2">
              TROTAMUNDOS
            </div>

            <div className="text-2xl md:text-3xl font-black text-purple-500 truncate px-2 leading-tight">
              {player.player_name}
            </div>

            <div className="text-2xl md:text-3xl font-black text-white mt-2">
              {player.distinct_owners_count}{' '}
              <span className="text-lg md:text-xl font-bold text-zinc-500">equipos</span>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <div className="inline-flex items-center gap-2 bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm px-4 py-2 rounded-full">
              <Users size={16} className="text-purple-400" />
              <span className="text-sm text-zinc-300">
                Ha cambiado de dueño <strong>{player.distinct_owners_count} veces</strong>
              </span>
            </div>
          </div>
        </div>
      </ElegantCard>
    </div>
  );
}
