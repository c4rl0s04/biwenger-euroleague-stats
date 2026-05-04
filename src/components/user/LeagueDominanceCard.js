'use client';

import { Swords, Trophy, Percent, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ElegantCard, AnimatedNumber } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';

export default function LeagueDominanceCard({ userId }) {
  const { data: allPlayAll = [], loading } = useApiData(
    '/api/standings/advanced?type=all-play-all'
  );

  // Find this specific user in the all-play-all results
  const userStats = allPlayAll.find((u) => String(u.user_id) === String(userId));

  if (loading) {
    return (
      <ElegantCard title="Dominio de Liga" icon={Swords} color="yellow" loading={true}>
        <div className="h-48 animate-pulse bg-white/5 rounded-lg" />
      </ElegantCard>
    );
  }

  if (!userStats) {
    return (
      <ElegantCard title="Dominio de Liga" icon={Swords} color="yellow">
        <div className="flex items-center justify-center h-48 text-[10px] text-white/30 italic uppercase tracking-widest text-center">
          No hay datos de enfrentamientos
        </div>
      </ElegantCard>
    );
  }

  const { wins, losses, ties, pct } = userStats;
  const totalMatches = wins + losses + ties;

  return (
    <ElegantCard
      title="Dominio de Liga (H2H Virtual)"
      icon={Swords}
      color="yellow"
      tooltip="Tu récord si cada jornada jugaras un 1vs1 contra todos los demás rivales."
    >
      <div className="flex flex-col h-full justify-between gap-4">
        {/* --- ZONE 1: WIN PERCENTAGE HERO --- */}
        <div className="flex flex-col items-center justify-center relative group/hero">
          <div className="absolute inset-0 bg-yellow-500/5 blur-3xl rounded-full opacity-0 group-hover/hero:opacity-100 transition-opacity duration-700" />

          <div className="text-8xl font-display font-black text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.4)] relative">
            <AnimatedNumber value={pct} decimals={0} />
            <span className="text-3xl ml-1">%</span>
          </div>
          <div className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] mt-2">
            Efectividad Global
          </div>
        </div>

        {/* Separator */}
        <div className="h-px bg-white/10" />

        {/* --- ZONE 2: WIN/LOSS RECORD --- */}
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center">
            <div className="text-xs sm:text-sm font-black text-emerald-400/70 uppercase mb-1">
              Victorias
            </div>
            <div className="text-5xl font-display font-black text-emerald-400">{wins}</div>
          </div>
          <div className="flex flex-col items-center border-x border-white/5">
            <div className="text-xs sm:text-sm font-black text-white/40 uppercase mb-1">
              Empates
            </div>
            <div className="text-5xl font-display font-black text-white/60">{ties}</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-xs sm:text-sm font-black text-destructive/70 uppercase mb-1">
              Derrotas
            </div>
            <div className="text-5xl font-display font-black text-destructive">{losses}</div>
          </div>
        </div>

        {/* Separator */}
        <div className="h-px bg-white/10" />

        {/* --- ZONE 3: CONTEXT --- */}
        <div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 group/context hover:bg-white/[0.08] transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white/80 uppercase tracking-widest">
                  {totalMatches} Partidas Disputadas
                </span>
              </div>
              <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400 group-hover/context:scale-110 transition-transform">
                <Trophy size={16} />
              </div>
            </div>
          </div>

          <div className="mt-4 text-[10px] text-white/30 italic text-center">
            &quot;¿Quién ganaría en un todos contra todos?&quot;
          </div>
        </div>
      </div>
    </ElegantCard>
  );
}
