'use client';

import { Crown } from 'lucide-react';
import Link from 'next/link';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import { TooltipHeader } from '@/components/ui/Tooltip';
import { getColorForUser } from '@/lib/constants/colors';

export default function BiggestDominanceCard({ data }) {
  if (!data || !data.leader_id || !data.trailer_id) return null;

  // Determine colors based on leader/trailer mapping
  const leaderColorIndex =
    data.leader_id === data.user1_id ? data.user1_color_index : data.user2_color_index;
  const trailerColorIndex =
    data.trailer_id === data.user1_id ? data.user1_color_index : data.user2_color_index;

  const leaderColor = getColorForUser(data.leader_id, data.leader_name, leaderColorIndex);
  const trailerColor = getColorForUser(data.trailer_id, data.trailer_name, trailerColorIndex);

  const leaderWins = data.leader_id === data.user1_id ? data.wins1 : data.wins2;
  const trailerWins = data.leader_id === data.user1_id ? data.wins2 : data.wins1;

  return (
    <div className="h-full">
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
        <div className="flex flex-col items-center gap-6 pt-2">
          {/* Dominance Headline */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-3">
              <span
                className={`text-5xl font-black tabular-nums transition-colors ${leaderColor.text}`}
              >
                {leaderWins}
              </span>
              <span className="text-2xl font-black text-zinc-600">-</span>
              <span className="text-3xl font-black text-zinc-500 tabular-nums">{trailerWins}</span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 mt-1">
              Duelos Ganados
            </span>
          </div>

          {/* Leader vs Trailer */}
          <div className="w-full flex flex-col items-center gap-4 px-4 py-3 rounded-2xl bg-white/[0.02] border border-white/5">
            <div className="flex flex-col items-center gap-1 w-full translate-y-[-2px]">
              <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400 mb-1">
                Dominador
              </span>
              <Link
                href={`/user/${data.leader_id}`}
                className={`text-lg font-black uppercase tracking-wider truncate max-w-full text-center transition-all hover:scale-105 ${leaderColor.text}`}
              >
                {data.leader_name}
              </Link>
            </div>

            <div className="flex items-center gap-2 w-full justify-center">
              <div className="h-px flex-1 bg-linear-to-r from-transparent via-zinc-800 to-transparent" />
              <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest px-2">
                SOBRE
              </span>
              <div className="h-px flex-1 bg-linear-to-r from-zinc-800 via-zinc-800 to-transparent rotate-180" />
            </div>

            <div className="flex flex-col items-center gap-1 w-full">
              <Link
                href={`/user/${data.trailer_id}`}
                className={`text-sm font-bold uppercase tracking-widest truncate max-w-full text-center transition-all hover:scale-105 text-zinc-400 hover:text-white`}
              >
                {data.trailer_name}
              </Link>
              <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                Víctima recurrente
              </span>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="w-full border-t border-white/5 pt-4 flex justify-between px-2">
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-sm font-black text-zinc-200 tabular-nums">{data.duels}</span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 text-center">
                Duelos Totales
              </span>
            </div>

            <div className="flex flex-col items-center gap-0.5">
              <span className="text-sm font-black text-emerald-400 tabular-nums">
                {Math.round((leaderWins / data.duels) * 100)}%
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 text-center">
                Win Rate
              </span>
            </div>

            <div className="flex flex-col items-center gap-0.5">
              <span className="text-sm font-black text-zinc-200 tabular-nums">
                {Math.abs(data.wins1 - data.wins2)}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 text-center">
                Diferencia
              </span>
            </div>
          </div>
        </div>
      </ElegantCard>
    </div>
  );
}
