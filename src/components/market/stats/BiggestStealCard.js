'use client';

import { Search, ArrowRight, Trophy, XCircle } from 'lucide-react';
import Link from 'next/link';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';

export default function BiggestStealCard({ data }) {
  if (!data) return null;

  const formatEuro = (val) => {
    return val?.toLocaleString('es-ES', { maximumFractionDigits: 0 });
  };

  return (
    <div className="h-full hover:scale-[1.02] transition-transform duration-200">
      <ElegantCard
        title="Mayor Robo"
        icon={Search}
        color="cyan"
        info="El fichaje ganado por la mínima diferencia respecto a la segunda puja más alta."
      >
        <div className="flex flex-col justify-between h-full">
          <div className="mt-1">
            {/* Main Stat: Diff */}
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-2xl md:text-3xl font-black text-cyan-400 tracking-tight">
                +{formatEuro(data.price_diff)} €
              </span>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">
                Diferencia
              </span>
            </div>

            {/* Player Name */}
            <div className="mb-4">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-0.5">
                Jugador
              </span>
              <span className="text-sm font-black text-white truncate block">
                {data.player_name}
              </span>
            </div>

            {/* Comparison Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Left: Winner */}
              <div className="bg-cyan-900/10 border border-cyan-500/20 rounded-lg p-2">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Trophy size={10} className="text-cyan-400" />
                  <span className="text-[10px] text-cyan-400 uppercase font-black">Ganador</span>
                </div>
                <div className="text-xs font-bold text-white truncate mb-0.5">{data.winner}</div>
                <div className="text-[10px] text-zinc-400">{formatEuro(data.winning_price)} €</div>
              </div>

              {/* Right: Loser */}
              <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-2">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <XCircle size={10} className="text-zinc-500" />
                  <span className="text-[10px] text-zinc-500 uppercase font-black">2º Lugar</span>
                </div>
                <div className="text-xs font-bold text-zinc-300 truncate mb-0.5">
                  {data.second_bidder_name || 'Desconocido'}
                </div>
                <div className="text-[10px] text-zinc-500">
                  {formatEuro(data.second_highest_bid)} €
                </div>
              </div>
            </div>
          </div>

          <Link
            href={`/player/${data.player_id}`}
            className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center group"
          >
            <span className="text-xs text-cyan-400 font-semibold uppercase tracking-wide group-hover:text-cyan-300 transition-colors">
              Ver Jugador
            </span>
            <div className="w-6 h-6 rounded-full bg-cyan-500/10 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
              <ArrowRight
                size={12}
                className="text-cyan-400 group-hover:translate-x-0.5 transition-transform"
              />
            </div>
          </Link>
        </div>
      </ElegantCard>
    </div>
  );
}
