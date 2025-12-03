'use client';

import { useUser } from '@/contexts/UserContext';
import { BarChart3 } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function LeagueComparisonCard() {
  const { currentUser } = useUser();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!currentUser) return;

    Promise.all([
      fetch(`/api/user-stats?userId=${currentUser.id}`).then(r => r.json()),
      fetch('/api/league-average').then(r => r.json())
    ]).then(([userRes, avgRes]) => {
      if (userRes.success && avgRes.success) {
        setData({
          userAvg: userRes.stats.average_points,
          leagueAvg: avgRes.average
        });
      }
    });
  }, [currentUser]);

  if (!currentUser || !data) return null;

  const difference = data.userAvg - data.leagueAvg;
  const percentage = data.leagueAvg > 0 ? Math.round((difference / data.leagueAvg) * 100) : 0;

  return (
    <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6">
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-cyan-500" />
        vs Liga
      </h2>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="text-slate-400 text-sm">Tu promedio</div>
          <div className="text-xl font-bold text-orange-500">{data.userAvg} pts</div>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-slate-400 text-sm">Promedio Liga</div>
          <div className="text-xl font-bold text-slate-300">{data.leagueAvg} pts</div>
        </div>

        <div className="pt-3 border-t border-slate-800">
          <div className="flex justify-between items-center">
            <div className="text-slate-400 text-sm">Diferencia</div>
            <div className={`text-2xl font-bold ${difference >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {difference >= 0 ? '+' : ''}{difference.toFixed(1)} pts
            </div>
          </div>
          <div className={`text-right text-sm mt-1 ${percentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ({percentage >= 0 ? '+' : ''}{percentage}%)
          </div>
        </div>
      </div>
    </div>
  );
}
