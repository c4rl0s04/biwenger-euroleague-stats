'use client';

import { Flame, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';

export default function TopTransferredCard({ player }) {
  if (!player) return null;

  const formatEuro = (val) => {
    return val.toLocaleString('es-ES', { maximumFractionDigits: 0 });
  };

  return (
    <div className="h-full hover:scale-[1.02] transition-transform duration-200">
      <ElegantCard title="El más fichado" icon={Flame} color="orange">
        <div className="flex flex-col h-full justify-between">
          <div className="mt-2 text-center">
            <div className="text-sm text-orange-500 uppercase tracking-widest font-black mb-2">
              JUGADOR DE MODA
            </div>

            <Link href={`/player/${player.player_id}`} className="block group">
              <div className="text-2xl md:text-3xl font-black text-orange-500 group-hover:text-orange-400 transition-colors truncate px-2 leading-tight">
                {player.name}
              </div>
            </Link>

            <div className="text-2xl md:text-3xl font-black text-white mt-2">
              {player.transfer_count}{' '}
              <span className="text-lg md:text-xl font-bold text-zinc-500">fichajes</span>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <Link
              href={`/player/${player.player_id}`}
              className="inline-flex items-center gap-3 bg-zinc-900/50 hover:bg-zinc-800/80 border border-zinc-800 backdrop-blur-sm p-2 pr-5 pl-4 rounded-full transition-all group/link"
            >
              <div className="text-left">
                <p className="text-[10px] text-zinc-500 uppercase font-bold leading-none mb-1">
                  Precio Medio
                </p>
                <p className="text-sm font-bold text-white group-hover/link:text-orange-300 transition-colors">
                  {formatEuro(player.avg_price)} €
                </p>
              </div>
              <ArrowRight
                size={16}
                className="text-zinc-600 group-hover/link:text-orange-400 group-hover/link:translate-x-1 transition-all"
              />
            </Link>
          </div>
        </div>
      </ElegantCard>
    </div>
  );
}
