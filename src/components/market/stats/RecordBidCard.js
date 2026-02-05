'use client';

import { Gavel, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';

export default function RecordBidCard({ record }) {
  if (!record) return null;

  return (
    <div className="h-full hover:scale-[1.02] transition-transform duration-200">
      <ElegantCard title="Récord Pujas" icon={Gavel} color="purple">
        <div className="flex flex-col justify-between h-full">
          <div className="mt-1">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-2xl md:text-3xl font-black text-purple-400 tracking-tight">
                {record.bid_count}
              </span>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">
                Pujas
              </span>
            </div>

            <div className="space-y-1 mt-2">
              <div className="flex justify-between items-end border-b border-white/5 pb-1.5 border-dashed">
                <span className="text-[10px] md:text-xs text-zinc-500 uppercase font-bold">
                  Jugador
                </span>
                <span className="text-xs md:text-sm font-bold text-white truncate max-w-[120px] text-right">
                  {record.player_name}
                </span>
              </div>
              <div className="flex justify-between items-end pt-0.5">
                <span className="text-[10px] md:text-xs text-zinc-500 uppercase font-bold">
                  Ganador
                </span>
                <span className="text-xs md:text-sm font-bold text-purple-300 truncate max-w-[120px] text-right">
                  {record.comprador}
                </span>
              </div>
              <div className="flex justify-between items-end pt-0.5 border-t border-white/5 mt-1 border-dashed">
                <span className="text-[10px] md:text-xs text-zinc-500 uppercase font-bold">
                  Precio
                </span>
                <span className="text-xs md:text-sm font-bold text-white text-right">
                  {record.precio?.toLocaleString('es-ES', { maximumFractionDigits: 0 })} €
                </span>
              </div>
            </div>
          </div>

          <Link
            href={`/player/${record.player_id}`}
            className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center group"
          >
            <span className="text-xs text-purple-400 font-semibold uppercase tracking-wide group-hover:text-purple-300 transition-colors">
              Ver Subasta
            </span>
            <div className="w-6 h-6 rounded-full bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
              <ArrowRight
                size={12}
                className="text-purple-400 group-hover:translate-x-0.5 transition-transform"
              />
            </div>
          </Link>
        </div>
      </ElegantCard>
    </div>
  );
}
