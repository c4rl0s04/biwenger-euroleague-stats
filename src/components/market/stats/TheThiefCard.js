'use client';

import { Swords } from 'lucide-react';
import MarketPodiumCard from './MarketPodiumCard';
import { getColorForUser } from '@/lib/constants/colors';
import { TooltipHeader } from '@/components/ui/Tooltip';
import Link from 'next/link';

export default function TheThiefCard({ data }) {
  if (!data || !Array.isArray(data) || data.length === 0) return null;

  return (
    <MarketPodiumCard
      data={data}
      title="El Ladrón"
      icon={Swords}
      color="red"
      info={
        <>
          <TooltipHeader>El Ladrón</TooltipHeader>
          <p>
            El usuario que ha ganado más fichajes habiendo otras pujas de rivales. Identifica a los
            managers que más &quot;roban&quot; jugadores en subastas competitivas.
          </p>
        </>
      }
      winnerLabel="MÁS ROBOS"
      useTeamColors={false}
      renderHeroValue={(item) => (
        <div className="flex flex-col items-center">
          <span className="text-3xl font-black text-red-500">{item.stolen_count}</span>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
            Fichajes Robados
          </span>
        </div>
      )}
      renderHeroStats={(item) => (
        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">
          Ganados con rivales pujando
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
          <span className="text-sm font-black text-red-500">{item.stolen_count}</span>
          <span className="text-[9px] text-zinc-500 font-bold">robos</span>
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
        <span className="text-xs font-bold text-red-500/80">{item.stolen_count} robos</span>
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
