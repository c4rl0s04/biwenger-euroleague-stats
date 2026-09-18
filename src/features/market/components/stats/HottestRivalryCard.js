'use client';

import { Flame } from 'lucide-react';
import Link from 'next/link';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import { TooltipHeader } from '@/components/ui/Tooltip';
import { getColorForUser } from '@/lib/constants/colors';
import { formatEuro } from '@/lib/utils/currency';

export default function HottestRivalryCard({ data }) {
  if (!data) return null;

  const user1Color = getColorForUser(data.user1_id, data.user1_name, data.user1_color_index);
  const user2Color = getColorForUser(data.user2_id, data.user2_name, data.user2_color_index);

  const scoreDiff = Math.abs(data.wins1 - data.wins2);
  const user1Leading = data.wins1 > data.wins2;
  const user2Leading = data.wins2 > data.wins1;

  return (
    <div className="h-full">
      <ElegantCard
        title="Rivalidad Más Caliente"
        icon={Flame}
        color="orange"
        info={
          <>
            <TooltipHeader>Rivalidad Más Caliente</TooltipHeader>
            <p>
              La pareja de managers que más veces se ha enfrentado cara a cara en una subasta.
              Indica dónde saltan chispas cada vez que sale un jugador al mercado.
            </p>
          </>
        }
      >
        <div className="flex flex-col items-center gap-6 pt-2">
          {/* Main stat */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-5xl font-black text-orange-400 tabular-nums">{data.duels}</span>
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">
              Duelos Directos
            </span>
          </div>

          {/* Manager vs Manager */}
          <div className="w-full flex items-center justify-between gap-3 px-2">
            {/* User 1 */}
            <div className="flex-1 flex flex-col items-center gap-1 min-w-0">
              <Link
                href={`/user/${data.user1_id}`}
                className={`text-sm font-black uppercase tracking-wider truncate max-w-full text-center transition-all hover:scale-105 ${user1Color.text}`}
              >
                {data.user1_name}
              </Link>
              <span
                className={`text-2xl font-black tabular-nums ${user1Leading ? 'text-white' : 'text-zinc-500'}`}
              >
                {data.wins1}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                victorias
              </span>
            </div>

            {/* VS divider */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              <span className="text-[11px] font-black uppercase tracking-widest text-zinc-600 px-2">
                VS
              </span>
              {scoreDiff > 0 && (
                <span className="text-[9px] font-bold text-zinc-700 uppercase tracking-wider">
                  +{scoreDiff}
                </span>
              )}
            </div>

            {/* User 2 */}
            <div className="flex-1 flex flex-col items-center gap-1 min-w-0">
              <Link
                href={`/user/${data.user2_id}`}
                className={`text-sm font-black uppercase tracking-wider truncate max-w-full text-center transition-all hover:scale-105 ${user2Color.text}`}
              >
                {data.user2_name}
              </Link>
              <span
                className={`text-2xl font-black tabular-nums ${user2Leading ? 'text-white' : 'text-zinc-500'}`}
              >
                {data.wins2}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                victorias
              </span>
            </div>
          </div>

          {/* Secondary stat */}
          <div className="w-full border-t border-white/5 pt-4 flex justify-center">
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-lg font-black text-zinc-200 tabular-nums">
                +{formatEuro(data.avg_margin)}€
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                Margen Medio
              </span>
            </div>
          </div>
        </div>
      </ElegantCard>
    </div>
  );
}
