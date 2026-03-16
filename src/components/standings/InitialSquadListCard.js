'use client';

import { useState } from 'react';
import { Users, Shield, Award, TrendingUp, DollarSign, Info } from 'lucide-react';
import { Card } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';
import { motion, AnimatePresence } from 'framer-motion';
import { USER_COLORS } from '@/lib/constants/colors';

// Helper to get vibrant gradient for headers/tabs based on official index
const getVibrantGradient = (index) => {
  const gradients = [
    'from-blue-600 to-blue-400', // 0: Blue
    'from-yellow-600 to-yellow-400', // 1: Yellow
    'from-emerald-600 to-emerald-400', // 2: Emerald
    'from-pink-600 to-pink-400', // 3: Pink
    'from-cyan-600 to-cyan-400', // 4: Cyan
    'from-orange-600 to-orange-400', // 5: Orange
    'from-purple-600 to-purple-400', // 6: Purple
    'from-red-600 to-red-400', // 7: Red
    'from-amber-600 to-amber-400', // 8: Amber
    'from-indigo-600 to-indigo-400', // 9: Indigo
    'from-teal-600 to-teal-400', // 10: Teal
    'from-lime-600 to-lime-400', // 11: Lime
    'from-fuchsia-600 to-fuchsia-400', // 12: Fuchsia
  ];
  return gradients[index % gradients.length];
};

const POSITION_COLORS = {
  G: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  F: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  C: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
};

export default function InitialSquadListCard() {
  const { data, loading, error } = useApiData('/api/standings/initial-squad-stats');
  const [activeManagerIdx, setActiveManagerIdx] = useState(0);

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

  const activeManager = managers[activeManagerIdx];
  // Sort players by points descending
  const sortedPlayers =
    activeManager?.players?.sort((a, b) => b.current_points - a.current_points) || [];

  return (
    <Card
      title="Análisis Detallado de Repartos Iniciales"
      icon={Users}
      color="slate"
      loading={loading}
      className="col-span-1 md:col-span-2 lg:col-span-3 overflow-visible"
    >
      {!loading && (
        <div className="mt-6 flex flex-col gap-6">
          {error ? (
            <p className="text-red-400 text-center py-12 text-sm bg-red-400/5 rounded-2xl border border-red-400/10">
              {error}
            </p>
          ) : managers.length === 0 ? (
            <p className="text-slate-500 text-center py-12 text-sm bg-slate-800/20 rounded-2xl">
              No hay datos disponibles
            </p>
          ) : (
            <>
              {/* Manager Tab Selector */}
              <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2">
                {managers.map((manager, idx) => {
                  const isActive = activeManagerIdx === idx;
                  const managerGradient = getVibrantGradient(manager.colorIndex);

                  return (
                    <button
                      key={manager.name}
                      onClick={() => setActiveManagerIdx(idx)}
                      className={`
                        flex-shrink-0 px-4 py-2 rounded-xl border text-sm font-bold transition-all duration-300
                        ${
                          isActive
                            ? `bg-gradient-to-r ${managerGradient} text-white border-transparent shadow-lg shadow-black/40 scale-105`
                            : 'bg-slate-800/40 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                        }
                      `}
                    >
                      {manager.name}
                    </button>
                  );
                })}
              </div>

              {/* Active Manager Squad View */}
              <AnimatePresence mode="wait">
                {activeManager && (
                  <motion.div
                    key={activeManager.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-6"
                  >
                    {/* Left Column: Summary and Stats Card */}
                    <div className="lg:col-span-4 space-y-4">
                      <div
                        className={`bg-gradient-to-br ${getVibrantGradient(activeManager.colorIndex)} rounded-3xl p-6 shadow-2xl relative overflow-hidden group`}
                      >
                        <div className="relative z-10 space-y-6">
                          <div>
                            <span className="text-white/60 text-[10px] uppercase font-black tracking-widest">
                              MANAGER
                            </span>
                            <h2 className="text-4xl font-black text-white drop-shadow-lg leading-none">
                              {activeManager.name}
                            </h2>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-blue-600/30 backdrop-blur-md rounded-2xl p-4 border border-blue-400/20 shadow-inner">
                              <span className="text-blue-100/60 text-[10px] uppercase font-black block mb-1">
                                Pts Totales
                              </span>
                              <span className="text-2xl font-black text-white">
                                {activeManager.players
                                  .reduce((sum, p) => sum + p.current_points, 0)
                                  .toLocaleString()}
                              </span>
                            </div>
                            <div className="bg-emerald-600/30 backdrop-blur-md rounded-2xl p-4 border border-emerald-400/20 shadow-inner">
                              <span className="text-emerald-100/60 text-[10px] uppercase font-black block mb-1">
                                Valor Draft
                              </span>
                              <span className="text-2xl font-black text-white">
                                {(
                                  activeManager.players.reduce(
                                    (sum, p) => sum + p.current_price,
                                    0
                                  ) / 1000000
                                ).toFixed(1)}
                                M
                              </span>
                            </div>
                          </div>

                          <div className="pt-2">
                            <div className="flex justify-between items-center text-white/80 text-xs font-bold uppercase mb-2">
                              <span>Fidelidad al Reparto</span>
                              <span>
                                {Math.round(
                                  (activeManager.players.filter(
                                    (p) => p.current_owner === activeManager.name
                                  ).length /
                                    activeManager.players.length) *
                                    100
                                )}
                                %
                              </span>
                            </div>
                            <div className="h-2.5 bg-black/20 rounded-full overflow-hidden border border-white/5 shadow-inner flex items-center">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${(activeManager.players.filter((p) => p.current_owner === activeManager.name).length / activeManager.players.length) * 100}%`,
                                }}
                                transition={{ delay: 0.5, duration: 1 }}
                                className="h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-900/50 rounded-3xl border border-slate-800 p-6 shadow-xl">
                        <h4 className="text-slate-300 font-bold text-sm mb-4 flex items-center gap-2">
                          <Info size={16} className="text-slate-500" />
                          Nota Informativa
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed italic">
                          Esta lista muestra exactamente los jugadores que recibió el manager en el
                          reparto inicial de la temporada. Se indica el dueño actual para ver quién
                          supo retener su talento y quién lo dejó escapar al mercado u otros
                          managers.
                        </p>
                      </div>
                    </div>

                    {/* Right Column: Player Grid */}
                    <div className="lg:col-span-8">
                      <div className="bg-slate-900/40 rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
                        <div className="bg-slate-800/50 p-4 border-b border-slate-800 flex justify-between items-center text-center">
                          <h3 className="w-full">
                            <span className="text-sm font-black uppercase tracking-widest text-slate-400">
                              SQUAD REPARTO INICIAL DE{' '}
                            </span>
                            <span
                              className={`text-lg font-black uppercase tracking-widest ${USER_COLORS[activeManager.colorIndex % USER_COLORS.length].text}`}
                            >
                              {activeManager.name}
                            </span>
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">
                          {sortedPlayers.map((player, idx) => {
                            const isStillOwned = player.current_owner === activeManager.name;
                            const posStyles =
                              POSITION_COLORS[player.player_position] || POSITION_COLORS['G'];

                            // Official colors for current owner
                            const ownerStyles =
                              player.current_owner_color_index !== null
                                ? USER_COLORS[player.current_owner_color_index % USER_COLORS.length]
                                : null;

                            return (
                              <motion.div
                                key={player.player_name}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.03 }}
                                className="flex items-center justify-between p-4 bg-slate-800/20 rounded-2xl border border-slate-800/50 hover:border-slate-700 transition-colors group/item"
                              >
                                <div className="flex items-center gap-4 min-w-0">
                                  <div
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-black ${posStyles} border text-sm shadow-inner shrink-0`}
                                  >
                                    {player.player_position}
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-bold text-slate-200 truncate group-hover/item:text-white transition-colors">
                                      {player.player_name}
                                    </span>
                                    <span className="text-xs text-slate-400 font-bold mt-0.5">
                                      <span className="text-slate-200">
                                        {player.current_points}
                                      </span>{' '}
                                      <span className="text-[10px] text-slate-500 uppercase">
                                        pts
                                      </span>{' '}
                                      •{' '}
                                      <span className="text-emerald-400">
                                        {(player.current_price / 1000000).toFixed(2)}M
                                      </span>
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center ml-2 shrink-0">
                                  {isStillOwned ? (
                                    <div
                                      className={`
                                        bg-emerald-500/10 p-2.5 rounded-xl text-emerald-500 
                                        group-hover/item:bg-emerald-500 group-hover/item:text-white 
                                        transition-all duration-300 shadow-sm border border-emerald-500/20
                                      `}
                                    >
                                      <Shield
                                        size={18}
                                        fill={isStillOwned ? 'currentColor' : 'none'}
                                        fillOpacity={0.2}
                                      />
                                    </div>
                                  ) : (
                                    <div
                                      className={`
                                        px-3 py-1.5 rounded-xl border min-w-[70px] text-center shadow-lg transition-all duration-300
                                        ${ownerStyles ? `bg-gradient-to-br ${ownerStyles.bg} ${ownerStyles.border}` : 'bg-slate-800/80 border-slate-700/50'}
                                      `}
                                    >
                                      <span
                                        className={`text-[10px] font-black uppercase tracking-tighter truncate block ${ownerStyles ? ownerStyles.text : 'text-slate-400'}`}
                                      >
                                        {player.current_owner || 'MERCADO'}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      )}
    </Card>
  );
}
