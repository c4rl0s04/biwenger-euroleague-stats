'use client';

import { Users, User, Shield, Info } from 'lucide-react';
import { Card } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';

/**
 * InitialSquadListCard — Detailed view of all initial squads.
 * Displays manager names and their 10-12 original players.
 */
export default function InitialSquadListCard() {
  const { data, loading, error } = useApiData('/api/standings/initial-squad-stats');

  const detailedSquads = data?.detailedSquads ?? [];

  // Group by manager
  const squadsByManager = detailedSquads.reduce((acc, player) => {
    if (!acc[player.manager_name]) {
      acc[player.manager_name] = [];
    }
    acc[player.manager_name].push(player);
    return acc;
  }, {});

  const managers = Object.keys(squadsByManager).sort();

  return (
    <Card
      title="Plantillas Iniciales Detalladas"
      icon={Users}
      color="slate"
      loading={loading}
      className="col-span-1 md:col-span-2 lg:col-span-3"
    >
      {!loading && (
        <div className="mt-4 overflow-hidden">
          {error ? (
            <p className="text-red-400 text-center py-8 text-sm">{error}</p>
          ) : managers.length === 0 ? (
            <p className="text-slate-500 text-center py-8 text-sm">No hay datos disponibles</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {managers.map((manager) => (
                <div
                  key={manager}
                  className="flex flex-col bg-slate-800/20 rounded-xl border border-slate-800 overflow-hidden"
                >
                  <div className="bg-slate-800/50 px-4 py-3 border-b border-slate-800">
                    <h3 className="font-bold text-slate-200 flex items-center gap-2">
                      <User size={16} className="text-slate-400" />
                      {manager}
                    </h3>
                  </div>

                  <div className="p-3 divide-y divide-slate-800/50">
                    {squadsByManager[manager].map((player, idx) => {
                      const isStillOwned = player.current_owner === manager;

                      return (
                        <div
                          key={`${manager}-${player.player_name}-${idx}`}
                          className="py-2 flex items-center justify-between group"
                        >
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-semibold text-slate-300 truncate group-hover:text-white transition-colors">
                              {player.player_name}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[9px] uppercase font-black text-slate-500 bg-slate-900/50 px-1 rounded">
                                {player.player_position}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {player.current_points} pts •{' '}
                                {(player.current_price / 1000000).toFixed(1)}M
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center">
                            {isStillOwned ? (
                              <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-500/80 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                <Shield size={10} />
                                <span className="hidden sm:inline">LEAL</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500 bg-slate-900/50 px-1.5 py-0.5 rounded border border-slate-700/30">
                                <span className="truncate max-w-[50px]">
                                  {player.current_owner || 'Mercado'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
