'use client';

import { useUser } from '@/contexts/UserContext';
import { Award } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function CaptainStatsCard() {
  const { currentUser } = useUser();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!currentUser) return;

    fetch(`/api/captain-stats?userId=${currentUser.id}`)
      .then(res => res.json())
      .then(d => d.success && setStats(d.stats));
  }, [currentUser]);

  if (!currentUser || !stats) return null;

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-xl shadow-black/5 flex flex-col hover:border-slate-600/50 transition-all duration-300">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-bold text-white/90 flex items-center gap-2">
          <div className="p-1.5 bg-yellow-500/10 rounded-lg">
            <Award className="w-4 h-4 text-yellow-500" />
          </div>
          Capitanía
        </h2>
      </div>

      <div className="space-y-3 flex-grow">
        {/* Overall stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-2.5 border border-slate-700/30">
            <div className="text-slate-400 text-[10px] font-medium mb-1 uppercase tracking-wider">Jornadas</div>
            <div className="text-xl font-bold text-white/90">{stats.total_rounds}</div>
          </div>
          
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-2.5 border border-slate-700/30">
            <div className="text-slate-400 text-[10px] font-medium mb-1 uppercase tracking-wider">Total pts</div>
            <div className="text-xl font-bold text-yellow-400">{stats.extra_points}</div>
          </div>

          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-2.5 border border-slate-700/30">
            <div className="text-slate-400 text-[10px] font-medium mb-1 uppercase tracking-wider">Promedio</div>
            <div className="text-xl font-bold text-orange-400">{stats.avg_points.toFixed(1)}</div>
          </div>
        </div>

        {/* Most used captains */}
        <div>
          <div className="text-slate-400 text-[10px] font-medium mb-2 uppercase tracking-wider">Más usados</div>
          <div className="space-y-1.5">
            {stats.most_used?.map((captain, idx) => (
              <div key={idx} className="flex justify-between text-xs bg-slate-800/30 rounded-lg px-2.5 py-2 hover:bg-slate-800/50 transition-colors border border-slate-700/20">
                <span className="text-slate-300 truncate font-medium">{captain.name}</span>
                <div className="flex gap-2 flex-shrink-0">
                  <span className="text-yellow-400 font-semibold">{captain.times_captain}x</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-green-400 font-semibold">{captain.avg_as_captain.toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Best/Worst */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-2.5 border border-slate-700/30">
            <div className="text-slate-400 text-[10px] font-medium mb-1 uppercase tracking-wider">Mejor Jornada</div>
            {stats.best_round?.name && (
              <div className="text-xs font-medium text-white/80 mb-1.5 truncate">{stats.best_round.name}</div>
            )}
            <div className="text-lg font-bold text-green-400">{stats.best_round?.points || 0} pts</div>
          </div>
          
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-2.5 border border-slate-700/30">
            <div className="text-slate-400 text-[10px] font-medium mb-1 uppercase tracking-wider">Peor Jornada</div>
            {stats.worst_round?.name && (
              <div className="text-xs font-medium text-white/80 mb-1.5 truncate">{stats.worst_round.name}</div>
            )}
            <div className="text-lg font-bold text-red-400">{stats.worst_round?.points || 0} pts</div>
          </div>
        </div>
      </div>
    </div>
  );
}
