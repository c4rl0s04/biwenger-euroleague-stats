'use client';

import { TrendingUp } from 'lucide-react';

export function BestRoundCard({ bestStats }) {
  if (!bestStats || bestStats.length === 0) return null;
  const best = bestStats[0];

  return (
    <div className="relative overflow-hidden rounded-xl border border-emerald-500/50 bg-gradient-to-br from-emerald-500/20 via-emerald-900/10 to-transparent shadow-[0_0_20px_rgba(16,185,129,0.15)] group h-full flex flex-col p-5 backdrop-blur-sm transition-all duration-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:border-emerald-500/80">
      {/* Decorative background elements */}
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/20 blur-3xl rounded-full pointer-events-none group-hover:bg-emerald-500/30 transition-colors" />
      <div className="absolute -left-6 -bottom-6 w-20 h-20 bg-green-500/20 blur-2xl rounded-full pointer-events-none" />

      <div className="flex flex-col gap-1 mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-500/20 rounded-lg border border-emerald-500/30 shadow-inner">
            <TrendingUp className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          </div>
          <div>
            <h3 className="text-xl font-black text-emerald-500 uppercase tracking-widest drop-shadow-sm leading-none">
              Récord
            </h3>
            <p className="text-[10px] font-bold text-emerald-400/60 uppercase tracking-wider">
              En una jornada
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex-grow flex flex-col justify-center items-center text-center">
        <div className="flex flex-col items-center mb-4">
          <span className="text-5xl font-black text-emerald-500 tracking-tighter drop-shadow-lg leading-none">
            {best.aciertos}
          </span>
          <p className="text-[10px] font-bold text-emerald-400/60 uppercase tracking-wider mt-1">
            Aciertos Máximos
          </p>
        </div>

        <div className="flex flex-col gap-2 w-full max-h-32 overflow-y-auto custom-scrollbar px-2">
          {bestStats
            .filter((s) => s.aciertos === best.aciertos)
            .map((entry, idx) => (
              <div key={idx} className="flex flex-col items-center justify-center p-1">
                <span className="text-lg sm:text-xl font-black text-emerald-100/90 leading-tight">
                  {entry.usuario}
                </span>
                <span className="text-[10px] font-bold text-emerald-500/70 uppercase tracking-wide">
                  {entry.jornada}
                </span>
                {idx < bestStats.filter((s) => s.aciertos === best.aciertos).length - 1 && (
                  <div className="w-8 h-px bg-emerald-500/20 mt-2 rounded-full" />
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
