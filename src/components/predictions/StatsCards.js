'use client';

import {
  Star,
  AlertCircle,
  Trophy,
  Zap,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Helper for card base style
function StatCardBase({ children, className, onClick }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-5 shadow-sm h-full flex flex-col justify-between transition-all duration-300 relative overflow-hidden group',
        onClick && 'cursor-pointer hover:border-primary/30 hover:shadow-md hover:bg-card/80',
        className
      )}
    >
      {children}
    </div>
  );
}

export function Perfect10Card({ achievements }) {
  const perfects = achievements?.perfect_10 || [];

  if (perfects.length === 0) {
    return (
      <StatCardBase>
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
            Perfect 10
          </h3>
        </div>
        <p className="text-xs text-muted-foreground">Nadie ha logrado un 10/10 todavía</p>
      </StatCardBase>
    );
  }

  return (
    <StatCardBase className="bg-gradient-to-br from-yellow-500/10 to-transparent border-yellow-500/20">
      <div className="flex items-center gap-2 mb-3">
        <Star className="w-5 h-5 text-yellow-500" fill="currentColor" />
        <h3 className="text-sm font-bold text-yellow-500 uppercase tracking-wider">Perfect 10</h3>
      </div>
      <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
        {perfects.slice(0, 5).map((p, idx) => (
          <div
            key={idx}
            className="flex justify-between items-center text-xs bg-yellow-500/10 rounded-md px-2.5 py-1.5 border border-yellow-500/10"
          >
            <span className="text-yellow-600 dark:text-yellow-200 font-medium">{p.usuario}</span>
            <span className="text-yellow-500 font-bold">{p.jornada}</span>
          </div>
        ))}
      </div>
      {perfects.length > 5 && (
        <p className="text-xs text-yellow-600/70 dark:text-yellow-400/70 mt-2 font-medium">
          +{{ count: perfects.length - 5 }} más
        </p>
      )}
    </StatCardBase>
  );
}

export function BlankedCard({ achievements }) {
  const blanked = achievements?.blanked || [];

  if (blanked.length === 0) {
    return (
      <StatCardBase>
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
            Blanked
          </h3>
        </div>
        <p className="text-xs text-muted-foreground">Nadie ha tenido 0 aciertos aún</p>
      </StatCardBase>
    );
  }

  return (
    <StatCardBase className="bg-gradient-to-br from-red-500/10 to-transparent border-red-500/20">
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle className="w-5 h-5 text-red-500" />
        <h3 className="text-sm font-bold text-red-500 uppercase tracking-wider">Blanked</h3>
      </div>
      <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
        {blanked.slice(0, 5).map((b, idx) => (
          <div
            key={idx}
            className="flex justify-between items-center text-xs bg-red-500/10 rounded-md px-2.5 py-1.5 border border-red-500/10"
          >
            <span className="text-red-600 dark:text-red-200 font-medium">{b.usuario}</span>
            <span className="text-red-500 font-bold">{b.jornada}</span>
          </div>
        ))}
      </div>
      {blanked.length > 5 && (
        <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-2 font-medium">
          +{{ count: blanked.length - 5 }} más
        </p>
      )}
    </StatCardBase>
  );
}

export function ClutchCard({ clutchStats, onClick }) {
  if (!clutchStats || clutchStats.length === 0) return null;
  const topClutch = clutchStats[0];

  return (
    <StatCardBase onClick={onClick} className="hover:border-blue-500/50 group">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      <div className="flex items-center gap-2 mb-3 relative">
        <Zap className="w-5 h-5 text-blue-500" fill="currentColor" />
        <h3 className="text-sm font-bold text-blue-500 uppercase tracking-wider">Clutch Player</h3>
      </div>
      <div className="text-center relative">
        <p className="text-lg font-bold text-foreground">{topClutch.usuario}</p>
        <div className="flex items-center justify-center gap-2 my-1">
          <span className="text-3xl font-black text-blue-500 tracking-tight">
            {parseFloat(topClutch.avg_last_3).toFixed(2)}
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
          Promedio últimas 3 jornadas
        </p>
      </div>
      <div className="relative mt-2 flex justify-center">
        <p className="text-xs text-blue-500/70 flex items-center gap-1 group-hover:text-blue-500 transition-colors font-medium">
          Ver ranking{' '}
          <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
        </p>
      </div>
    </StatCardBase>
  );
}

export function VictoriasCard({ victorias, onClick }) {
  if (!victorias || victorias.length === 0) return null;
  const topWinner = victorias[0];

  return (
    <StatCardBase onClick={onClick} className="hover:border-purple-500/50 group">
      <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      <div className="flex justify-between items-start relative">
        <div>
          <h3 className="text-sm font-bold text-purple-500 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Más Victorias
          </h3>
          <p className="text-xl font-bold text-foreground">{topWinner.usuario}</p>
          <p className="text-lg text-purple-500 font-bold">
            {topWinner.victorias}{' '}
            <span className="text-sm font-medium text-purple-500/70">victorias</span>
          </p>
        </div>
        <div className="p-2.5 bg-purple-500/10 rounded-xl group-hover:scale-110 transition-transform duration-300">
          <Trophy className="w-6 h-6 text-purple-500" />
        </div>
      </div>
      <div className="relative mt-auto pt-2">
        <p className="text-xs text-purple-500/70 flex items-center gap-1 group-hover:text-purple-500 transition-colors font-medium">
          Ver ranking{' '}
          <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
        </p>
      </div>
    </StatCardBase>
  );
}

export function BestRoundCard({ bestStats }) {
  if (!bestStats || bestStats.length === 0) return null;
  const best = bestStats[0];

  return (
    <StatCardBase>
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-5 h-5 text-emerald-500" />
        <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-wider">
          Mejor Jornada
        </h3>
      </div>
      <div className="flex-grow flex flex-col items-center justify-center text-center">
        <div className="relative">
          <p className="text-4xl font-black text-emerald-500 mb-1">{best.aciertos}</p>
          <p className="text-[10px] text-emerald-500/60 uppercase tracking-wider font-bold absolute -bottom-3 w-full text-center">
            Aciertos
          </p>
        </div>

        <div className="flex flex-col gap-2 w-full mt-6 max-h-32 overflow-y-auto custom-scrollbar">
          {bestStats
            .filter((s) => s.aciertos === best.aciertos)
            .map((entry, idx) => (
              <div
                key={idx}
                className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg py-2 px-3 flex items-center justify-between gap-2 group hover:bg-emerald-500/10 transition-colors"
              >
                <span className="text-foreground font-medium text-sm">{entry.usuario}</span>
                <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  {entry.jornada}
                </span>
              </div>
            ))}
        </div>
      </div>
    </StatCardBase>
  );
}

export function BestAverageCard({ promedios }) {
  if (!promedios || promedios.length === 0) return null;
  const best = promedios[0];
  const progress = Math.min((best.promedio / 10) * 100, 100);

  return (
    <StatCardBase className="bg-gradient-to-br from-card/50 to-emerald-500/5 hover:border-emerald-500/30">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Mejor Promedio
          </h3>
          <p className="text-2xl font-bold text-foreground">{best.usuario}</p>
        </div>
        <div className="p-2.5 bg-emerald-500/10 rounded-xl">
          <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        </div>
      </div>

      <div className="mt-6">
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {parseFloat(best.promedio).toFixed(2)}
          </span>
          <span className="text-xs text-emerald-600/70 dark:text-emerald-400/70 font-bold">
            aciertos/jornada
          </span>
        </div>

        <div className="w-full bg-muted rounded-full h-1.5 mb-2 overflow-hidden">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          En <span className="font-medium text-foreground">{best.jornadas_jugadas}</span> jornadas
          jugadas
        </p>
      </div>
    </StatCardBase>
  );
}
