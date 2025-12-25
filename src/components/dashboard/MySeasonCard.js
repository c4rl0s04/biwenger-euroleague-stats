'use client';

import { useUser } from '@/contexts/UserContext';
import { Trophy, TrendingUp, TrendingDown } from 'lucide-react';
import { PremiumCard } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';

export default function MySeasonCard() {
  const { currentUser } = useUser();

  const { data: stats, loading } = useApiData(
    () => (currentUser ? `/api/player/stats?userId=${currentUser.id}` : null),
    {
      transform: (d) => d?.stats || d,
      dependencies: [currentUser?.id],
      skip: !currentUser,
    }
  );

  if (!currentUser) return null;

  const getPositionColor = (pos) => {
    if (pos === 1) return 'text-yellow-400';
    if (pos <= 3) return 'text-orange-400';
    return 'text-slate-300';
  };

  return (
    <PremiumCard title="Tu Temporada" icon={Trophy} color="emerald" loading={loading}>
      {!loading && stats && (
        <>
          <div className="grid grid-cols-2 grid-rows-4 gap-2.5 flex-1 h-full">
            {/* Position */}
            <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-3 border border-slate-700/30 hover:border-emerald-500/30 transition-all flex flex-col justify-center">
              <div className="text-slate-400 text-[10px] font-medium mb-1.5 uppercase tracking-wider">
                Posición Actual
              </div>
              <div className={`text-2xl font-bold ${getPositionColor(stats.position)}`}>
                #{stats.position}
              </div>
            </div>

            {/* Total Points */}
            <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-3 border border-slate-700/30 hover:border-emerald-500/30 transition-all flex flex-col justify-center">
              <div className="text-slate-400 text-[10px] font-medium mb-1.5 uppercase tracking-wider">
                Puntos
              </div>
              <div className="text-2xl font-bold text-white">{stats.total_points}</div>
            </div>

            {/* Best Position */}
            <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-3 border border-slate-700/30 hover:border-emerald-500/30 transition-all flex flex-col justify-center">
              <div className="text-slate-400 text-[10px] font-medium mb-1.5 flex items-center gap-1 uppercase tracking-wider">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                Mejor Pos.
              </div>
              <div className="text-lg font-bold text-emerald-400">
                #{stats.best_position || '-'}
              </div>
            </div>

            {/* Worst Position */}
            <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-3 border border-slate-700/30 hover:border-emerald-500/30 transition-all flex flex-col justify-center">
              <div className="text-slate-400 text-[10px] font-medium mb-1.5 flex items-center gap-1 uppercase tracking-wider">
                <TrendingDown className="w-3 h-3 text-red-400" />
                Peor Pos.
              </div>
              <div className="text-lg font-bold text-red-400">#{stats.worst_position || '-'}</div>
            </div>

            {/* Best Round */}
            <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-3 border border-slate-700/30 hover:border-emerald-500/30 transition-all flex flex-col justify-center">
              <div className="text-slate-400 text-[10px] font-medium mb-1.5 uppercase tracking-wider">
                Mejor Jornada
              </div>
              <div className="text-base font-bold text-emerald-400">{stats.best_round} pts</div>
            </div>

            {/* Worst Round */}
            <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-3 border border-slate-700/30 hover:border-emerald-500/30 transition-all flex flex-col justify-center">
              <div className="text-slate-400 text-[10px] font-medium mb-1.5 uppercase tracking-wider">
                Peor Jornada
              </div>
              <div className="text-base font-bold text-red-400">{stats.worst_round} pts</div>
            </div>

            {/* Average */}
            <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-3 col-span-2 border border-slate-700/30 hover:border-emerald-500/30 transition-all flex flex-col justify-center">
              <div className="text-slate-400 text-[10px] font-medium mb-1.5 uppercase tracking-wider">
                Promedio por jornada
              </div>
              <div className="text-xl font-bold text-blue-400">{stats.average_points} pts</div>
            </div>
          </div>

          {/* Rounds played */}
          <div className="mt-4 text-slate-500 text-[10px] text-center font-medium tracking-wide">
            {stats.rounds_played} jornadas jugadas
          </div>
        </>
      )}
    </PremiumCard>
  );
}
