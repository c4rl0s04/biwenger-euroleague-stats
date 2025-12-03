'use client';

import { useUser } from '@/contexts/UserContext';
import { Trophy, TrendingUp, TrendingDown, Award } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function MySeasonCard() {
  const { currentUser } = useUser();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    fetch(`/api/user-stats?userId=${currentUser.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStats(data.stats);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching user stats:', err);
        setLoading(false);
      });
  }, [currentUser]);

  if (!currentUser) return null;
  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-xl shadow-black/5 animate-pulse">
        <div className="h-6 bg-slate-700/50 rounded w-1/2 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-slate-700/50 rounded"></div>
          <div className="h-4 bg-slate-700/50 rounded"></div>
          <div className="h-4 bg-slate-700/50 rounded"></div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const getPositionColor = (pos) => {
    if (pos === 1) return 'text-yellow-400';
    if (pos <= 3) return 'text-orange-400';
    return 'text-slate-300';
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-xl shadow-black/5 relative overflow-hidden group hover:border-slate-600/50 transition-all duration-300">
      {/* Background decoration */}
      <div className="absolute -top-10 -right-10 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-500">
        <Trophy className="w-32 h-32 text-orange-500 rotate-12" />
      </div>

      <div className="relative">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-white/90 flex items-center gap-2">
            <div className="p-1.5 bg-orange-500/10 rounded-lg">
              <Trophy className="w-4 h-4 text-orange-500" />
            </div>
            Tu Temporada
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Position */}
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-3 border border-slate-700/30 hover:border-slate-600/50 transition-all">
            <div className="text-slate-400 text-[10px] font-medium mb-1.5 uppercase tracking-wider">Posición Actual</div>
            <div className={`text-2xl font-bold ${getPositionColor(stats.position)}`}>
              #{stats.position}
            </div>
          </div>

          {/* Total Points */}
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-3 border border-slate-700/30 hover:border-slate-600/50 transition-all">
            <div className="text-slate-400 text-[10px] font-medium mb-1.5 uppercase tracking-wider">Puntos</div>
            <div className="text-2xl font-bold text-orange-400">{stats.total_points}</div>
          </div>

          {/* Best Position */}
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-3 border border-slate-700/30 hover:border-slate-600/50 transition-all">
            <div className="text-slate-400 text-[10px] font-medium mb-1.5 flex items-center gap-1 uppercase tracking-wider">
              <TrendingUp className="w-3 h-3" />
              Mejor Pos.
            </div>
            <div className="text-lg font-bold text-green-400">#{stats.best_position || '-'}</div>
          </div>

          {/* Worst Position */}
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-3 border border-slate-700/30 hover:border-slate-600/50 transition-all">
            <div className="text-slate-400 text-[10px] font-medium mb-1.5 flex items-center gap-1 uppercase tracking-wider">
              <TrendingDown className="w-3 h-3" />
              Peor Pos.
            </div>
            <div className="text-lg font-bold text-red-400">#{stats.worst_position || '-'}</div>
          </div>

          {/* Best Round */}
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-3 border border-slate-700/30 hover:border-slate-600/50 transition-all">
            <div className="text-slate-400 text-[10px] font-medium mb-1.5 uppercase tracking-wider">Mejor Jornada</div>
            <div className="text-base font-bold text-green-400">{stats.best_round} pts</div>
          </div>

          {/* Worst Round */}
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-3 border border-slate-700/30 hover:border-slate-600/50 transition-all">
            <div className="text-slate-400 text-[10px] font-medium mb-1.5 uppercase tracking-wider">Peor Jornada</div>
            <div className="text-base font-bold text-red-400">{stats.worst_round} pts</div>
          </div>

          {/* Average */}
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-3 col-span-2 border border-slate-700/30 hover:border-slate-600/50 transition-all">
            <div className="text-slate-400 text-[10px] font-medium mb-1.5 uppercase tracking-wider">Promedio por jornada</div>
            <div className="text-xl font-bold text-blue-400">{stats.average_points} pts</div>
          </div>
        </div>

        {/* Rounds played */}
        <div className="mt-4 text-slate-500 text-[10px] text-center font-medium tracking-wide">
          {stats.rounds_played} jornadas jugadas
        </div>
      </div>
    </div>
  );
}
