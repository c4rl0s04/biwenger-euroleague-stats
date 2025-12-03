'use client';

import { useUser } from '@/contexts/UserContext';
import { Home } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function HomeAwayCard() {
  const { currentUser } = useUser();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!currentUser) return;

    fetch(`/api/home-away?userId=${currentUser.id}`)
      .then(res => res.json())
      .then(d => d.success && setStats(d.stats));
  }, [currentUser]);

  if (!currentUser || !stats) return null;

  return (
    <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6">
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Home className="w-5 h-5 text-purple-500" />
        Casa vs Fuera
      </h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-slate-400 text-xs mb-1">🏠 Casa</div>
          <div className="text-xl font-bold text-green-400">{stats.total_home} pts</div>
          <div className="text-slate-500 text-xs">Avg: {stats.avg_home}</div>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-slate-400 text-xs mb-1">✈️ Fuera</div>
          <div className="text-xl font-bold text-blue-400">{stats.total_away} pts</div>
          <div className="text-slate-500 text-xs">Avg: {stats.avg_away}</div>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-3 col-span-2">
          <div className="text-slate-400 text-xs mb-1">Diferencia</div>
          <div className={`text-2xl font-bold ${stats.difference_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {stats.difference_pct >= 0 ? '+' : ''}{stats.difference_pct}%
          </div>
        </div>
      </div>
    </div>
  );
}
