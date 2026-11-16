'use client';

import { Dna, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';
import { ManagerStatList } from '@/lib/competition/ui';

export default function InitialSquadLoyaltyCard() {
  const { data, loading, error } = useApiData('/api/standings/initial-squad-stats');

  const loyaltyRanking = data?.loyaltyRanking ?? [];

  return (
    <Card title="Fidelidad al ADN" icon={Dna} color="indigo" loading={loading}>
      {!loading && (
        <div className="flex flex-col h-full overflow-hidden">
          <p className="text-xs text-muted-foreground font-medium italic px-2 mb-4 flex-shrink-0">
            ¿Cuánto confías en tu equipo inicial? Porcentaje de jugadores del reparto original que
            aún mantienes en tu plantilla.
          </p>

          {error ? (
            <p className="text-[color-mix(in_srgb,var(--color-red-400)_55%,hsl(var(--content-primary)))] text-center py-4 text-sm">
              {error}
            </p>
          ) : loyaltyRanking.length === 0 ? (
            <p className="text-muted-foreground text-center py-4 text-sm">
              No hay datos disponibles
            </p>
          ) : (
            <ManagerStatList
              getKey={(user) => user.user_id}
              getIdentity={(user) => ({
                id: user.user_id ?? null,
                name: user.name,
                icon: user.icon,
                colorIndex: user.color_index,
                subtitle: user.subtitle,
              })}
              items={loyaltyRanking.map((user) => ({
                ...user,
                name: user.user_name,
                color_index: user.user_color_index,
                // user_id and icon are now provided by the updated API
                subtitle: `${user.retained_count} de ${user.initial_count} jugadores iniciales`,
              }))}
              renderMetric={(user, index) => (
                <div className="flex flex-col items-end shrink-0 w-24">
                  <div className="flex items-center gap-2">
                    {index === 0 && <ShieldCheck size={14} className="text-indigo-500" />}
                    <div className="flex items-baseline gap-0.5">
                      <span className="font-black text-2xl text-indigo-400 leading-none">
                        {user.loyalty_percentage}
                      </span>
                      <span className="text-xs font-bold text-indigo-500 leading-none">%</span>
                    </div>
                  </div>
                  <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                      style={{ width: `${user.loyalty_percentage}%` }}
                    />
                  </div>
                </div>
              )}
            />
          )}
        </div>
      )}
    </Card>
  );
}
