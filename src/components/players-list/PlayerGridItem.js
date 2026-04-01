'use client';

import Link from 'next/link';
import Image from 'next/image';
import { User, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getColorForUser } from '@/lib/constants/colors';
import { getScoreColor } from '@/lib/utils/format';

export default function PlayerGridItem({ player, sortConfig }) {
  // Helper: Format currency
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Helper: Get badge color based on position
  const getPositionColor = (pos) => {
    switch (pos) {
      case 'Base':
        return 'bg-blue-500/25 text-blue-500 border-blue-500/30';
      case 'Alero':
        return 'bg-green-500/25 text-green-500 border-green-500/30';
      case 'Pivot':
        return 'bg-red-500/25 text-red-500 border-red-500/30';
      default:
        return 'bg-muted/25 text-muted-foreground border-muted/30';
    }
  };

  return (
    <Link
      href={`/player/${player.id}`}
      className="group relative block bg-card/40 backdrop-blur-sm rounded-xl border border-border/50 overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:scale-[1.02] h-80"
    >
      {/* Background Gradient */}
      <div
        className={`absolute inset-0 transition-opacity bg-gradient-to-br ${
          player.owner_id
            ? getColorForUser(player.owner_id, player.owner_name, player.owner_color_index).bg
            : 'from-secondary/30 to-secondary/10'
        }`}
      />

      {/* Team Logo Watermark */}
      {player.team_img && player.team_img !== '' && (
        <div className="absolute -right-8 -top-8 w-40 h-40 opacity-5 group-hover:opacity-10 transition-opacity rotate-12 pointer-events-none">
          <Image
            src={player.team_img}
            alt={player.team_name}
            fill
            className="object-contain grayscale"
            unoptimized
          />
        </div>
      )}

      <div className="flex h-full relative z-10">
        <div className="w-1/2 relative h-full self-end">
          {player.img && player.img !== '' ? (
            <Image
              src={player.img}
              alt={player.name}
              fill
              unoptimized
              className="object-contain object-bottom drop-shadow-xl"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <User size={80} />
            </div>
          )}
        </div>

        <div className="w-1/2 p-3 pl-0 flex flex-col justify-between h-full">
          <div>
            <div className="flex justify-between items-start mb-1">
              <span
                className={`text-[10px] uppercase font-black px-2 py-0.5 rounded border tracking-widest ${getPositionColor(player.position)}`}
              >
                {player.position}
              </span>
            </div>

            <h3
              className={`font-display font-bold text-xl leading-tight tracking-tight mb-1 line-clamp-2 ${
                player.owner_id
                  ? getColorForUser(player.owner_id, player.owner_name, player.owner_color_index)
                      .groupHover
                  : 'group-hover:text-primary'
              }`}
            >
              {player.name}
            </h3>

            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              {player.team_img && player.team_img !== '' && (
                <div className="relative w-3.5 h-3.5 shrink-0">
                  <Image
                    src={player.team_img}
                    alt="team"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              )}
              <span className="truncate">{player.team_short_name || player.team_name}</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 border-b border-white/5 pb-1 mb-1">
              {player.owner_id ? (
                <>
                  {player.owner_icon && player.owner_icon !== '' ? (
                    <div className="relative w-4 h-4 rounded-full border border-background overflow-hidden shrink-0">
                      <Image
                        src={player.owner_icon}
                        alt={player.owner_name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center border border-background shrink-0">
                      <User size={10} className="text-primary" />
                    </div>
                  )}
                  <span className="text-xs font-bold text-foreground/90 truncate">
                    {player.owner_name}
                  </span>
                </>
              ) : (
                <span className="text-[10px] font-black uppercase text-muted-foreground italic tracking-widest">
                  LIBRE
                </span>
              )}
            </div>

            <div className="flex justify-between items-end border-b border-white/5 pb-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                PUNTOS
              </span>
              <span className="font-bold text-base text-primary tabular-nums">
                {player.total_points || 0}
              </span>
            </div>

            <div className="flex justify-between items-end border-b border-white/5 pb-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                VALOR
              </span>
              <div className="flex items-center gap-1">
                {player.price_increment > 0 && <TrendingUp size={12} className="text-green-500" />}
                {player.price_increment < 0 && <TrendingDown size={12} className="text-red-500" />}
                <span className="font-bold text-sm tabular-nums text-foreground">
                  {formatMoney(player.price)}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-end border-b border-white/5 pb-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {sortConfig?.key === 'best_score'
                  ? 'MEJOR'
                  : sortConfig?.key === 'worst_score'
                    ? 'PEOR'
                    : sortConfig?.key === 'avg_form_score'
                      ? 'FORMA'
                      : 'MEDIA'}
              </span>
              <span
                className={`font-bold text-base tabular-nums ${
                  sortConfig?.key === 'best_score'
                    ? 'text-emerald-400'
                    : sortConfig?.key === 'worst_score'
                      ? 'text-red-400'
                      : (player.average || 0) >= 5
                        ? 'text-green-400'
                        : 'text-yellow-400'
                }`}
              >
                {sortConfig?.key === 'best_score'
                  ? player.best_score
                  : sortConfig?.key === 'worst_score'
                    ? player.worst_score
                    : sortConfig?.key === 'avg_form_score'
                      ? player.avg_form_score
                      : player.average || '0.0'}
              </span>
            </div>

            <div className="pt-2 mt-2 border-t border-white/10">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[12px] font-black uppercase tracking-[0.3em] text-foreground/90 leading-none">
                  FORMA
                </span>
              </div>
              <div className="flex gap-1.5">
                {player.recent_scores ? (
                  player.recent_scores.split(',').map((score, idx) => {
                    const isDNP = score === 'X';
                    return (
                      <div
                        key={idx}
                        className={`w-[30px] h-[30px] rounded-lg flex items-center justify-center text-xs font-[1000] shadow-[0_2px_8px_rgba(0,0,0,0.3)] border border-white/5 transition-transform hover:scale-125 cursor-default ${getScoreColor(score)}`}
                        title={`Jornada ${idx + 1}: ${isDNP ? 'No jugó / Lesionado' : `${score} pts`}`}
                      >
                        {score}
                      </div>
                    );
                  })
                ) : (
                  <span className="text-[10px] italic text-muted-foreground/30">N/A</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
