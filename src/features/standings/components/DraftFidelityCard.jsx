'use client';

import React from 'react';

import { Heart, Info } from 'lucide-react';
import { Card } from '@/components/ui';
import { Popover } from '@/components/ui/foundation';
import { ManagerIdentity } from '@/lib/competition/ui';
import { useApiData } from '@/lib/hooks/useApiData';

export default function DraftFidelityCard() {
  const { data, loading, error } = useApiData('/api/standings/initial-squad-stats');
  const retainedRanking = data?.retainedRanking ?? [];
  const retainedBreakdown = data?.retainedBreakdown ?? [];
  return (
    <Card title="Rendimiento del Reparto" icon={Heart} color="emerald" loading={loading}>
      {!loading && (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-muted-foreground font-medium italic">
            Puntos totales aportados por los jugadores del reparto inicial (puntos reales, sin
            ponderar por posición).
          </p>
          {error ? (
            <p className="text-red-500 text-center py-4 text-sm">{error}</p>
          ) : retainedRanking.length === 0 ? (
            <p className="text-muted-foreground text-center py-4 text-sm">
              No hay datos disponibles
            </p>
          ) : (
            <ol
              className="m-0 list-none divide-y divide-border/50 p-0"
              data-stat-list="draft-breakdown"
            >
              {retainedRanking.map((user, index) => {
                const breakdown = retainedBreakdown.filter(
                  (player) => player.user_name === user.user_name
                );
                return (
                  <li key={user.user_id ?? index} className="space-y-2 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="w-5 shrink-0 text-xs text-muted-foreground">
                        {index + 1}
                      </span>
                      <ManagerIdentity
                        manager={{
                          id: user.user_id ?? null,
                          name: user.user_name,
                          icon: user.icon,
                          colorIndex: user.user_color_index,
                        }}
                      />
                      <div className="ml-auto shrink-0 text-right tabular-nums">
                        <span className="text-xl font-bold text-foreground">
                          {(user.total_points ?? 0).toLocaleString()}
                        </span>
                        <span className="block text-xs text-muted-foreground">pts</span>
                      </div>
                    </div>
                    <Popover
                      label={`Aportación por jugador de ${user.user_name}`}
                      className="flex min-h-11 items-center gap-2 text-xs text-muted-foreground"
                      trigger={
                        <>
                          <Info size={14} />
                          {user.players_contributed} jugador
                          {user.players_contributed !== 1 ? 'es' : ''} del reparto
                        </>
                      }
                    >
                      <h3 className="font-sans! text-sm font-semibold normal-case!">
                        Aportación por Jugador
                      </h3>
                      {breakdown.length ? (
                        <ul className="mt-2 space-y-2">
                          {breakdown.map((player) => (
                            <li
                              key={player.player_name}
                              className="flex justify-between gap-3 text-xs"
                            >
                              <span>{player.player_name}</span>
                              <span className="shrink-0 tabular-nums">
                                {player.points.toLocaleString()} pts
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>No hay desglose disponible.</p>
                      )}
                    </Popover>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}
    </Card>
  );
}
