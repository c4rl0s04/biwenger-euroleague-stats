'use client';

import { useClientUser } from '@/lib/hooks/useClientUser';
import { Target, Crown } from 'lucide-react';
import { PremiumCard } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';

export default function LeaderGapCard() {
  const { currentUser, isReady } = useClientUser();

  const { data, loading } = useApiData(
    () => (currentUser ? `/api/dashboard/leader-gap?userId=${currentUser.id}` : null),
    {
      dependencies: [currentUser?.id],
      skip: !currentUser,
    }
  );

  if (!isReady) return null;

  if (loading) {
    return <PremiumCard loading={true} className="card-glow" />;
  }

  // If data failed to load, show empty state
  if (!data) {
    return (
      <PremiumCard title="A la Caza del Líder" icon={Target} color="emerald" className="card-glow">
        <div className="text-center text-slate-500 py-4">No hay datos disponibles</div>
      </PremiumCard>
    );
  }

  if (data.is_leader) {
    return (
      <PremiumCard title="Líder de la Liga" icon={Crown} color="yellow" className="card-glow">
        <div className="grid grid-cols-2 gap-3 flex-1">
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-3 border border-slate-700/30 hover:border-yellow-500/30 transition-all flex flex-col justify-center">
            <div className="text-slate-400 text-[10px] font-medium mb-1 uppercase tracking-wider">
              Tus Puntos
            </div>
            <div className="text-2xl font-bold text-yellow-400">{data.user_points}</div>
          </div>

          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-3 border border-slate-700/30 hover:border-yellow-500/30 transition-all flex flex-col justify-center">
            <div className="text-slate-400 text-[10px] font-medium mb-1 uppercase tracking-wider">
              Ventaja
            </div>
            <div className="text-2xl font-bold text-green-400">+{data.gap_to_second || 0}</div>
          </div>
        </div>

        <div className="mt-3 text-slate-400 text-xs text-center font-medium">
          Mantén el ritmo para ganar la liga
        </div>
      </PremiumCard>
    );
  }

  // Not leader view
  return (
    <PremiumCard title="A la Caza del Líder" icon={Target} color="emerald" className="card-glow">
      <div className="space-y-3 flex-1">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-3 border border-slate-700/30 hover:border-yellow-500/30 transition-all">
            <div className="text-slate-400 text-[10px] font-medium mb-1 uppercase tracking-wider">
              Líder: {data.leader_name}
            </div>
            <div className="text-xl font-bold text-white">{data.leader_points} pts</div>
          </div>

          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-3 border border-slate-700/30 hover:border-yellow-500/30 transition-all">
            <div className="text-slate-400 text-[10px] font-medium mb-1 uppercase tracking-wider">
              Tú
            </div>
            <div className="text-xl font-bold text-yellow-500">{data.user_points} pts</div>
          </div>
        </div>

        <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-3 border border-slate-700/30 hover:border-yellow-500/30 transition-all">
          <div className="text-slate-400 text-[10px] font-medium mb-1 uppercase tracking-wider">
            Distancia
          </div>
          <div className="text-2xl font-bold text-red-400 mb-1">-{data.gap} pts</div>
          <div className="text-slate-500 text-[10px]">
            ~{data.rounds_needed} {data.rounds_needed === 1 ? 'jornada' : 'jornadas'} (estimado:
            +10pts/jornada)
          </div>
        </div>
      </div>
    </PremiumCard>
  );
}
