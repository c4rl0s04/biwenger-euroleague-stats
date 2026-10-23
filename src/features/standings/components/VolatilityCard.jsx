'use client';

import React from 'react';

import { useApiData } from '@/lib/hooks/useApiData';
import { Card } from '@/components/ui';
import { Waves } from 'lucide-react';
import { ManagerIdentity } from '@/lib/competition/ui';

export default function VolatilityCard() {
  const { data = [], loading } = useApiData('/api/standings/advanced?type=volatility');
  const maxVol = data.length > 0 ? Math.max(...data.map((user) => user.std_dev)) : 0;
  return (
    <Card
      title="Montaña Rusa (Volatilidad)"
      icon={Waves}
      color="pink"
      loading={loading}
      tooltip="Desviación Estándar de los puntos. Valores altos indican rendimiento impredecible; bajos indican consistencia."
    >
      {!loading && data.length > 0 ? (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground italic">
            Mide la regularidad. Valores altos indican resultados impredecibles, valores bajos
            indican consistencia.
          </p>
          <ol className="m-0 list-none divide-y divide-border/50 p-0" data-stat-list="volatility">
            {data.slice(0, 10).map((user, index) => (
              <li key={user.user_id ?? index} className="space-y-2 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="w-5 shrink-0 text-xs text-muted-foreground">{index + 1}</span>
                  <ManagerIdentity
                    manager={{
                      id: user.user_id ?? null,
                      name: user.name,
                      icon: user.icon,
                      colorIndex: user.color_index,
                    }}
                  />
                  <div className="ml-auto shrink-0 text-right">
                    <span className="text-sm font-bold text-foreground">{user.std_dev}</span>
                    <span className="block text-xs text-muted-foreground">
                      Media: {user.avg_points}
                    </span>
                  </div>
                </div>
                <div className="h-1 rounded-full bg-secondary" aria-hidden="true">
                  <div
                    className="h-full rounded-full bg-pink-500"
                    style={{ width: `${maxVol ? (user.std_dev / maxVol) * 100 : 0}%` }}
                  />
                </div>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        !loading && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Calculando volatilidad...
          </p>
        )
      )}
    </Card>
  );
}
