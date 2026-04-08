'use client';

import { Crown } from 'lucide-react';
import Link from 'next/link';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import { getColorForUser } from '@/lib/constants/colors';
import { TooltipHeader } from '@/components/ui/Tooltip';

export default function BiggestDominanceCard({ data }) {
  if (!data || !data.leader_id || !data.trailer_id) return null;

  const leaderColors = getColorForUser(
    data.leader_id,
    data.leader_name,
    data.user1_id === data.leader_id ? data.user1_color_index : data.user2_color_index
  );
  const trailerColors = getColorForUser(
    data.trailer_id,
    data.trailer_name,
    data.user1_id === data.trailer_id ? data.user1_color_index : data.user2_color_index
  );
  const leaderWins = data.user1_id === data.leader_id ? data.wins1 : data.wins2;
  const trailerWins = data.user1_id === data.trailer_id ? data.wins1 : data.wins2;

  return (
    <div className="h-full hover:scale-[1.02] transition-transform duration-200">
      <ElegantCard
        title="Dominio Más Claro"
        icon={Crown}
        color="emerald"
        info={
          <>
            <TooltipHeader>Dominio Más Claro</TooltipHeader>
            <p>
              Identifica el enfrentamiento más desequilibrado entre dos managers. Muestra quién ha
              &quot;tomado la medida&quot; a quién en las subastas directas.
            </p>
          </>
        }
      >
        <div className="flex h-full flex-col justify-between gap-4 text-center">
          <div>
            <div className="text-xs text-emerald-500 uppercase tracking-widest font-black mb-2">
              MAYOR PIZARRA
            </div>
            <div className="flex items-center justify-center gap-2 text-sm font-black">
              <Link
                href={`/user/${data.leader_id}`}
                className={`${leaderColors.text} hover:brightness-110 truncate`}
              >
                {data.leader_name}
              </Link>
              <span className="text-zinc-500">sobre</span>
              <Link
                href={`/user/${data.trailer_id}`}
                className={`${trailerColors.text} hover:brightness-110 truncate`}
              >
                {data.trailer_name}
              </Link>
            </div>
          </div>

          <div className="text-3xl font-black text-emerald-400">
            {leaderWins} - {trailerWins}
          </div>

          <div className="rounded-xl border border-white/5 bg-white/5 p-3 text-xs">
            <div className="text-zinc-500 mb-1">Duelos totales</div>
            <div className="font-bold text-zinc-200">{data.duels}</div>
          </div>
        </div>
      </ElegantCard>
    </div>
  );
}
