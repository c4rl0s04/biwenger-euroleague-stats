'use client';

import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Target,
  Zap,
  Award,
  Activity,
  BarChart3,
} from 'lucide-react';
import { ElegantCard, AnimatedNumber } from '@/components/ui';

export default function SeasonRecordsCard({ stats }) {
  if (!stats) return null;

  const {
    best_round,
    worst_round,
    average_points,
    best_position,
    worst_position,
    average_position,
    victories,
    podiums,
    rounds_played,
  } = stats;

  return (
    <ElegantCard title="Métricas Clave" icon={Trophy} color="orange">
      <div className="flex flex-col h-full justify-between gap-4">
        {/* --- ZONE 1: PRIMARY AVERAGES --- */}
        <div className="flex justify-between items-end relative group/hero">
          <div className="absolute -inset-4 bg-orange-500/5 blur-3xl rounded-full opacity-0 group-hover/hero:opacity-100 transition-opacity duration-700 -z-10" />
          <div className="flex-1">
            <div className="text-white/70 text-[10px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
              Posición Media
            </div>
            <div className="text-5xl font-display font-black text-white leading-none hover:text-purple-400 transition-colors duration-300 cursor-default">
              #<AnimatedNumber value={average_position} decimals={1} />
            </div>
          </div>
          <div className="text-right">
            <div className="text-white/70 text-[10px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-2 justify-end">
              Media Puntos
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            </div>
            <div className="text-5xl font-display font-black text-orange-400 leading-none drop-shadow-[0_0_15px_rgba(251,146,60,0.3)]">
              <AnimatedNumber value={average_points} decimals={1} />
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="h-px bg-white/10" />

        {/* --- ZONE 2: POSITION EXTREMES --- */}
        <div className="grid grid-cols-2 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={14} className="text-emerald-400" />
              <span className="text-white/70 text-[10px] font-black uppercase tracking-widest">
                Mejor Pos.
              </span>
            </div>
            <div className="text-3xl font-display font-black text-emerald-400 leading-none">
              #<AnimatedNumber value={best_position} />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown size={14} className="text-destructive" />
              <span className="text-white/70 text-[10px] font-black uppercase tracking-widest">
                Peor Pos.
              </span>
            </div>
            <div className="text-3xl font-display font-black text-destructive leading-none">
              #<AnimatedNumber value={worst_position} />
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="h-px bg-white/10" />

        {/* --- ZONE 3: ROUND EXTREMES --- */}
        <div className="grid grid-cols-2 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap size={14} className="text-emerald-400" />
              <span className="text-white/70 text-[10px] font-black uppercase tracking-widest">
                Mejor Jda.
              </span>
            </div>
            <div className="text-3xl font-display font-black text-emerald-400 leading-none">
              <AnimatedNumber value={best_round} />{' '}
              <span className="text-sm font-sans font-bold text-white/40">pts</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Target size={14} className="text-destructive" />
              <span className="text-white/70 text-[10px] font-black uppercase tracking-widest">
                Peor Jda.
              </span>
            </div>
            <div className="text-3xl font-display font-black text-destructive leading-none">
              <AnimatedNumber value={worst_round} />{' '}
              <span className="text-sm font-sans font-bold text-white/40">pts</span>
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="h-px bg-white/10" />

        {/* --- ZONE 4: ACHIEVEMENTS --- */}
        <div className="grid grid-cols-2 gap-8">
          <div className="group/item">
            <div className="flex items-center gap-2 mb-2">
              <Award
                size={14}
                className="text-yellow-400 group-hover/item:rotate-12 transition-transform"
              />
              <span className="text-white/70 text-[10px] font-black uppercase tracking-widest">
                Victorias
              </span>
            </div>
            <div className="text-3xl font-display font-black text-yellow-400 leading-none group-hover/item:scale-105 transition-transform origin-left">
              {victories}{' '}
              <span className="text-sm font-sans font-bold text-white/40">
                {victories === 1 ? 'vez' : 'veces'}
              </span>
            </div>
          </div>
          <div className="group/item">
            <div className="flex items-center gap-2 mb-2">
              <Activity
                size={14}
                className="text-orange-400 group-hover/item:scale-125 transition-transform"
              />
              <span className="text-white/70 text-[10px] font-black uppercase tracking-widest">
                Podios
              </span>
            </div>
            <div className="text-3xl font-display font-black text-orange-400 leading-none group-hover/item:scale-105 transition-transform origin-left">
              {podiums} <span className="text-sm font-sans font-bold text-white/40">Top 3</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-right">
          <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest italic">
            Calculado sobre {rounds_played} jornadas disputadas
          </span>
        </div>
      </div>
    </ElegantCard>
  );
}
