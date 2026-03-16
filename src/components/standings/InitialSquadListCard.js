'use client';

import { Users, Shield, Award, TrendingUp, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';
import { motion } from 'framer-motion';

const USER_COLORS = [
  'from-blue-500 to-cyan-400',
  'from-purple-500 to-pink-400',
  'from-amber-500 to-orange-400',
  'from-emerald-500 to-teal-400',
  'from-rose-500 to-red-400',
  'from-indigo-500 to-blue-400',
  'from-orange-500 to-yellow-400',
  'from-pink-500 to-rose-400',
  'from-cyan-500 to-blue-400',
  'from-teal-500 to-emerald-400',
];

const POSITION_COLORS = {
  G: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  F: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  C: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
};

const POSITION_LABELS = {
  G: 'Guard',
  F: 'Forward',
  C: 'Center',
};

export default function InitialSquadListCard() {
  const { data, loading, error } = useApiData('/api/standings/initial-squad-stats');

  const detailedSquads = data?.detailedSquads ?? [];

  // Group by manager with color info
  const squadsByManager = detailedSquads.reduce((acc, player) => {
    if (!acc[player.manager_name]) {
      acc[player.manager_name] = {
        name: player.manager_name,
        colorIndex: player.manager_color_index,
        players: [],
      };
    }
    acc[player.manager_name].players.push(player);
    return acc;
  }, {});

  const managers = Object.values(squadsByManager).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Card
      title="Análisis Detallado de Repartos Iniciales"
      icon={Users}
      color="slate"
      loading={loading}
      className="col-span-1 md:col-span-2 lg:col-span-3 overflow-visible"
    >
      {!loading && (
        <div className="mt-6">
          {error ? (
            <p className="text-red-400 text-center py-12 text-sm bg-red-400/5 rounded-2xl border border-red-400/10">
              {error}
            </p>
          ) : managers.length === 0 ? (
            <p className="text-slate-500 text-center py-12 text-sm bg-slate-800/20 rounded-2xl">
              No hay datos disponibles
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
              {managers.map((manager, mIdx) => {
                const managerColor = USER_COLORS[manager.colorIndex % USER_COLORS.length];

                return (
                  <motion.div
                    key={manager.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: mIdx * 0.05 }}
                    className="flex flex-col bg-slate-900/40 rounded-2xl border border-slate-800 overflow-hidden hover:border-slate-700/50 transition-all duration-300 group shadow-lg shadow-black/20"
                  >
                    {/* Header with Manager Color */}
                    <div className={`bg-gradient-to-r ${managerColor} p-4 pb-12`}>
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-white text-lg flex items-center gap-2 drop-shadow-md">
                          <Award size={20} className="text-white/80" />
                          {manager.name}
                        </h3>
                        <div className="bg-white/20 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-black text-white uppercase tracking-wider shadow-inner">
                          {manager.players.length} JUGADORES
                        </div>
                      </div>
                    </div>

                    {/* Content overlapping header */}
                    <div className="px-4 -mt-8 mb-4 flex-grow">
                      <div className="bg-slate-900/90 backdrop-blur-xl rounded-xl border border-white/5 p-4 shadow-xl space-y-4">
                        {/* Summary Stats for this Manager */}
                        <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-800/50">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter flex items-center gap-1">
                              <TrendingUp size={10} /> Pts Totales
                            </span>
                            <span className="text-sm font-black text-slate-200">
                              {manager.players
                                .reduce((sum, p) => sum + p.current_points, 0)
                                .toLocaleString()}{' '}
                              <span className="text-[10px] font-medium text-slate-500 uppercase">
                                pts
                              </span>
                            </span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter flex items-center gap-1">
                              <DollarSign size={10} /> Valor Draft
                            </span>
                            <span className="text-sm font-black text-emerald-400">
                              {(
                                manager.players.reduce((sum, p) => sum + p.current_price, 0) /
                                1000000
                              ).toFixed(1)}
                              M
                            </span>
                          </div>
                        </div>

                        {/* Player List organized by position */}
                        <div className="space-y-3 pt-1">
                          {manager.players.map((player, idx) => {
                            const isStillOwned = player.current_owner === manager.name;
                            const posStyles =
                              POSITION_COLORS[player.player_position] || POSITION_COLORS['G'];

                            return (
                              <div
                                key={`${manager.name}-${player.player_name}`}
                                className="flex items-center justify-between group/item"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div
                                    className={`w-1 h-8 rounded-full bg-gradient-to-b ${isStillOwned ? 'from-emerald-500 to-emerald-800' : 'from-slate-700 to-slate-900'}`}
                                  />
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-bold text-slate-300 truncate group-hover/item:text-white transition-colors flex items-center gap-2">
                                      {player.player_name}
                                      {!isStillOwned && (
                                        <span className="text-[9px] text-slate-500 font-medium">
                                          (Vendido)
                                        </span>
                                      )}
                                    </span>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span
                                        className={`text-[8px] uppercase font-black px-1.5 py-0.5 rounded-md border ${posStyles}`}
                                      >
                                        {player.player_position}
                                      </span>
                                      <span className="text-[10px] text-slate-500 font-medium">
                                        {player.current_points} pts •{' '}
                                        {(player.current_price / 1000000).toFixed(1)}M
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center shrink-0">
                                  {isStillOwned ? (
                                    <div className="bg-emerald-500/10 p-1.5 rounded-full text-emerald-500 group-hover/item:bg-emerald-500 group-hover/item:text-white transition-all duration-300">
                                      <Shield
                                        size={12}
                                        fill={isStillOwned ? 'currentColor' : 'none'}
                                        fillOpacity={0.2}
                                      />
                                    </div>
                                  ) : (
                                    <div className="px-2 py-0.5 bg-slate-800/50 rounded-lg border border-slate-700/30">
                                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter truncate max-w-[45px]">
                                        {player.current_owner || 'MERCADO'}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
