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
    <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 flex flex-col">
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Award className="w-5 h-5 text-yellow-500" />
        Capitanía
      </h2>

      <div className="space-y-3 flex-grow">
        {/* Overall stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-800/50 rounded-lg p-2">
            <div className="text-slate-400 text-[10px] mb-1">Jornadas</div>
            <div className="text-xl font-bold text-white">{stats.total_rounds}</div>
          </div>
          
          <div className="bg-slate-800/50 rounded-lg p-2">
            <div className="text-slate-400 text-[10px] mb-1">Total pts</div>
            <div className="text-xl font-bold text-yellow-500">{stats.extra_points}</div>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-2">
            <div className="text-slate-400 text-[10px] mb-1">Promedio</div>
            <div className="text-xl font-bold text-orange-500">{stats.avg_points.toFixed(1)}</div>
          </div>
        </div>

        {/* Most used captains */}
        <div>
          <div className="text-slate-400 text-xs mb-2">Más usados</div>
          <div className="space-y-1">
            {stats.most_used?.map((captain, idx) => (
              <div key={idx} className="flex justify-between text-xs bg-slate-800/30 rounded px-2 py-1">
                <span className="text-slate-300 truncate">{captain.name}</span>
                <div className="flex gap-2 flex-shrink-0">
                  <span className="text-yellow-400">{captain.times_captain}x</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-green-400">{captain.avg_as_captain.toFixed(1)} avg</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Best/Worst */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-800/50 rounded-lg p-2">
            <div className="text-slate-400 text-[10px] mb-1">Mejor Jornada</div>
            {stats.best_round?.name && (
              <div className="text-xs font-medium text-white mb-1 truncate">{stats.best_round.name}</div>
            )}
            <div className="text-lg font-bold text-green-400">{stats.best_round?.points || 0} pts</div>
          </div>
          
          <div className="bg-slate-800/50 rounded-lg p-2">
            <div className="text-slate-400 text-[10px] mb-1">Peor Jornada</div>
            {stats.worst_round?.name && (
              <div className="text-xs font-medium text-white mb-1 truncate">{stats.worst_round.name}</div>
            )}
            <div className="text-lg font-bold text-red-400">{stats.worst_round?.points || 0} pts</div>
          </div>
        </div>
      </div>
    </div>
  );
}
