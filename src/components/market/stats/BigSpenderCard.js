'use client';

import { Gem, ShoppingBag, User } from 'lucide-react';
import Link from 'next/link';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import UserAvatar from '@/components/ui/UserAvatar';
import { getColorForUser } from '@/lib/constants/colors';

export default function BigSpenderCard({ spender }) {
  if (!spender) return null;

  const formatEuro = (val) => {
    return val.toLocaleString('es-ES', { maximumFractionDigits: 0 });
  };

  // Resolve User Color
  const userColor = getColorForUser(spender.id || 0, spender.name, spender.color_index);

  return (
    <div className="h-full hover:scale-[1.02] transition-transform duration-200">
      <ElegantCard title="El Jeque" icon={Gem} color="cyan">
        <div className="flex flex-col h-full justify-between">
          <div className="mt-2 text-center">
            <div className="text-sm text-cyan-500 uppercase tracking-widest font-black mb-2">
              MAYOR INVERSOR
            </div>

            <Link href={`/user/${spender.id || ''}`} className="block group">
              <div className="text-2xl md:text-3xl font-black text-cyan-500 group-hover:brightness-110 transition-colors truncate px-2 leading-tight">
                {spender.name || 'Desconocido'}
              </div>
            </Link>

            <div className="text-2xl md:text-3xl font-black text-white mt-2">
              {formatEuro(spender.total_spent)} €
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <div className="inline-flex items-center gap-3 bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm p-2 pr-5 rounded-full">
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border-2 border-zinc-700 text-zinc-400">
                <ShoppingBag size={18} />
              </div>
              <div className="text-left">
                <p className="text-[10px] text-zinc-500 uppercase font-bold leading-none mb-1">
                  Fichajes Galácticos
                </p>
                <p className="text-sm font-bold text-white">
                  {spender.purchases_count} operaciones
                </p>
              </div>
            </div>
          </div>
        </div>
      </ElegantCard>
    </div>
  );
}
