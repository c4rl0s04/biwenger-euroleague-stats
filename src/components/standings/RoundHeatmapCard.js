'use client';

import { useApiData } from '@/lib/hooks/useApiData';
import { Card } from '@/components/ui';
import { Grid } from 'lucide-react';
import Link from 'next/link';

export default function RoundHeatmapCard() {
  const { data, loading } = useApiData('/api/standings/advanced?type=heatmap');

  const getColor = (score) => {
    if (score === null) return 'bg-red-500/20 text-gray-500'; // Did not participate
    if (score >= 230) return 'bg-fuchsia-600 text-white shadow-[0_0_15px_rgba(192,38,211,0.6)] font-black border border-white/20'; // Top Tier
    if (score >= 210) return 'bg-purple-600 text-white shadow-[0_0_10px_rgba(147,51,234,0.4)] font-bold'; // Excellent
    if (score >= 190) return 'bg-indigo-600 text-white font-bold'; // Great
    if (score >= 170) return 'bg-blue-600 text-white'; // Above Average
    if (score >= 150) return 'bg-emerald-500 text-white'; // Average (160 falls here)
    if (score >= 130) return 'bg-yellow-500 text-white'; // Below Average
    if (score >= 110) return 'bg-orange-500 text-white'; // Low
    return 'bg-red-600 text-white'; // Lowest (< 110)
  };

  return (
    <Card title="Mapa de Calor (Heatmap)" icon={Grid} color="indigo" loading={loading} className="h-full">
      {!loading && data ? (
        <div className="w-full h-full flex flex-col">
          {/* Header Row (Users) */}
          {/* Header Row (Users) */}
          <div className="flex w-full mb-1 sticky top-0 bg-card z-30 py-1 border-none outline-none ring-0">
            <div className="w-12 flex-shrink-0 font-bold text-[10px] text-slate-400 flex items-end justify-center pb-1">
              Jor.
            </div>
            {data.users.map((user) => (
              <Link 
                key={user.id} 
                href={`/user/${user.id}`}
                className="flex-1 flex flex-col items-center gap-1 group min-w-0"
              >
                {user.icon ? (
                    <img src={user.icon} alt={user.name} className="w-5 h-5 rounded-full object-cover ring-2 ring-transparent group-hover:ring-indigo-500/50 transition-all" />
                ) : (
                    <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-300 group-hover:ring-2 group-hover:ring-indigo-500/50 transition-all">
                      {user.name.charAt(0)}
                    </div>
                )}
                <span className="text-[9px] font-medium text-slate-500 truncate w-full text-center group-hover:text-indigo-400 transition-colors px-0.5">
                  {user.name.slice(0, 3)}
                </span>
              </Link>
            ))}
          </div>

          {/* Round Rows */}
          <div className="space-y-0.5 flex-1">
            {data.rounds.map((round, roundIndex) => (
              <div key={round.id} className="flex w-full group hover:bg-white/5 rounded transition-colors items-center h-6">
                {/* Round Name */}
                <div className="w-12 flex-shrink-0 font-mono text-[9px] text-slate-500 text-center mr-1">
                  {round.name.replace('Jornada ', 'J')}
                </div>

                {/* User Scores */}
                {data.users.map((user) => {
                  const score = user.scores[roundIndex];
                  return (
                    <div 
                      key={`${round.id}-${user.id}`}
                      className="flex-1 h-full px-[1px]"
                    >
                      <div
                        className={`w-full h-full rounded-sm flex items-center justify-center text-[9px] font-medium transition-all ${getColor(score)} ${score !== null ? 'hover:scale-125 hover:z-20 cursor-default shadow-sm' : ''}`}
                      >
                        {score ?? ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ) : (
        !loading && <div className="text-center text-slate-500 py-8">Cargando datos...</div>
      )}
    </Card>
  );
}
