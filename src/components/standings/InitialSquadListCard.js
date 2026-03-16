'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  Award,
  TrendingUp,
  DollarSign,
  ChevronRight,
  ChevronLeft,
  Info,
} from 'lucide-react';
import { Card } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';
import { motion, AnimatePresence } from 'framer-motion';

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
                  const managerColor = USER_COLORS[manager.colorIndex % USER_COLORS.length];

                  return (
                    <button
                      key={manager.name}
                      onClick={() => setActiveManagerIdx(idx)}
                      className={`
                        flex-shrink-0 px-4 py-2 rounded-xl border text-sm font-bold transition-all duration-300
                        ${
                          isActive
                            ? `bg-gradient-to-r ${managerColor} text-white border-transparent shadow-lg shadow-black/40 scale-105`
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
                        className={`bg-gradient-to-br ${USER_COLORS[activeManager.colorIndex % USER_COLORS.length]} rounded-3xl p-6 shadow-2xl relative overflow-hidden group`}
                      >
                        {/* Decorative Background Icon */}
                        <Award
                          size={120}
                          className="absolute -bottom-8 -right-8 text-white/10 rotate-12 group-hover:rotate-6 transition-transform duration-700"
                        />

                        <div className="relative z-10 space-y-6">
                          <div>
                            <span className="text-white/60 text-[10px] uppercase font-black tracking-widest">
                              MANAGER
                            </span>
                            <h2 className="text-3xl font-black text-white drop-shadow-lg leading-none">
                              {activeManager.name}
                            </h2>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-inner">
                              <span className="text-white/60 text-[9px] uppercase font-black block mb-1">
                                Pts Totales
                              </span>
                              <span className="text-xl font-black text-white">
                                {activeManager.players
                                  .reduce((sum, p) => sum + p.current_points, 0)
                                  .toLocaleString()}
                              </span>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-inner">
                              <span className="text-white/60 text-[9px] uppercase font-black block mb-1">
                                Valor Draft
                              </span>
                              <span className="text-xl font-black text-white">
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
                            <div className="flex justify-between items-center text-white/80 text-[10px] font-bold uppercase mb-2">
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
                            <div className="h-2 bg-black/20 rounded-full overflow-hidden border border-white/5 shadow-inner">
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
                        <div className="bg-slate-800/50 p-4 border-b border-slate-800 flex justify-between items-center">
                          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                            SQUAD REPARTO INICIAL
                          </span>
                          <span className="text-[10px] text-slate-500 font-bold">
                            {activeManager.players.length} JUGADORES
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">
                          {activeManager.players.map((player, idx) => {
                            const isStillOwned = player.current_owner === activeManager.name;
                            const posStyles =
                              POSITION_COLORS[player.player_position] || POSITION_COLORS['G'];

                            return (
                              <motion.div
                                key={player.player_name}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.03 }}
                                className="flex items-center justify-between p-3 bg-slate-800/20 rounded-2xl border border-slate-800/50 hover:border-slate-700 transition-colors group/item"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${posStyles} border text-xs shadow-inner`}
                                  >
                                    {player.player_position}
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-bold text-slate-200 truncate group-hover/item:text-white transition-colors">
                                      {player.player_name}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-medium">
                                      {player.current_points} pts •{' '}
                                      {(player.current_price / 1000000).toFixed(1)}M
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center">
                                  {isStillOwned ? (
                                    <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-500 group-hover/item:bg-emerald-500 group-hover/item:text-white transition-all duration-300 shadow-sm">
                                      <Shield
                                        size={14}
                                        fill={isStillOwned ? 'currentColor' : 'none'}
                                        fillOpacity={0.2}
                                      />
                                    </div>
                                  ) : (
                                    <div className="px-2 py-1 bg-slate-800/80 rounded-lg border border-slate-700/50 min-w-[60px] text-center">
                                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter truncate block">
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
