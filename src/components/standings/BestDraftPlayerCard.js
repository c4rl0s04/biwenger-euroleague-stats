'use client';

import { Star, Trophy } from 'lucide-react';
import { Card } from '@/components/ui';
import { getColorForUser } from '@/lib/constants/colors';
import { useApiData } from '@/lib/hooks/useApiData';

/**
 * BestDraftPlayerCard — Stat A
 * For each user, shows their best-performing initial squad player.
 * Points are counted ONLY for rounds when that player was in their lineup.
 * Sorted by those points descending (so the user with the best pick is #1).
 */
export default function BestDraftPlayerCard() {
  const { data, loading, error } = useApiData('/api/standings/initial-squad-stats');

  const bestDraftPerUser = data?.bestDraftPerUser ?? [];

  return (
    <Card title="Mejor Jugador del Reparto" icon={Star} color="amber" loading={loading}>
      {!loading && (
        <div className="space-y-4 pr-2 mt-2">
          <p className="text-xs text-slate-400 italic px-2">
            El mejor jugador inicial de cada mánager, contando sólo los puntos que aportó mientras
            estuvo en su equipo
          </p>

          {error ? (
            <p className="text-red-400 text-center py-4 text-sm">{error}</p>
          ) : bestDraftPerUser.length === 0 ? (
            <p className="text-slate-500 text-center py-4 text-sm">No hay datos disponibles</p>
          ) : (
            bestDraftPerUser.map((user, index) => {
              const colors = getColorForUser(null, user.user_name, user.user_color_index);

              return (
                <div key={user.user_name} className="relative group">
                  <div className="absolute inset-0 bg-slate-800/30 rounded-lg -z-10" />
                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-xs border-2"
                          style={{ backgroundColor: colors.stroke, borderColor: colors.fill }}
                        >
                          {user.user_name.substring(0, 2).toUpperCase()}
                        </div>
                        {index === 0 && (
                          <div className="absolute -top-2 -right-2 bg-amber-500 text-white p-1 rounded-full shadow-lg">
                            <Trophy size={12} />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-200">{user.user_name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Star size={9} className="text-amber-400" fill="currentColor" />
                          {user.player_name}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="font-black text-2xl text-amber-400">
                        {(user.total_fantasy_points ?? 0).toLocaleString()}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-slate-500">
                        pts
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </Card>
  );
}
