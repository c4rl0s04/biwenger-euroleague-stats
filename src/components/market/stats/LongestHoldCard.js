'use client';

import { Hourglass, Clock } from 'lucide-react';
import Link from 'next/link';
import MarketPodiumCard from './MarketPodiumCard';
import { getColorForUser } from '@/lib/constants/colors';
import { formatEuro } from '@/lib/utils/currency';

export default function LongestHoldCard({ data }) {
  if (!data || !Array.isArray(data) || data.length === 0) return null;

  const formatShortEuro = (val) => {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(0) + 'k';
    return val?.toLocaleString('es-ES');
  };

  const formatDays = (days) => {
    if (days >= 365) return `${(days / 365).toFixed(1)}a`;
    if (days >= 30) return `${(days / 30).toFixed(1)}m`;
    return `${days.toFixed(0)}d`;
  };

  return (
    <MarketPodiumCard
      data={data}
      title="El Hold"
      icon={Hourglass}
      color="teal"
      info="La inversión más paciente. Mayor tiempo de posesión con beneficio final."
      winnerLabel="EL HOLD"
      renderHeroValue={(item) => (
        <div className="flex flex-col items-center">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-600/20 to-cyan-600/20 px-4 py-2 rounded-xl border border-teal-500/30 mb-1">
            <Clock className="w-5 h-5 text-teal-400" />
            <span className="text-2xl font-black text-teal-400">{formatDays(item.days_held)}</span>
          </div>
          <div className="text-emerald-400 text-sm font-bold">+{formatShortEuro(item.profit)}€</div>
        </div>
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
        <div className="flex flex-col items-end">
          <span className="text-sm font-black text-teal-400">{formatDays(item.days_held)}</span>
          <span className="text-[9px] text-emerald-400 font-bold">
            +{formatShortEuro(item.profit)}€
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
        <span className="text-xs font-bold text-teal-400/80">{formatDays(item.days_held)}</span>
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
