'use client';

import { Tag, Calculator } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import BestValueDetailModal from './BestValueDetailModal';

export default function BestValueCard({ player }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!player) return null;

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
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className="h-full cursor-pointer hover:scale-[1.02] transition-transform duration-200"
      >
        <ElegantCard
          title="El Chollo"
          icon={Tag}
          color="amber"
          info="Rentabilidad. Puntos conseguidos por el jugador MIENTRAS PERTENECÍA al usuario, dividido por el precio de compra (Puntos / Millón €). Haz clic para ver detalles."
        >
          <div className="flex flex-col h-full justify-between pointer-events-none">
            {' '}
            {/* Disable pointer events inside to treat card as button */}
            <div className="mt-2 text-center pointer-events-auto">
              {' '}
              {/* Re-enable for links if needed, but here we cover whole card */}
              <div className="text-sm text-amber-500 uppercase tracking-widest font-black mb-2">
                CALIDAD / PRECIO
              </div>
              <div className="text-2xl md:text-3xl font-black text-amber-500 group-hover:text-amber-400 transition-colors truncate px-2 leading-tight">
                {player.player_name}
              </div>
              <div className="text-2xl md:text-3xl font-black text-white mt-2">
                {player.points_per_million.toFixed(1)}{' '}
                <span className="text-lg md:text-xl font-bold text-zinc-500">pts/M</span>
              </div>
            </div>
            <div className="mt-6 flex justify-center">
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

      <BestValueDetailModal
        transferId={player.transfer_id}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
