'use client';

import { Heart } from 'lucide-react';
import { Card } from '@/components/ui';
import { getColorForUser } from '@/lib/constants/colors';
import { useApiData } from '@/lib/hooks/useApiData';

/**
 * DraftFidelityCard — Stat B
 * Ranks users by total fantasy points accumulated from initial squad players
 * they have NEVER sold throughout the season.
 */
export default function DraftFidelityCard() {
  const { data, loading, error } = useApiData('/api/standings/initial-squad-stats');

  const retainedRanking = data?.retainedRanking ?? [];

  return (
    <Card title="Fidelidad al Reparto" icon={Heart} color="emerald" loading={loading}>
      {!loading && (
        <div className="space-y-4 pr-2 mt-2">
          <p className="text-xs text-slate-400 italic px-2">
            Puntos acumulados por jugadores del reparto que cada usuario nunca ha vendido
          </p>

          {error ? (
            <p className="text-red-400 text-center py-4 text-sm">{error}</p>
          ) : retainedRanking.length === 0 ? (
            <p className="text-slate-500 text-center py-4 text-sm">No hay datos disponibles</p>
          ) : (
            retainedRanking.map((user, index) => {
              const colors = getColorForUser(null, user.user_name, user.user_color_index);

              return (
                <div key={user.user_name} className="relative group">
                  <div className="absolute inset-0 bg-slate-800/30 rounded-lg -z-10" />
                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-xs border-2"
                          style={{
                            backgroundColor: colors.stroke,
                            borderColor: colors.fill,
                          }}
                        >
                          {user.user_name.substring(0, 2).toUpperCase()}
                        </div>
                        {index === 0 && (
                          <div className="absolute -top-2 -right-2 bg-emerald-500 text-white p-1 rounded-full shadow-lg">
                            <Heart size={12} />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-200">{user.user_name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {user.players_retained} jugador{user.players_retained !== 1 ? 'es' : ''}{' '}
                          conservado{user.players_retained !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="font-black text-2xl text-emerald-400">
                        {user.retained_points.toLocaleString()}
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
