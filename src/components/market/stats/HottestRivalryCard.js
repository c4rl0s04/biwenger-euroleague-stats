'use client';

import { Flame } from 'lucide-react';
import Link from 'next/link';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import { getColorForUser } from '@/lib/constants/colors';
import { TooltipHeader } from '@/components/ui/Tooltip';

function formatEuro(value) {
  if (!value) return '0';
  const abs = Math.abs(value);
  if (abs >= 1000000) return (abs / 1000000).toFixed(1) + 'M';
  if (abs >= 1000) return (abs / 1000).toFixed(0) + 'k';
  return Math.round(abs).toLocaleString('es-ES');
}

export default function HottestRivalryCard({ data }) {
  if (!data) return null;

  const user1Colors = getColorForUser(data.user1_id, data.user1_name, data.user1_color_index);
  const user2Colors = getColorForUser(data.user2_id, data.user2_name, data.user2_color_index);

  return (
    <div className="h-full hover:scale-[1.02] transition-transform duration-200">
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
        <div className="flex h-full flex-col justify-between gap-4 text-center">
          <div>
            <div className="text-xs text-orange-500 uppercase tracking-widest font-black mb-2">
              MÁS DUELOS DIRECTOS
            </div>
            <div className="flex items-center justify-center gap-3 text-sm font-black">
              <Link
                href={`/user/${data.user1_id}`}
                className={`${user1Colors.text} hover:brightness-110 truncate`}
              >
                {data.user1_name}
              </Link>
              <span className="text-zinc-500">vs</span>
              <Link
                href={`/user/${data.user2_id}`}
                className={`${user2Colors.text} hover:brightness-110 truncate`}
              >
                {data.user2_name}
              </Link>
            </div>
          </div>

          <div className="text-3xl font-black text-white">{data.duels}</div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border border-white/5 bg-white/5 p-3">
              <div className="text-zinc-500 mb-1">Marcador</div>
              <div className="font-bold text-zinc-200">
                {data.wins1} - {data.wins2}
              </div>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/5 p-3">
              <div className="text-zinc-500 mb-1">Margen medio</div>
              <div className="font-bold text-orange-400">+{formatEuro(data.avg_margin)}€</div>
            </div>
          </div>
        </div>
      </ElegantCard>
    </div>
  );
}
