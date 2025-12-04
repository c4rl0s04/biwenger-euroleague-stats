'use client';

import { useUser } from '@/contexts/UserContext';
import { Target, Crown } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function LeaderGapCard() {
  const { currentUser } = useUser();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!currentUser) return;

    fetch(`/api/leader-gap?userId=${currentUser.id}`)
      .then(res => res.json())
      .then(d => d.success && setData(d.data));
  }, [currentUser]);

  if (!currentUser || !data) return null;

  if (data.is_leader) {
    return (
      <div className="bg-gradient-to-br from-yellow-900/30 to-slate-900 backdrop-blur-md border border-yellow-700/50 rounded-2xl p-6 shadow-xl shadow-black/5 hover:border-yellow-600/50 transition-all">
        <h2 className="text-base font-bold text-white/90 mb-4 flex items-center gap-2">
          <div className="p-1.5 bg-yellow-500/10 rounded-lg">
            <Crown className="w-4 h-4 text-yellow-500" />
          </div>
          Líder de la Liga
        </h2>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-3 border border-slate-700/30">
            <div className="text-slate-400 text-[10px] font-medium mb-1 uppercase tracking-wider">Tus Puntos</div>
            <div className="text-2xl font-bold text-yellow-400">{data.user_points}</div>
          </div>
          
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-3 border border-slate-700/30">
            <div className="text-slate-400 text-[10px] font-medium mb-1 uppercase tracking-wider">Ventaja</div>
            <div className="text-2xl font-bold text-green-400">+{data.gap_to_second || 0}</div>
          </div>
        </div>

        <div className="mt-3 text-slate-400 text-xs text-center">
          Mantén el ritmo para ganar la liga
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl shadow-black/5 hover:border-slate-600/50 transition-all">
      <h2 className="text-base font-bold text-white/90 mb-4 flex items-center gap-2">
        <div className="p-1.5 bg-blue-500/10 rounded-lg">
          <Target className="w-4 h-4 text-blue-500" />
        </div>
        Diferencia con Líder
      </h2>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-3 border border-slate-700/30">
            <div className="text-slate-400 text-[10px] font-medium mb-1 uppercase tracking-wider">Líder: {data.leader_name}</div>
            <div className="text-xl font-bold text-white">{data.leader_points} pts</div>
          </div>

          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-3 border border-slate-700/30">
            <div className="text-slate-400 text-[10px] font-medium mb-1 uppercase tracking-wider">Tú</div>
            <div className="text-xl font-bold text-orange-500">{data.user_points} pts</div>
          </div>
        </div>

        <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-3 border border-slate-700/30">
          <div className="text-slate-400 text-[10px] font-medium mb-1 uppercase tracking-wider">Distancia</div>
          <div className="text-2xl font-bold text-red-400 mb-1">-{data.gap} pts</div>
          <div className="text-slate-500 text-[10px]">
            ~{data.rounds_needed} {data.rounds_needed === 1 ? 'jornada' : 'jornadas'} (estimado: +10pts/jornada)
          </div>
        </div>
      </div>
    </div>
  );
}
