'use client';

import { Telescope, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import { getColorForUser } from '@/lib/constants/colors';

export default function BestRevaluationCard({ data }) {
  if (!data) return null;

  const formatEuro = (val) => {
    return val.toLocaleString('es-ES', { maximumFractionDigits: 0 });
  };

  // Resolve User Color
  const userColor = getColorForUser(data.user_id || 0, data.user_name, data.user_color_index);

  return (
    <div className="h-full hover:scale-[1.02] transition-transform duration-200">
      <ElegantCard
        title="El Visionario"
        icon={Telescope}
        color="purple"
        info="Mayor incremento de valor de un jugador desde su fichaje hasta hoy. (Valor Actual - Precio Compra)"
      >
        <div className="flex flex-col h-full justify-between">
          <div className="mt-2 text-center">
            <div className="text-sm text-purple-500 uppercase tracking-widest font-black mb-2">
              MAYOR REVALORIZACIÓN
            </div>

            <Link href={`/player/${data.player_id}`} className="block group">
              <div className="text-2xl md:text-3xl font-black text-purple-400 group-hover:text-purple-300 transition-colors truncate px-2 leading-tight">
                {data.player_name}
              </div>
            </Link>

            <div className="text-2xl md:text-3xl font-black text-white mt-2">
              +{formatEuro(data.revaluation)} €
            </div>
          </div>

          <div className="flex justify-center mt-2 mb-2">
            <Link href={`/user/${data.user_id}`} className="group flex items-center">
              <span
                className={`text-sm font-bold ${userColor.text} group-hover:brightness-110 transition-all`}
              >
                {data.user_name}
              </span>
            </Link>
          </div>

          <div className="w-full px-4">
            <div className="flex justify-between items-center text-xs text-zinc-400 uppercase font-bold mb-1">
              <span>Compra</span>
              <span>Actual</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg">
              <div className="text-base font-bold text-white">
                {formatEuro(data.purchase_price)}
              </div>
              <TrendingUp size={16} className="text-purple-500 mx-2" />
              <div className="text-base font-bold text-purple-400">
                {formatEuro(data.current_price)}
              </div>
            </div>
          </div>
        </div>
      </ElegantCard>
    </div>
  );
}
