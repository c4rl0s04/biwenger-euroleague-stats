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
      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-1/2 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-slate-800 rounded"></div>
          <div className="h-4 bg-slate-800 rounded"></div>
          <div className="h-4 bg-slate-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const getPositionColor = (pos) => {
    if (pos === 1) return 'text-yellow-400';
    if (pos <= 3) return 'text-orange-400';
    return 'text-slate-400';
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800/50 backdrop-blur-md border border-slate-700 rounded-2xl p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Trophy className="w-24 h-24 text-orange-500" />
      </div>

      <div className="relative">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-orange-500" />
          Tu Temporada
        </h2>

        <div className="grid grid-cols-2 gap-3">
          {/* Position */}
          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="text-slate-400 text-xs mb-1">Posición Actual</div>
            <div className={`text-2xl font-bold ${getPositionColor(stats.position)}`}>
              #{stats.position}
            </div>
          </div>

          {/* Total Points */}
          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="text-slate-400 text-xs mb-1">Puntos</div>
            <div className="text-2xl font-bold text-orange-500">{stats.total_points}</div>
          </div>

          {/* Best Position */}
          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="text-slate-400 text-xs mb-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Mejor Pos.
            </div>
            <div className="text-lg font-bold text-green-400">#{stats.best_position || '-'}</div>
          </div>

          {/* Worst Position */}
          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="text-slate-400 text-xs mb-1 flex items-center gap-1">
              <TrendingDown className="w-3 h-3" />
              Peor Pos.
            </div>
            <div className="text-lg font-bold text-red-400">#{stats.worst_position || '-'}</div>
          </div>

          {/* Best Round */}
          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="text-slate-400 text-xs mb-1">Mejor Jornada</div>
            <div className="text-base font-bold text-green-400">{stats.best_round} pts</div>
          </div>

          {/* Worst Round */}
          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="text-slate-400 text-xs mb-1">Peor Jornada</div>
            <div className="text-base font-bold text-red-400">{stats.worst_round} pts</div>
          </div>

          {/* Average */}
          <div className="bg-slate-800/50 rounded-lg p-3 col-span-2">
            <div className="text-slate-400 text-xs mb-1">Promedio por jornada</div>
            <div className="text-xl font-bold text-blue-400">{stats.average_points} pts</div>
          </div>
        </div>

        {/* Rounds played */}
        <div className="mt-4 text-slate-500 text-xs text-center">
          {stats.rounds_played} jornadas jugadas
        </div>
      </div>
    </div>
  );
}
