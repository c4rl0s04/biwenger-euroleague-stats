'use client';

import { Rocket, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';

import { getColorForUser } from '@/lib/constants/colors';

export default function BestFlipCard({ flip }) {
  if (!flip) return null;

  const userColor = getColorForUser(flip.user_id || 0, flip.user_name, flip.user_color_index);

  const formatEuro = (val) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatShortEuro = (val) => {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(0) + 'k';
    return val;
  };

  return (
    <div className="h-full hover:scale-[1.02] transition-transform duration-200">
      <ElegantCard
        title="El Pelotazo"
        icon={Rocket}
        color="emerald"
        info="Mayor Beneficio en una Venta. La operación de compraventa más rentable (Venta - Compra)."
      >
        <div className="flex flex-col h-full justify-between">
          <div className="mt-2 text-center">
            <div className="text-sm text-emerald-500 uppercase tracking-widest font-black mb-2">
              OPERACIÓN MAESTRA
            </div>

            <div className="text-2xl md:text-3xl font-black text-emerald-500 truncate px-2 leading-tight">
              {flip.player_name}
            </div>

            <div className="text-2xl md:text-3xl font-black text-white mt-2">
              +{formatShortEuro(flip.profit)}{' '}
              <span className="text-lg md:text-xl font-bold text-zinc-500">€</span>
            </div>

            <div className="flex justify-center mt-2 mb-2">
              <Link href={`/user/${flip.user_id}`} className="group flex items-center">
                <span
                  className={`text-sm font-bold ${userColor.text} group-hover:brightness-110 transition-all`}
                >
                  {flip.user_name}
                </span>
              </Link>
            </div>
          </div>

          <div className="w-full px-4">
            <div className="flex justify-between items-center text-xs text-zinc-400 uppercase font-bold mb-1">
              <span>Compra</span>
              <span>Venta</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg">
              <div className="text-base font-bold text-white">
                {formatEuro(flip.purchase_price)}
              </div>
              <TrendingUp size={16} className="text-emerald-500 mx-2" />
              <div className="text-base font-bold text-emerald-400">
                {formatEuro(flip.sale_price)}
              </div>
            </div>
          </div>
        </div>
      </ElegantCard>
    </div>
  );
}
