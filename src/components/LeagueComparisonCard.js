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
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl shadow-black/5 hover:border-slate-600/50 transition-all">
      <h2 className="text-base font-bold text-white/90 mb-4 flex items-center gap-2">
        <div className="p-1.5 bg-cyan-500/10 rounded-lg">
          <BarChart3 className="w-4 h-4 text-cyan-500" />
        </div>
        vs Liga
      </h2>

      <div className="space-y-3">
        {/* User vs League averages in grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-3 border border-slate-700/30">
            <div className="text-slate-400 text-[10px] font-medium mb-1 uppercase tracking-wider">Tu Promedio</div>
            <div className="text-xl font-bold text-orange-500">{data.userAvg}</div>
          </div>
          
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-3 border border-slate-700/30">
            <div className="text-slate-400 text-[10px] font-medium mb-1 uppercase tracking-wider">Promedio Liga</div>
            <div className="text-xl font-bold text-slate-300">{data.leagueAvg}</div>
          </div>
        </div>
        
        {/* Difference - compact single box */}
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-3 border border-slate-700/30">
          <div className="flex items-baseline justify-between">
            <span className="text-slate-400 text-[10px] font-medium uppercase tracking-wider">Diferencia</span>
            <div className="text-right">
              <span className={`text-2xl font-bold ${difference >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {difference >= 0 ? '+' : ''}{difference.toFixed(1)}
              </span>
              <span className={`text-sm ml-2 ${percentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ({percentage >= 0 ? '+' : ''}{percentage}%)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
