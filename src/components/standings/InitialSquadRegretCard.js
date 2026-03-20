'use client';

import { Frown, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';
import StatsList from '@/components/ui/StatsList';

export default function InitialSquadRegretCard() {
  const { data, loading, error } = useApiData('/api/standings/initial-squad-stats');

  const regretRanking = data?.regretRanking ?? [];

  return (
    <Card title="El Arrepentimiento" icon={Frown} color="red" loading={loading}>
      {!loading && (
        <div className="flex flex-col h-full overflow-hidden">
          <p className="text-xs text-slate-400 italic px-2 mb-4 flex-shrink-0">
            Puntos generados por tus jugadores iniciales en las jornadas que ya NO te pertenecían
            (fueron vendidos al mercado o a otro mánager).
          </p>

          {error ? (
            <p className="text-red-400 text-center py-4 text-sm">{error}</p>
          ) : regretRanking.length === 0 ? (
            <p className="text-slate-500 text-center py-4 text-sm">No hay datos disponibles</p>
          ) : (
            <StatsList
              items={regretRanking.map((user) => ({
                ...user,
                name: user.user_name,
                color_index: user.user_color_index,
                user_id: null,
                subtitle: (
                  <span className="flex items-center gap-1">
                    <span className="text-red-400/80 italic">Top &quot;Pain&quot;:</span>
                    {user.top_regret_player}
                  </span>
                ),
              }))}
              renderRight={(user, index) => (
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2">
                    {index === 0 && <AlertTriangle size={14} className="text-red-500" />}
                    <span className="font-black text-2xl text-red-400 leading-none">
                      {(user.points_lost ?? 0).toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-1">
                    pts perdidos
                  </span>
                </div>
              )}
            />
          )}
        </div>
      )}
    </Card>
  );
}
