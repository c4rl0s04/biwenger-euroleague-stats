'use client';

import Link from 'next/link';
import Image from 'next/image';
import { User } from 'lucide-react';
import { getColorForUser } from '@/lib/constants/colors';
import { getScoreColor } from '@/lib/utils/format';

export default function PlayerCard({ player }) {
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
        return 'bg-gray-500/25 text-gray-500 border-gray-500/30';
    }
  };

  return (
    <Link
      href={`/player/${player.id}`}
      className="group relative block bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:scale-[1.02] h-80"
    >
      {/* Background Gradient */}
      <div
        className={`absolute inset-0 transition-opacity bg-gradient-to-br ${
          player.owner_id ? getColorForUser(player.owner_id).bg : 'from-gray-500/20 to-gray-600/10'
        }`}
      />

      {/* Team Logo Watermark (Top Right) */}
      {player.team_img && (
        <div className="absolute -right-8 -top-8 w-40 h-40 opacity-5 group-hover:opacity-10 transition-opacity rotate-12 pointer-events-none">
          <Image
            src={player.team_img}
            alt={player.team_name || 'Team Logo'}
            fill
            className="object-contain grayscale"
            unoptimized
          />
        </div>
      )}

      <div className="flex h-full relative z-10">
        {/* Player Image (Left Side - 50%) */}
        <div className="w-1/2 relative h-full self-end">
          <Image
            src={player.img}
            alt={player.name}
            fill
            unoptimized={true}
            className="object-contain object-bottom drop-shadow-xl"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>

        {/* Info Column (Right Side - 50%) */}
        <div className="w-1/2 p-3 pl-0 flex flex-col justify-between h-full">
          {/* Top Section: Position, Name, Team */}
          <div>
            <div className="flex justify-between items-start mb-1">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getPositionColor(player.position)}`}
              >
                {player.position}
              </span>
            </div>

            <div className="block">
              <h3 className="font-display font-bold text-lg leading-tight tracking-tight group-hover:text-primary transition-colors line-clamp-2 mb-1 min-h-[1.5rem]">
                {player.name}
              </h3>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1">
                {player.team_img && (
                  <div className="relative w-3.5 h-3.5 shrink-0">
                    <Image
                      src={player.team_img}
                      alt={player.team_name || 'Team'}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                )}
                <span className="truncate">{player.team_short_name || player.team_name}</span>
              </div>
            </div>
          </div>

          {/* Bottom Section: Owner, Stats, Form */}
          <div className="space-y-1">
            {/* Owner Row */}
            <div className="flex items-center gap-2 border-b border-border/50 pb-1 mb-1">
              {player.owner_id ? (
                <>
                  {player.owner_icon ? (
                    <div className="relative w-3.5 h-3.5 rounded-full border border-background overflow-hidden shrink-0">
                      <Image
                        src={player.owner_icon}
                        alt={player.owner_name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full bg-primary/20 flex items-center justify-center border border-background shrink-0">
                      <User size={9} className="text-primary" />
                    </div>
                  )}
                  <span className="text-[11px] font-medium truncate text-foreground/90 max-w-[100px]">
                    {player.owner_name}
                  </span>
                </>
              ) : (
                <span className="text-[11px] font-medium text-muted-foreground">Libre</span>
              )}
            </div>

            {/* Stats Rows */}
            <div className="flex justify-between items-end border-b border-border/50 pb-1">
              <span className="text-[10px] text-muted-foreground">Puntos</span>
              <span className="font-bold text-xs text-primary tabular-nums">
                {player.total_points || 0}
              </span>
            </div>
            <div className="flex justify-between items-end border-b border-border/50 pb-1">
              <span className="text-[10px] text-muted-foreground">Valor</span>
              <span className="font-medium text-xs tabular-nums text-foreground">
                {formatMoney(player.price)}
              </span>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-[10px] text-muted-foreground">Media</span>
              <div
                className={`font-bold text-xs tabular-nums ${
                  player.average >= 5
                    ? 'text-green-400'
                    : player.average >= 3
                      ? 'text-yellow-400'
                      : 'text-red-400'
                }`}
              >
                {player.average || '0.0'}
              </div>
            </div>

            {/* Form (Recent Scores) */}
            {player.recent_scores && (
              <div className="flex flex-col border-t border-border/50 pt-1 mt-1">
                <span className="text-[10px] text-muted-foreground mb-0.5">Forma</span>
                <div className="flex gap-1 flex-wrap">
                  {player.recent_scores
                    .split(',')
                    .slice(0, 5)
                    .map((score, i) => (
                      <span
                        key={i}
                        className={`text-[9px] px-1 py-px rounded border ${getScoreColor(score)}`}
                      >
                        {score}
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
