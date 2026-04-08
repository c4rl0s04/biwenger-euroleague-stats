'use client';

import { Frown } from 'lucide-react';
import MarketPodiumCard from './MarketPodiumCard';
import { getColorForUser } from '@/lib/constants/colors';
import { TooltipHeader } from '@/components/ui/Tooltip';
import Link from 'next/link';

export default function TheVictimCard({ data }) {
  if (!data || !Array.isArray(data) || data.length === 0) return null;

  return (
    <MarketPodiumCard
      data={data}
      title="La Víctima"
      icon={Frown}
      color="pink"
      info={
        <>
          <TooltipHeader>La Víctima</TooltipHeader>
          <p>
            Identifica a los managers que más pujas han perdido. Son aquellos que se han quedado a
            las puertas de conseguir un fichaje porque otro manager pujó más.
          </p>
        </>
      }
      winnerLabel="MÁS PUJAS PERDIDAS"
      useTeamColors={false}
      renderHeroValue={(item) => (
        <div className="flex flex-col items-center">
          <span className="text-3xl font-black text-pink-500">{item.failed_bids_count}</span>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
            Pujas Fallidas
          </span>
        </div>
      )}
      renderHeroStats={(item) => (
        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">
          Donde otro manager ganó la subasta
        </p>
      )}
      renderHeroMeta={(item) => {
        const userColor = getColorForUser(item.id, item.name, item.color_index);
        return (
          <Link href={`/user/${item.id}`} className="group/user">
            <div
              className={`px-4 py-1.5 rounded-full text-xs font-black ${userColor.bg} ${userColor.text} bg-opacity-20 border border-current border-opacity-10 group-hover/user:bg-opacity-30 transition-all`}
            >
              {item.name}
            </div>
          </Link>
        );
      }}
      renderRunnerUpValue={(item) => (
        <div className="flex flex-col items-end">
          <span className="text-sm font-black text-pink-500">{item.failed_bids_count}</span>
          <span className="text-[9px] text-zinc-500 font-bold">fallos</span>
        </div>
      )}
      renderRunnerUpMeta={(item) => {
        const userColor = getColorForUser(item.id, item.name, item.color_index);
        return (
          <Link
            href={`/user/${item.id}`}
            className={`text-[10px] font-bold ${userColor.text} opacity-80 hover:opacity-100`}
          >
            {item.name}
          </Link>
        );
      }}
      renderListItemValue={(item) => (
        <span className="text-xs font-bold text-pink-500/80">{item.failed_bids_count} fallos</span>
      )}
      renderListItemMeta={(item) => {
        const userColor = getColorForUser(item.id, item.name, item.color_index);
        return (
          <Link
            href={`/user/${item.id}`}
            className={`text-[9px] font-black uppercase tracking-wider ${userColor.text} opacity-60 hover:opacity-100 ml-2`}
          >
            {item.name}
          </Link>
        );
      }}
    />
  );
}
