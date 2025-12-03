'use client';

import { useUser } from '@/contexts/UserContext';
import { Activity } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function RecentRoundsCard() {
  const { currentUser } = useUser();
  const [rounds, setRounds] = useState(null);

  useEffect(() => {
    if (!currentUser) return;

    fetch(`/api/user-rounds?userId=${currentUser.id}`)
      .then(res => res.json())
      .then(d => d.success && setRounds(d.rounds));
  }, [currentUser]);

  if (!currentUser || !rounds) return null;

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-xl shadow-black/5 flex flex-col hover:border-slate-600/50 transition-all duration-300">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-bold text-white/90 flex items-center gap-2">
          <div className="p-1.5 bg-purple-500/10 rounded-lg">
            <Activity className="w-4 h-4 text-purple-500" />
          </div>
          Últimas Jornadas
        </h2>
      </div>

      <div className="space-y-1 flex-grow">
        {rounds.map((round, idx) => {
          const isRecent = idx < 3;
          return (
            <div 
              key={round.round_id} 
              className={`flex items-center justify-between py-1.5 px-2 rounded-lg transition-colors ${
                isRecent ? 'bg-slate-800/40' : 'bg-slate-800/20'
              } hover:bg-slate-800/60`}
            >
              <div className="flex items-center gap-2">
                <div className={`text-xs font-mono ${isRecent ? 'text-slate-300' : 'text-slate-500'}`}>
                  {round.round_name}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`font-medium text-sm ${isRecent ? 'text-white' : 'text-slate-400'}`}>
                  {round.points}
                </div>
                <div className="min-w-[35px] text-right">
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                    round.position === 1 
                      ? 'bg-yellow-500/20 text-yellow-400' 
                      : round.position <= 3 
                      ? 'bg-orange-500/20 text-orange-400' 
                      : 'bg-slate-700/50 text-slate-400'
                  }`}>
                    #{round.position}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
