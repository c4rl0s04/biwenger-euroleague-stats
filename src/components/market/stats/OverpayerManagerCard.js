'use client';

import { Coins } from 'lucide-react';
import MarketPodiumCard from './MarketPodiumCard';
import { getColorForUser } from '@/lib/constants/colors';
import { TooltipHeader } from '@/components/ui/Tooltip';
import { formatEuro } from '@/lib/utils/currency';
import Link from 'next/link';

export default function OverpayerManagerCard({ data }) {
  if (!data || !Array.isArray(data) || data.length === 0) return null;

  return (
    <MarketPodiumCard
      data={data}
      title="El Sobrepagador"
      icon={Coins}
      color="amber"
      info={
        <>
          <TooltipHeader>El Sobrepagador</TooltipHeader>
          <p>
            El manager que más dinero extra ha puesto para ganar subastas disputadas. Se calcula
            sumando la diferencia entre su puja ganadora y la segunda mejor puja en cada fichaje.
          </p>
        </>
      }
      winnerLabel="MÁS SOBREPAGO"
      useTeamColors={false}
      renderHeroValue={(item) => (
        <div className="flex flex-col items-center">
          <span className="text-3xl font-black text-amber-400">
            +{formatEuro(item.total_overpay)}€
          </span>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
            Dinero Extra
          </span>
        </div>
      )}
      renderHeroStats={(item) => (
        <div className="flex justify-center gap-4 text-[10px] mt-1">
          <div className="flex flex-col items-center">
            <span className="text-zinc-500 font-bold uppercase tracking-wider">Victorias</span>
            <span className="text-zinc-300">{item.contested_wins}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-zinc-500 font-bold uppercase tracking-wider">Media</span>
            <span className="text-zinc-300">+{formatEuro(item.avg_overpay)}€</span>
          </div>
        </div>
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
          <span className="text-sm font-black text-amber-400">
            +{formatEuro(item.total_overpay)}€
          </span>
          <span className="text-[9px] text-zinc-500 font-bold">
            {item.contested_wins} victorias
          </span>
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
        <span className="text-xs font-bold text-amber-400/80">
          +{formatEuro(item.total_overpay)}€
        </span>
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
