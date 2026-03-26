'use client';

import Image from 'next/image';
import Link from 'next/link';
import { User, TrendingUp, TrendingDown } from 'lucide-react';
import { getColorForUser } from '@/lib/constants/colors';
import { getScoreColor } from '@/lib/utils/format';

export default function PlayerRow({ player, sortConfig }) {
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPositionBadge = (pos) => {
    const colors = {
      Base: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      Alero: 'bg-green-500/10 text-green-500 border-green-500/20',
      Pivot: 'bg-red-500/10 text-red-500 border-red-500/20',
    };
    return colors[pos] || 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  };

  return (
    <tr className="group hover:bg-white/5 transition-all duration-300 border-b border-white/5 last:border-0 grow">
      <td className="px-6 py-3.5">
        <Link href={`/player/${player.id}`} className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-secondary/50 border border-border/50 shrink-0 flex items-center justify-center">
            {player.img && player.img !== '' ? (
              <Image
                src={player.img}
                alt={player.name}
                fill
                className="object-cover object-top"
                unoptimized
              />
            ) : (
              <User size={20} className="text-muted-foreground opacity-30" />
            )}
          </div>
          <div className="flex flex-col">
            <span
              className={`font-bold text-sm tracking-tight group-hover:text-primary transition-colors ${
                player.owner_id
                  ? getColorForUser(player.owner_id, player.owner_name, player.owner_color_index)
                      .groupHover
                  : ''
              }`}
            >
              {player.name}
            </span>
            <span
              className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border w-fit mt-1 ${getPositionBadge(player.position)}`}
            >
              {player.position}
            </span>
          </div>
        </Link>
      </td>

      <td className="px-6 py-3.5">
        <div className="flex items-center gap-2">
          {player.team_img && player.team_img !== '' && (
            <div className="relative w-4 h-4 opacity-80 shrink-0">
              <Image src={player.team_img} alt="team" fill className="object-contain" unoptimized />
            </div>
          )}
          <span className="text-xs text-muted-foreground font-medium">
            {player.team_short_name || player.team_name}
          </span>
        </div>
      </td>

      <td className="px-6 py-3.5">
        {player.owner_id ? (
          <div className="flex items-center gap-2">
            {player.owner_icon && player.owner_icon !== '' ? (
              <div className="relative w-4 h-4 rounded-full border border-white/20 overflow-hidden shrink-0">
                <Image
                  src={player.owner_icon}
                  alt={player.owner_name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <User size={10} className="text-primary" />
              </div>
            )}
            <span className="text-xs font-bold text-foreground/80">{player.owner_name}</span>
          </div>
        ) : (
          <span className="text-[10px] font-black uppercase text-muted-foreground italic tracking-widest">
            LIBRE
          </span>
        )}
      </td>

      <td className="px-6 py-3.5 tabular-nums">
        <div className="flex flex-col">
          <span className="font-bold text-sm text-white">{formatMoney(player.price)}</span>
          <div className="flex items-center gap-1 text-[10px]">
            {player.price_increment > 0 && <TrendingUp size={10} className="text-green-500" />}
            {player.price_increment < 0 && <TrendingDown size={10} className="text-red-500" />}
            {player.price_increment !== 0 && (
              <span className={player.price_increment > 0 ? 'text-green-500' : 'text-red-500'}>
                {formatMoney(Math.abs(player.price_increment))}
              </span>
            )}
          </div>
        </div>
      </td>

      <td className="px-6 py-3.5 text-center font-black text-primary text-base tabular-nums">
        {player.total_points || 0}
      </td>

      <td className="px-6 py-3.5 text-center font-bold tabular-nums">
        <span className={player.average >= 5 ? 'text-green-400' : 'text-yellow-400'}>
          {player.average || '0.0'}
        </span>
      </td>

      <td className="px-6 py-3.5 text-center font-bold text-emerald-400 tabular-nums">
        {player.best_score || 0}
      </td>

      <td className="px-6 py-3.5 text-center font-bold text-red-400 tabular-nums">
        {player.worst_score || 0}
      </td>
    </tr>
  );
}
