'use client';

import { useUser } from '@/contexts/UserContext';
import { Target } from 'lucide-react';
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
      <div className="bg-gradient-to-br from-yellow-900/30 to-slate-900 backdrop-blur-md border border-yellow-700/50 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-yellow-400 mb-4 flex items-center gap-2">
          👑 ¡Eres el Líder!
        </h2>
        <div className="text-slate-300 text-sm">
          Mantén el ritmo para ganar la liga
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6">
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Target className="w-5 h-5 text-blue-500" />
        Diferencia con Líder
      </h2>

      <div className="space-y-3">
        <div>
          <div className="text-slate-400 text-xs mb-1">Líder: {data.leader_name}</div>
          <div className="text-xl font-bold text-white">{data.leader_points} pts</div>
        </div>

        <div>
          <div className="text-slate-400 text-xs mb-1">Tú</div>
          <div className="text-xl font-bold text-orange-500">{data.user_points} pts</div>
        </div>

        <div className="pt-2 border-t border-slate-800">
          <div className="text-slate-400 text-xs mb-1">Diferencia</div>
          <div className="text-2xl font-bold text-red-400">-{data.gap} pts</div>
          <div className="text-slate-500 text-xs mt-1">
            Necesitas ~{data.rounds_needed} buenas jornadas
          </div>
        </div>
      </div>
    </div>
  );
}
