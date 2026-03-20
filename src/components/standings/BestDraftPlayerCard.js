'use client';

import { Star, Trophy } from 'lucide-react';
import { Card } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';
import StatsList from '@/components/ui/StatsList';

export default function BestDraftPlayerCard() {
  const { data, loading, error } = useApiData('/api/standings/initial-squad-stats');

  const bestDraftPerUser = data?.bestDraftPerUser ?? [];

  return (
    <Card title="Mejor Jugador del Reparto" icon={Star} color="amber" loading={loading}>
      {!loading && (
        <div className="flex flex-col h-full overflow-hidden">
          <p className="text-xs text-slate-300 font-medium italic px-2 mb-4 flex-shrink-0">
            El mejor jugador del reparto inicial para cada mánager, contando sólo los puntos reales
            que aportó mientras estuvo en su equipo.
          </p>

          {error ? (
            <p className="text-red-400 text-center py-4 text-sm">{error}</p>
          ) : bestDraftPerUser.length === 0 ? (
            <p className="text-slate-400 text-center py-4 text-sm">No hay datos disponibles</p>
          ) : (
            <StatsList
              items={bestDraftPerUser.map((user) => ({
                ...user,
                name: user.user_name,
                color_index: user.user_color_index,
                // user_id and icon are now provided by the updated API
                subtitle: (
                  <span className="flex items-center gap-1">
                    <Star size={9} className="text-amber-400" fill="currentColor" />
                    {user.player_name}
                  </span>
                ),
              }))}
              renderRight={(user, index) => (
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2">
                    {user.index === 0 && <Trophy size={14} className="text-amber-500" />}
                    <span className="font-black text-2xl text-amber-400 leading-none">
                      {(user.total_fantasy_points ?? 0).toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mt-1">
                    pts
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
