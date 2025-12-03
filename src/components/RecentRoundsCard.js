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
    <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 flex flex-col">
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-purple-500" />
        Últimas Jornadas
      </h2>

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
