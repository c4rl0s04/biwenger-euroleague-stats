'use client';

import { TrendingUp, User } from 'lucide-react';
import Link from 'next/link';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import UserAvatar from '@/components/ui/UserAvatar';
import { getColorForUser } from '@/lib/constants/colors';

export default function RecordTransferCard({ record }) {
  if (!record) return null;

  const formatEuro = (val) => {
    return val.toLocaleString('es-ES', { maximumFractionDigits: 0 });
  };

  // Resolve Buyer Color
  // We'll use buyer_color if available, otherwise fallback.
  const buyerColor = getColorForUser(record.buyer_id || 0, record.buyer_name, record.buyer_color);

  return (
    <div className="h-full hover:scale-[1.02] transition-transform duration-200">
      <ElegantCard title="Récord Histórico" icon={TrendingUp} color="rose">
        <div className="flex flex-col h-full justify-between">
          <div className="mt-2 text-center">
            <div className="text-sm text-rose-500 uppercase tracking-widest font-black mb-2">
              TRASPASO MÁS CARO
            </div>

            <Link href={`/player/${record.player_id}`} className="block group">
              <div className="text-2xl md:text-3xl font-black text-rose-500 group-hover:text-rose-400 transition-colors truncate px-2 leading-tight">
                {record.player_name || 'Desconocido'}
              </div>
            </Link>

            <div className="text-2xl md:text-3xl font-black text-white mt-2">
              {record.precio ? formatEuro(record.precio) : '0'} €
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <Link
              href={`/user/${record.buyer_id || ''}`}
              className="inline-flex items-center gap-3 bg-zinc-900/50 hover:bg-zinc-800/80 border border-zinc-800 backdrop-blur-sm p-2 pr-5 rounded-full transition-all group/user"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${buyerColor.border} overflow-hidden bg-zinc-800`}
              >
                {record.buyer_icon ? (
                  <UserAvatar src={record.buyer_icon} alt={record.buyer_name} size={40} />
                ) : (
                  <User size={18} className={buyerColor.text} />
                )}
              </div>
              <div className="text-left">
                <p className="text-[10px] text-zinc-500 uppercase font-bold leading-none mb-1">
                  Comprador
                </p>
                <p
                  className={`text-sm font-bold ${buyerColor.text} group-hover/user:brightness-110 transition-colors`}
                >
                  {record.buyer_name || record.comprador}
                </p>
              </div>
            </Link>
          </div>
        </div>
      </ElegantCard>
    </div>
  );
}
