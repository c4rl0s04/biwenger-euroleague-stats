'use client';

import { Briefcase } from 'lucide-react';
import Link from 'next/link';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import { getColorForUser } from '@/lib/constants/colors';

export default function BestSellerCard({ seller }) {
  if (!seller) return null;

  const formatEuro = (val) => {
    return val.toLocaleString('es-ES', { maximumFractionDigits: 0 });
  };

  // Resolve User Color
  const userColor = getColorForUser(seller.id || 0, seller.name, seller.color_index);

  return (
    <div className="h-full hover:scale-[1.02] transition-transform duration-200">
      <ElegantCard
        title="El Negociador"
        icon={Briefcase}
        color="emerald"
        info="Beneficio real obtenido. Suma de (Precio Venta - Precio Compra) de todos los jugadores que has comprado y vendido."
      >
        <div className="flex flex-col h-full justify-between">
          <div className="mt-2 text-center">
            <div className="text-sm text-emerald-500 uppercase tracking-widest font-black mb-2">
              MAYOR BENEFICIO
            </div>

            {/* Note: We rely on name to link if ID is missing. Ideally seller has ID */}
            {/* Note: We rely on name to link if ID is missing. Ideally seller has ID */}
            <div className="block">
              <Link href={`/user/${seller.id || ''}`} className="group">
                <div className="text-2xl md:text-3xl font-black text-emerald-500 group-hover:text-emerald-400 transition-colors truncate px-2 leading-tight">
                  {seller.name || 'Desconocido'}
                </div>
              </Link>
            </div>

            <div className="text-2xl md:text-3xl font-black text-white mt-2">
              +{formatEuro(seller.net_profit)} €
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <div className="inline-flex items-center bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm py-2 px-6 rounded-full">
              <div className="text-left w-full">
                <div className="flex justify-between gap-4">
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase font-bold leading-none mb-1">
                      Compras
                    </p>
                    <p className="text-sm font-bold text-white whitespace-nowrap">
                      {formatEuro(seller.total_sales - seller.net_profit)} €
                    </p>
                  </div>
                  <div className="border-l border-zinc-700 pl-4">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold leading-none mb-1">
                      Ventas
                    </p>
                    <p className="text-sm font-bold text-white whitespace-nowrap">
                      {formatEuro(seller.total_sales)} €
                    </p>
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
