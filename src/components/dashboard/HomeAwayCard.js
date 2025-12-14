'use client';

import { useUser } from '@/contexts/UserContext';
import { Home } from 'lucide-react';
import { useEffect, useState } from 'react';
import PremiumCard from '@/components/ui/PremiumCard';

export default function HomeAwayCard() {
  const { currentUser } = useUser();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    fetch(`/api/home-away?userId=${currentUser.id}`)
      .then(res => res.json())
      .then(d => {
        if (d.success) setStats(d.stats);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching home/away stats:', err);
        setLoading(false);
      });
  }, [currentUser]);

  if (!currentUser) return null;

  return (
    <PremiumCard
      title="Casa vs Fuera"
      icon={Home}
      color="orange"
      loading={loading}
    >
      {!loading && stats && (
        <div className="grid grid-cols-2 gap-4 flex-1">
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-3 border border-slate-700/30 hover:border-cyan-500/30 transition-all flex flex-col justify-center">
            <div className="text-slate-400 text-xs mb-1 font-medium">🏠 Casa</div>
            <div className="text-xl font-bold text-white">{stats.total_home} pts</div>
            <div className="text-slate-500 text-xs">Avg: {stats.avg_home}</div>
          </div>

          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-3 border border-slate-700/30 hover:border-cyan-500/30 transition-all flex flex-col justify-center">
            <div className="text-slate-400 text-xs mb-1 font-medium">✈️ Fuera</div>
            <div className="text-xl font-bold text-white">{stats.total_away} pts</div>
            <div className="text-slate-500 text-xs">Avg: {stats.avg_away}</div>
          </div>

          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-3 col-span-2 border border-slate-700/30 hover:border-cyan-500/30 transition-all flex flex-col justify-center">
            <div className="text-slate-400 text-xs mb-1 font-medium">Diferencia de Rendimiento</div>
            <div className={`text-2xl font-bold ${stats.difference_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.difference_pct >= 0 ? '+' : ''}{stats.difference_pct}%
            </div>
          </div>
        </div>
      )}
    </PremiumCard>
  );
}
