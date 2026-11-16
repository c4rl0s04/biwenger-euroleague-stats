'use client';

import Image from 'next/image';
import { Card, CardTitle, EmptyState } from '@/components/ui/foundation';
import { Crown, Target, Grab, Handshake } from 'lucide-react';

const STAT_CONFIGS = {
  mvp: {
    title: 'MVP de la Jornada',
    icon: Crown,
    gradient: 'from-yellow-500/10 to-amber-900/20',
    border: 'border-yellow-500/20',
    iconColor: 'text-[var(--round-record)]',
    valueColor: 'text-[var(--round-record)]',
    unit: 'pts',
  },
  points: {
    title: 'Máximo Anotador',
    icon: Target,
    gradient: 'from-orange-500/10 to-red-900/20',
    border: 'border-orange-500/20',
    iconColor: 'text-primary',
    valueColor: 'text-primary',
    unit: 'pts',
  },
  rebounds: {
    title: 'Líder en Rebotes',
    icon: Grab,
    gradient: 'from-blue-500/10 to-indigo-900/20',
    border: 'border-blue-500/20',
    iconColor: 'text-[var(--round-info)]',
    valueColor: 'text-[var(--round-info)]',
    unit: 'reb',
  },
  assists: {
    title: 'Líder en Asistencias',
    icon: Handshake,
    gradient: 'from-emerald-500/10 to-teal-900/20',
    border: 'border-emerald-500/20',
    iconColor: 'text-[var(--round-ideal)]',
    valueColor: 'text-[var(--round-ideal)]',
    unit: 'ast',
  },
};

export default function StatLeaderCard({ player, statType = 'mvp', statValue }) {
  const config = STAT_CONFIGS[statType] || STAT_CONFIGS.mvp;
  const Icon = config.icon;

  if (!player)
    return (
      <Card density="compact" className="h-full">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon size={16} aria-hidden />
          <h3 className="font-sans! text-sm! font-semibold tracking-normal! normal-case!">
            {config.title}
          </h3>
        </div>
        <EmptyState>Sin datos disponibles</EmptyState>
      </Card>
    );

  const displayValue = statValue ?? player.points ?? player.stat_value ?? 0;

  return (
    <Card
      density="compact"
      role="group"
      aria-label={config.title}
      interactive={Boolean(player.id)}
      className="relative h-full overflow-hidden"
    >
      <div className="flex items-start justify-between h-full gap-2">
        <div className="flex flex-col justify-between h-full flex-1 min-w-0">
          {/* Header */}
          <div className={`flex items-center gap-2 ${config.iconColor} mb-1`}>
            <Icon size={14} />
            <CardTitle className="text-xs!">{config.title}</CardTitle>
          </div>

          {/* Player Info */}
          <div className="flex-1 flex flex-col justify-center my-1">
            <div
              className="text-base font-bold text-foreground leading-tight line-clamp-2 break-words"
              title={player.name}
            >
              {player.id ? (
                <a
                  href={`/player/${player.id}`}
                  className="after:absolute after:inset-0 after:rounded-[var(--radius-surface)] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-primary hover:underline"
                >
                  {player.name}
                </a>
              ) : (
                player.name
              )}
            </div>
            <div className="text-[11px] text-muted-foreground">{player.team_name}</div>
          </div>

          {/* Stat Value */}
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-bold ${config.valueColor}`}>{displayValue}</span>
            <span className={`text-[10px] ${config.iconColor}/70`}>{config.unit}</span>
          </div>
        </div>

        {/* Player Image - Cropped to show head (same as PlayerCourtCard) */}
        {player.img && (
          <div className="relative w-12 h-12 rounded-full border-2 border-border overflow-hidden shrink-0 shadow-lg bg-slate-900 self-center">
            <div className="relative w-full h-full pt-1 scale-[1.7] origin-top">
              <Image src={player.img} alt={player.name} fill className="object-cover object-top" />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
