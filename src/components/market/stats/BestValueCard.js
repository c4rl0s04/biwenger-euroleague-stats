'use client';

import { Tag } from 'lucide-react';
import Link from 'next/link';
import MarketPodiumCard from './MarketPodiumCard';
import { getColorForUser } from '@/lib/constants/colors';
import { formatEuro } from '@/lib/utils/currency';
import { TooltipHeader } from '@/components/ui/Tooltip';

export default function BestValueCard({ player }) {
  if (!player || !Array.isArray(player) || player.length === 0) return null;

  return (
    <MarketPodiumCard
      data={player}
      title="El Chollo"
      icon={Tag}
      color="amber"
      info={
        <>
          <TooltipHeader>El Chollo</TooltipHeader>
          <p>
            Muestra los jugadores con mejor relación puntos/precio (Puntos por cada millón
            invertido). Identifica a los jugadores más eficientes que han aportado un gran
            rendimiento por un coste bajo.
          </p>
        </>
      }
      winnerLabel="EL CHOLLO"
      renderHeroValue={(item) => (
        <div className="flex flex-col items-center">
          <span className="text-4xl font-black text-amber-400">
            {item.points_per_million?.toFixed(1)}
          </span>
          <span className="text-[10px] uppercase font-black tracking-widest text-zinc-500 -mt-1">
            PTS / MILLÓN €
          </span>
        </div>
      )}
      renderHeroStats={(item) => (
        <div className="flex justify-center gap-6 text-[10px] mt-1">
          <div className="flex flex-col items-center">
            <span className="text-zinc-500 font-bold uppercase tracking-wider">Puntos</span>
            <span className="text-zinc-300 font-mono">{item.total_points}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-zinc-500 font-bold uppercase tracking-wider">Compra</span>
            <span className="text-zinc-300 font-mono">{formatEuro(item.purchase_price)}€</span>
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
        <div className="flex flex-col items-end">
          <span className="text-lg font-black text-amber-400">
            {item.points_per_million?.toFixed(1)}
          </span>
          <span className="text-[8px] text-zinc-500 font-bold -mt-1 uppercase tracking-tighter">
            pts/M
          </span>
        </div>
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
        <span className="text-xs font-bold text-amber-400/80">
          {item.points_per_million?.toFixed(1)} <span className="text-[9px] opacity-60">pts/M</span>
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
