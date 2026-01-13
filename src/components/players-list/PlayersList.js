'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  User,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { getColorForUser } from '@/lib/constants/colors';
import { getScoreColor } from '@/lib/utils/format';

const SortIcon = ({ column, sortConfig }) => {
  if (sortConfig.key !== column) return <ArrowUpDown size={14} className="opacity-30" />;
  return sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
};

export default function PlayersList({ players, sortConfig, onSort }) {
  // Helper: Format currency
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
    <div className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-secondary/30">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground w-12">#</th>
              <th
                className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                onClick={() => onSort('name')}
              >
                <div className="flex items-center gap-1">
                  Jugador <SortIcon column="name" sortConfig={sortConfig} />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                onClick={() => onSort('team_name')}
              >
                <div className="flex items-center gap-1">
                  Equipo <SortIcon column="team_name" sortConfig={sortConfig} />
                </div>
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Pos</th>
              <th
                className="px-4 py-3 text-right font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                onClick={() => onSort('price')}
              >
                <div className="flex items-center justify-end gap-1">
                  Valor <SortIcon column="price" sortConfig={sortConfig} />
                </div>
              </th>
              <th
                className="px-4 py-3 text-center font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                onClick={() => onSort('total_points')}
              >
                <div className="flex items-center justify-center gap-1">
                  Pts <SortIcon column="total_points" sortConfig={sortConfig} />
                </div>
              </th>
              <th
                className="px-4 py-3 text-center font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                onClick={() => onSort('average')}
              >
                <div className="flex items-center justify-center gap-1">
                  Med <SortIcon column="average" sortConfig={sortConfig} />
                </div>
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Forma</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Manager</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {players.map((player, index) => (
              <tr key={player.id} className="group hover:bg-secondary/20 transition-colors">
                <td className="px-4 py-3 text-muted-foreground text-xs">{index + 1}</td>
                <td className="px-4 py-3">
                  <Link href={`/player/${player.id}`} className="flex items-center gap-3">
                    <div className="relative w-8 h-8 rounded-full overflow-hidden bg-secondary border border-border">
                      <Image
                        src={player.img}
                        alt={player.name}
                        fill
                        className="object-cover object-top"
                        unoptimized
                        sizes="32px"
                      />
                    </div>
                    <span
                      className={`font-medium group-hover:text-primary transition-colors ${
                        player.owner_id
                          ? getColorForUser(
                              player.owner_id,
                              player.owner_name,
                              player.owner_color_index
                            ).groupHover
                          : ''
                      }`}
                    >
                      {player.name}
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {player.team_img && (
                      <div className="relative w-5 h-5 opacity-80">
                        <Image
                          src={player.team_img}
                          alt={player.team_name}
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    )}
                    <span className="text-muted-foreground">
                      {player.team_short_name || player.team_name}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getPositionBadge(player.position)}`}
                  >
                    {player.position?.substring(0, 3)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  <div className="flex flex-col items-end">
                    <span>{formatMoney(player.price)}</span>
                    <div className="flex items-center gap-0.5 text-[10px]">
                      {player.price_increment > 0 && (
                        <TrendingUp size={10} className="text-green-500" />
                      )}
                      {player.price_increment < 0 && (
                        <TrendingDown size={10} className="text-red-500" />
                      )}
                      {player.price_increment !== 0 && (
                        <span
                          className={player.price_increment > 0 ? 'text-green-500' : 'text-red-500'}
                        >
                          {formatMoney(Math.abs(player.price_increment))}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-center font-bold text-primary tabular-nums">
                  {player.total_points}
                </td>
                <td className="px-4 py-3 text-center font-medium tabular-nums">
                  <span
                    className={
                      player.average >= 5
                        ? 'text-green-400 font-bold'
                        : player.average >= 3
                          ? 'text-yellow-400'
                          : 'text-muted-foreground'
                    }
                  >
                    {player.average}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-0.5">
                    {player.recent_scores
                      ?.split(',')
                      .slice(0, 5)
                      .map((score, i) => (
                        <span
                          key={i}
                          className={`text-[9px] w-5 h-5 flex items-center justify-center rounded border ${getScoreColor(score)}`}
                        >
                          {score}
                        </span>
                      ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {player.owner_id ? (
                    <div className="flex items-center gap-2">
                      {player.owner_icon ? (
                        <div className="relative w-5 h-5 rounded-full overflow-hidden border border-border/50">
                          <Image
                            src={player.owner_icon}
                            alt={player.owner_name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                          <User size={10} className="text-primary" />
                        </div>
                      )}
                      <span className="text-xs text-foreground/80 truncate max-w-[80px]">
                        {player.owner_name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground/50 italic">Libre</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
