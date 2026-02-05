'use client';

import { ThumbsDown, Calculator } from 'lucide-react';
import Link from 'next/link';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';

import { getColorForUser } from '@/lib/constants/colors';

export default function WorstValueCard({ player }) {
  if (!player) return null;

  const userColor = getColorForUser(player.user_id || 0, player.user_name, player.user_color_index);

  const formatNumber = (val) => {
    return val.toLocaleString('es-ES', { maximumFractionDigits: 1 });
  };

  const formatEuro = (val) => {
    if (val >= 1000000) {
      return (val / 1000000).toFixed(1) + 'M';
    }
    return (val / 1000).toFixed(0) + 'k';
  };

  return (
    <div className="h-full hover:scale-[1.02] transition-transform duration-200">
      <ElegantCard
        title="El Flop"
        icon={ThumbsDown}
        color="red"
        info="Peor Rentabilidad. Puntos por millón más bajos entre jugadores caros (>2M). La gran decepción."
      >
        <div className="flex flex-col h-full justify-between">
          <div className="mt-2 text-center">
            <div className="text-sm text-red-500 uppercase tracking-widest font-black mb-2">
              LA DECEPCIÓN
            </div>

            <div className="text-2xl md:text-3xl font-black text-red-500 truncate px-2 leading-tight">
              {player.player_name}
            </div>

            <div className="text-2xl md:text-3xl font-black text-white mt-2">
              {formatNumber(player.points_per_million)}{' '}
              <span className="text-lg md:text-xl font-bold text-zinc-500">pts/M€</span>
            </div>

            <div className="flex justify-center mt-2 mb-2">
              <Link href={`/user/${player.user_id}`} className="group flex items-center">
                <span
                  className={`text-sm font-bold ${userColor.text} group-hover:brightness-110 transition-all`}
                >
                  {player.user_name}
                </span>
              </Link>
            </div>
          </div>

          <div className="mt-4 flex justify-center">
            <div className="inline-flex items-center gap-3 bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm p-2 pr-5 rounded-full">
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border-2 border-zinc-700 text-zinc-400">
                <Calculator size={18} />
              </div>
              <div className="text-left">
                <div className="flex justify-between gap-4">
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase font-bold leading-none mb-1">
                      Coste
                    </p>
                    <p className="text-sm font-bold text-white">
                      {formatEuro(player.purchase_price)} €
                    </p>
                  </div>
                  <div className="border-l border-zinc-700 pl-4">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold leading-none mb-1">
                      Puntos
                    </p>
                    <p className="text-sm font-bold text-white">{player.total_points}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ElegantCard>
    </div>
  );
}
