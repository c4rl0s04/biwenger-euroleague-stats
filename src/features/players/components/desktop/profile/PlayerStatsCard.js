'use client';

import { Activity, HeartPulse, Flame } from 'lucide-react';
import { ElegantCard } from '@/components/ui';
import { getScoreColor, getShortRoundName } from '@/lib/utils/format';

export default function PlayerStatsCard({ player, className = '' }) {
  const matches = player.recentMatches || [];
  const last5 = [...matches].slice(0, 5);

  // Calculate trend
  const last3 = matches.slice(0, 3);
  const forma =
    last3.length > 0
      ? (last3.reduce((sum, m) => sum + (m.fantasy_points || 0), 0) / last3.length).toFixed(1)
      : '-';

  return (
    <ElegantCard
      title="Rendimiento BW"
      icon={Activity}
      color="amber"
      className={`h-full ${className}`}
    >
      <div className="flex flex-col h-full gap-5 mt-4">
        {/* Main Stats Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-amber-500/5 rounded-2xl p-4 border border-amber-500/10 flex flex-col items-center group hover:bg-amber-500/15 transition-all duration-300">
            <span className="text-[10px] font-black text-amber-500/80 uppercase tracking-widest mb-1">
              Media
            </span>
            <span className="text-3xl font-black text-white leading-none tabular-nums">
              {player.season_avg || '0.0'}
            </span>
          </div>
          <div className="bg-blue-500/5 rounded-2xl p-4 border border-blue-500/10 flex flex-col items-center group hover:bg-blue-500/15 transition-all duration-300">
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">
              Forma (U3)
            </span>
            <div className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-3xl font-black text-white leading-none tabular-nums">
                {forma}
              </span>
            </div>
          </div>
        </div>

        {/* Last 5 Matches */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">
              Racha Reciente
            </span>
            <div className="h-px flex-1 mx-3 bg-white/10"></div>
          </div>
          <div className="flex justify-between items-center gap-2">
            {Array.from({ length: 5 }).map((_, i) => {
              const m = last5[i];
              const scoreColor = m
                ? getScoreColor(m.fantasy_points)
                : 'bg-white/[0.02] border-white/5 text-white/10';
              const roundLabel = m
                ? getShortRoundName(m.round_name || `Jornada ${m.round_id}`)
                : '-';

              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <div
                    className={`w-full py-2.5 rounded-lg border text-center transition-all duration-500 hover:scale-105 ${scoreColor}`}
                  >
                    <span className="text-sm font-black tracking-tight tabular-nums">
                      {m ? m.fantasy_points : '-'}
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-white/80 uppercase tracking-tight">
                    {roundLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Floor & Ceiling */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between bg-black/20 p-3 rounded-xl border border-white/5 group hover:bg-black/40 transition-colors">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">
                Suelo
              </span>
              <span className="text-lg font-black text-rose-400/80 tabular-nums">
                {player.worst_fantasy || 0}
              </span>
            </div>
            <HeartPulse className="w-4 h-4 text-rose-500/30 group-hover:text-rose-500/50 transition-colors" />
          </div>
          <div className="flex items-center justify-between bg-black/20 p-3 rounded-xl border border-white/5 group hover:bg-black/40 transition-colors">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">
                Techo
              </span>
              <span className="text-lg font-black text-emerald-400/80 tabular-nums">
                {player.best_fantasy || 0}
              </span>
            </div>
            <Activity className="w-4 h-4 text-emerald-500/30 group-hover:text-emerald-500/50 transition-colors" />
          </div>
        </div>
      </div>
    </ElegantCard>
  );
}
