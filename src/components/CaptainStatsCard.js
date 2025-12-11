'use client';

import { useUser } from '@/contexts/UserContext';
import { Award } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

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
    <div className="bg-gradient-to-br from-yellow-900/20 to-slate-900 backdrop-blur-md border border-yellow-700/30 rounded-2xl p-6 relative overflow-hidden group hover:border-yellow-600/50 transition-all flex flex-col h-full">
      {/* Background decoration */}
      <div className="absolute -top-6 -right-6 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
        <Award className="w-32 h-32 text-yellow-500" />
      </div>

      <div className="flex items-center justify-between mb-5 relative z-10">
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
            <div className="text-slate-400 text-[10px] font-medium mb-1 uppercase tracking-wider">Total pts (1x)</div>
            <div className="text-xl font-bold text-yellow-400">{stats.extra_points}</div>
          </div>

          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-2.5 border border-slate-700/30">
            <div className="text-slate-400 text-[10px] font-medium mb-1 uppercase tracking-wider">Promedio (1x)</div>
            <div className="text-xl font-bold text-orange-400">{stats.avg_points.toFixed(1)}</div>
          </div>
        </div>

        {/* All captains used - scrollable list */}
        <div className="flex-grow">
          <div className="flex items-baseline justify-between mb-2">
            <div className="text-slate-400 text-[10px] font-medium uppercase tracking-wider">Todos los Capitanes</div>
            <div className="text-slate-500 text-[9px]">Puntos sin duplicar (1x)</div>
          </div>
          <div className="max-h-[180px] overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800/50">
            {stats.most_used?.map((captain, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs bg-slate-800/30 rounded-lg px-2.5 py-2 hover:bg-slate-800/50 transition-colors border border-slate-700/20">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-slate-500 font-mono text-[10px] w-5">{idx + 1}.</span>
                  <Link href={`/player/${captain.player_id}`} className="text-white truncate font-medium hover:text-yellow-400 transition-colors block">
                    {captain.name}
                  </Link>
                </div>
                <div className="flex items-center gap-2.5 flex-shrink-0 ml-2">
                  <div className="text-right">
                    <div className="text-yellow-400 font-semibold">{captain.times_captain}x</div>
                    <div className="text-slate-500 text-[9px]">{captain.times_captain === 1 ? 'vez' : 'veces'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-semibold">{captain.avg_as_captain.toFixed(1)}</div>
                    <div className="text-slate-500 text-[9px]">media</div>
                  </div>
                  <div className="text-right">
                    <div className="text-orange-400 font-semibold">{captain.total_as_captain}</div>
                    <div className="text-slate-500 text-[9px]">total</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Best/Worst - more compact */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-2.5 border border-slate-700/30">
            <div className="text-slate-400 text-[10px] font-medium mb-1 uppercase tracking-wider">Mejor</div>
            {stats.best_round?.name && (
              <div className="text-xs font-medium text-white/80 mb-1 truncate">{stats.best_round.name}</div>
            )}
            <div className="text-lg font-bold text-green-400">{stats.best_round?.points || 0} pts</div>
          </div>
          
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-2.5 border border-slate-700/30">
            <div className="text-slate-400 text-[10px] font-medium mb-1 uppercase tracking-wider">Peor</div>
            {stats.worst_round?.name && (
              <div className="text-xs font-medium text-white/80 mb-1 truncate">{stats.worst_round.name}</div>
            )}
            <div className="text-lg font-bold text-red-400">{stats.worst_round?.points || 0} pts</div>
          </div>
        </div>
      </div>
    </div>
  );
}
