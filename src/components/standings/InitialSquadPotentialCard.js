'use client';

import { Zap, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui';
import { getColorForUser } from '@/lib/constants/colors';
import { useApiData } from '@/lib/hooks/useApiData';

/**
 * InitialSquadPotentialCard — "Potencial del Reparto"
 * Shows the total points and current market value of the initial draft players.
 */
export default function InitialSquadPotentialCard() {
  const { data, loading, error } = useApiData('/api/standings/initial-squad-stats');

  const potentialRanking = data?.potentialRanking ?? [];

  return (
    <Card title="Potencial del Reparto" icon={Zap} color="sky" loading={loading}>
      {!loading && (
        <div className="space-y-4 pr-2 mt-2">
          <p className="text-xs text-slate-400 italic px-2">
            Rendimiento total histórico y valor de mercado actual de tus 10-12 jugadores iniciales
            (hayan sido vendidos o no).
          </p>

          {error ? (
            <p className="text-red-400 text-center py-4 text-sm">{error}</p>
          ) : potentialRanking.length === 0 ? (
            <p className="text-slate-500 text-center py-4 text-sm">No hay datos disponibles</p>
          ) : (
            potentialRanking.map((user, index) => {
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
                          <div className="absolute -top-2 -right-2 bg-sky-500 text-white p-1 rounded-full shadow-lg">
                            <Sparkles size={12} />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-200">{user.user_name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Valor: {(user.total_value / 1000000).toFixed(1)}M €
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="font-black text-2xl text-sky-400">
                        {(user.total_points ?? 0).toLocaleString()}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-slate-500">
                        pts totales
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
