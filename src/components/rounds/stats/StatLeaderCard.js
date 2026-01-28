'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Crown, Target, Grab, Handshake } from 'lucide-react';

const STAT_CONFIGS = {
  mvp: {
    title: 'MVP de la Jornada',
    icon: Crown,
    gradient: 'from-yellow-500/10 to-amber-900/20',
    border: 'border-yellow-500/20',
    iconColor: 'text-yellow-500',
    valueColor: 'text-yellow-400',
    unit: 'pts',
  },
  points: {
    title: 'Máximo Anotador',
    icon: Target,
    gradient: 'from-orange-500/10 to-red-900/20',
    border: 'border-orange-500/20',
    iconColor: 'text-orange-500',
    valueColor: 'text-orange-400',
    unit: 'pts',
  },
  rebounds: {
    title: 'Líder en Rebotes',
    icon: Grab,
    gradient: 'from-blue-500/10 to-indigo-900/20',
    border: 'border-blue-500/20',
    iconColor: 'text-blue-500',
    valueColor: 'text-blue-400',
    unit: 'reb',
  },
  assists: {
    title: 'Líder en Asistencias',
    icon: Handshake,
    gradient: 'from-emerald-500/10 to-teal-900/20',
    border: 'border-emerald-500/20',
    iconColor: 'text-emerald-500',
    valueColor: 'text-emerald-400',
    unit: 'ast',
  },
};

export default function StatLeaderCard({ player, statType = 'mvp', statValue }) {
  const router = useRouter();
  const config = STAT_CONFIGS[statType] || STAT_CONFIGS.mvp;
  const Icon = config.icon;

  // Empty state when no player data
  if (!player) {
    return (
      <div
        className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${config.gradient} ${config.border} border p-4 h-full opacity-50`}
      >
        <div className={`flex items-center gap-2 ${config.iconColor} mb-2`}>
          <Icon size={16} />
          <span className="text-xs font-bold uppercase tracking-wider">{config.title}</span>
        </div>
        <div className="text-sm text-white/30 italic">Sin datos disponibles</div>
      </div>
    );
  }

  const displayValue = statValue ?? player.points ?? player.stat_value ?? 0;

  const handleClick = () => {
    if (player.id) {
      router.push(`/player/${player.id}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${config.gradient} ${config.border} border p-4 h-full cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg`}
    >
      <div className="flex items-start justify-between h-full">
        <div className="flex flex-col justify-between h-full">
          {/* Header */}
          <div className={`flex items-center gap-2 ${config.iconColor} mb-1`}>
            <Icon size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">{config.title}</span>
          </div>

          {/* Player Info */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="text-lg font-bold text-white leading-tight truncate max-w-[140px]">
              {player.name}
            </div>
            <div className="text-xs text-white/50 mb-2">{player.team_name}</div>
          </div>

          {/* Stat Value */}
          <div className="flex items-baseline gap-1">
            <span className={`text-3xl font-bold ${config.valueColor}`}>{displayValue}</span>
            <span className={`text-xs ${config.iconColor}/70`}>{config.unit}</span>
          </div>
        </div>

        {/* Player Image - Cropped to show head (same as PlayerCourtCard) */}
        {player.img && (
          <div className="relative w-16 h-16 rounded-full border-2 border-white/10 overflow-hidden shrink-0 shadow-lg bg-slate-900">
            <div className="relative w-full h-full pt-1 scale-[1.7] origin-top">
              <Image src={player.img} alt={player.name} fill className="object-cover object-top" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
