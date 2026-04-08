'use client';

import { Rocket } from 'lucide-react';
import Link from 'next/link';
import MarketPodiumCard from './MarketPodiumCard';
import { getColorForUser } from '@/lib/constants/colors';
import { formatEuro } from '@/lib/utils/currency';
import { TooltipHeader } from '@/components/ui/Tooltip';

export default function BestFlipCard({ flip }) {
  if (!flip || !Array.isArray(flip) || flip.length === 0) return null;

  const formatShortEuro = (val) => {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(0) + 'k';
    return val?.toLocaleString('es-ES');
  };

  return (
    <MarketPodiumCard
      data={flip}
      title="El Pelotazo"
      icon={Rocket}
      color="emerald"
      info={
        <>
          <TooltipHeader>El Pelotazo</TooltipHeader>
          <p>
            Muestra las operaciones de compraventa que han generado el mayor beneficio neto absoluto
            (Precio de Venta - Precio de Compra). Es el ranking de los mejores flips de la temporada
            en términos de dinero real.
          </p>
        </>
      }
      winnerLabel="EL PELOTAZO"
      renderHeroValue={(item) => (
        <span className="text-3xl font-black text-emerald-400">
          +{formatShortEuro(item.profit)}€
        </span>
      )}
      renderHeroStats={(item) => (
        <div className="flex justify-center gap-6 text-[10px] mt-1">
          <div className="flex flex-col items-center">
            <span className="text-zinc-500 font-bold uppercase tracking-wider">Compra</span>
            <span className="text-zinc-300 font-mono">{formatShortEuro(item.purchase_price)}€</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-zinc-500 font-bold uppercase tracking-wider">Venta</span>
            <span className="text-zinc-300 font-mono">{formatShortEuro(item.sale_price)}€</span>
          </div>
        </div>
      )}
      renderHeroMeta={(item) => {
        const userColor = getColorForUser(item.user_id, item.user_name, item.user_color_index);
        return (
          <Link href={`/user/${item.user_id}`} className="group/user">
            <div
              className={`px-4 py-1.5 rounded-full text-xs font-black ${userColor.bg} ${userColor.text} bg-opacity-20 border border-current border-opacity-10 group-hover/user:bg-opacity-30 transition-all`}
            >
              {item.user_name}
            </div>
          </Link>
        );
      }}
      renderRunnerUpValue={(item) => (
        <span className="text-sm font-black text-emerald-400">
          +{formatShortEuro(item.profit)}€
        </span>
      )}
      renderRunnerUpMeta={(item) => {
        const userColor = getColorForUser(item.user_id, item.user_name, item.user_color_index);
        return (
          <Link
            href={`/user/${item.user_id}`}
            className={`text-[10px] font-bold ${userColor.text} opacity-80 hover:opacity-100`}
          >
            {item.user_name}
          </Link>
        );
      }}
      renderListItemValue={(item) => (
        <span className="text-xs font-bold text-emerald-400/80">
          +{formatShortEuro(item.profit)}€
        </span>
      )}
      renderListItemMeta={(item) => {
        const userColor = getColorForUser(item.user_id, item.user_name, item.user_color_index);
        return (
          <Link
            href={`/user/${item.user_id}`}
            className={`text-[9px] font-black uppercase tracking-wider ${userColor.text} opacity-60 hover:opacity-100 ml-2`}
          >
            {item.user_name}
          </Link>
        );
      }}
    />
  );
}
