'use client';

import { Activity, HeartPulse, Flame } from 'lucide-react';
import { ElegantCard } from '@/components/ui';

export default function PlayerStatsCard({ player, className = '' }) {
  // Calculate form (Last 3 Avg)
  let forma = '-';
  if (player.recentMatches && player.recentMatches.length > 0) {
    const last3 = player.recentMatches.slice(0, 3);
    const avg = last3.reduce((sum, m) => sum + (m.fantasy_points || 0), 0) / last3.length;
    forma = avg.toFixed(1);
  }

  const isOk = player.status === 'ok';

  return (
    <ElegantCard
      title="Rendimiento"
      icon={Activity}
      color="amber"
      className={`h-full ${className}`}
    >
      <div className="flex flex-col h-full justify-between mt-2">
        {/* Main Stat: Season Average */}
        <div className="flex flex-col items-center justify-center py-4 relative z-10 flex-1">
          <div className="text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] text-amber-400/80 mb-3">
            Media Temporada
          </div>

          <div className="text-6xl md:text-7xl font-black text-amber-400 tracking-tighter tabular-nums drop-shadow-[0_0_20px_rgba(251,191,36,0.25)] leading-none">
            {player.season_avg}
          </div>

          {/* Form Badge (Ultimos 3) */}
          <div
            className={`mt-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 shadow-[0_0_20px_rgba(251,191,36,0.15)] backdrop-blur-sm transition-transform duration-500 hover:scale-105 cursor-default`}
          >
            <Flame className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-black tracking-widest text-amber-400">
              FORMA: {forma}
            </span>
          </div>
        </div>

        {/* Secondary Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mt-4 mb-6 w-full px-2">
          <div className="flex flex-col items-center bg-black/40 rounded-xl py-4 border border-white/10 shadow-inner backdrop-blur-md transition-all hover:bg-black/60 hover:border-amber-500/30 group cursor-default">
            <span className="text-[10px] md:text-xs uppercase font-black tracking-[0.2em] text-slate-400 mb-1.5 group-hover:text-amber-400/80 transition-colors">
              Pts Totales
            </span>
            <span className="text-2xl md:text-3xl font-black text-white drop-shadow-md tracking-tighter">
              {player.total_points}
            </span>
          </div>
          <div className="flex flex-col items-center bg-black/40 rounded-xl py-4 border border-white/10 shadow-inner backdrop-blur-md transition-all hover:bg-black/60 hover:border-amber-500/30 group cursor-default">
            <span className="text-[10px] md:text-xs uppercase font-black tracking-[0.2em] text-slate-400 mb-1.5 group-hover:text-amber-400/80 transition-colors">
              Partidos
            </span>
            <span className="text-2xl md:text-3xl font-black text-white drop-shadow-md tracking-tighter">
              {player.games_played}
            </span>
          </div>
        </div>
      </div>
    </ElegantCard>
  );
}
