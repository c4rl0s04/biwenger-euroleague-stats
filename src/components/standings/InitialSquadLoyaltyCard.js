'use client';

import { Dna, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui';
import { getColorForUser } from '@/lib/constants/colors';
import { useApiData } from '@/lib/hooks/useApiData';

/**
 * InitialSquadLoyaltyCard — "Fidelidad al ADN"
 * Ranks users by the percentage of their initial squad players still owned.
 */
export default function InitialSquadLoyaltyCard() {
  const { data, loading, error } = useApiData('/api/standings/initial-squad-stats');

  const loyaltyRanking = data?.loyaltyRanking ?? [];

  return (
    <Card title="Fidelidad al ADN" icon={Dna} color="indigo" loading={loading}>
      {!loading && (
        <div className="space-y-4 pr-2 mt-2">
          <p className="text-xs text-slate-400 italic px-2">
            ¿Cuánto confías en tu equipo inicial? Porcentaje de jugadores del reparto original que
            aún mantienes en tu plantilla.
          </p>

          {error ? (
            <p className="text-red-400 text-center py-4 text-sm">{error}</p>
          ) : loyaltyRanking.length === 0 ? (
            <p className="text-slate-500 text-center py-4 text-sm">No hay datos disponibles</p>
          ) : (
            loyaltyRanking.map((user, index) => {
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
                          <div className="absolute -top-2 -right-2 bg-indigo-500 text-white p-1 rounded-full shadow-lg">
                            <ShieldCheck size={12} />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-200">{user.user_name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {user.retained_count} de {user.initial_count} jugadores iniciales
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <div className="flex items-baseline gap-1">
                        <span className="font-black text-2xl text-indigo-400">
                          {user.loyalty_percentage}
                        </span>
                        <span className="text-sm font-bold text-indigo-500">%</span>
                      </div>
                      <div className="w-20 h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
                        <div
                          className="h-full bg-indigo-500"
                          style={{ width: `${user.loyalty_percentage}%` }}
                        />
                      </div>
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
