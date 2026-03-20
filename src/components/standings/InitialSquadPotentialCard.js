'use client';

import { Zap, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';
import StatsList from '@/components/ui/StatsList';

export default function InitialSquadPotentialCard() {
  const { data, loading, error } = useApiData('/api/standings/initial-squad-stats');

  const potentialRanking = data?.potentialRanking ?? [];

  return (
    <Card title="Potencial del Reparto" icon={Zap} color="sky" loading={loading}>
      {!loading && (
        <div className="flex flex-col h-full overflow-hidden">
          <p className="text-xs text-slate-400 italic px-2 mb-4 flex-shrink-0">
            Rendimiento total histórico y valor de mercado actual de tus jugadores iniciales (hayan
            sido vendidos o no).
          </p>

          {error ? (
            <p className="text-red-400 text-center py-4 text-sm">{error}</p>
          ) : potentialRanking.length === 0 ? (
            <p className="text-slate-500 text-center py-4 text-sm">No hay datos disponibles</p>
          ) : (
            <StatsList
              items={potentialRanking.map((user) => ({
                ...user,
                name: user.user_name,
                color_index: user.user_color_index,
                user_id: null,
                subtitle: `Valor: ${(user.total_value / 1000000).toFixed(1)}M €`,
              }))}
              renderRight={(user, index) => (
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2">
                    {index === 0 && <Sparkles size={14} className="text-sky-500" />}
                    <span className="font-black text-2xl text-sky-400 leading-none">
                      {(user.total_points ?? 0).toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-1">
                    pts totales
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
