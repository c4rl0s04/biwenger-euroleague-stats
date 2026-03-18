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

const POSITION_MAP = {
  Base: { label: 'B', styles: 'text-blue-400 bg-blue-400/10 border-blue-400/20 shadow-blue-400/5' },
  Alero: {
    label: 'A',
    styles: 'text-green-500 bg-green-500/10 border-green-500/20 shadow-green-500/5',
  },
  Pivot: { label: 'P', styles: 'text-red-500 bg-red-500/10 border-red-500/20 shadow-red-500/5' },
  G: { label: 'B', styles: 'text-blue-400 bg-blue-400/10 border-blue-400/20 shadow-blue-400/5' },
  F: {
    label: 'A',
    styles: 'text-green-500 bg-green-500/10 border-green-500/20 shadow-green-500/5',
  },
  C: { label: 'P', styles: 'text-red-500 bg-red-500/10 border-red-500/20 shadow-red-500/5' },
};

const getFidelityColor = (percent) => {
  if (percent >= 80) return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]';
  if (percent >= 50) return 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]';
  if (percent >= 25) return 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]';
  return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]';
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
                  const managerColor = USER_COLORS[manager.colorIndex % USER_COLORS.length];

                  return (
                    <button
                      key={manager.name}
                      onClick={() => setActiveManagerIdx(idx)}
                      className={`
                        flex-shrink-0 px-4 py-2 rounded-xl border text-sm font-bold transition-all duration-300 cursor-pointer
                        ${
                          isActive
                            ? `bg-gradient-to-r ${managerGradient} text-white border-transparent shadow-lg shadow-black/40 scale-105`
                            : `bg-slate-800/40 ${managerColor.text} ${managerColor.border} hover:bg-slate-800/60 hover:border-slate-600`
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
                      {/* Manager Summary Box - References CSS variable for background */}
                      <div
                        className="rounded-3xl p-6 shadow-2xl relative overflow-hidden group border border-white/5"
                        style={{ background: 'var(--manager-card-bg)' }}
                      >
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative z-10 space-y-6">
                          <div>
                            <span className="text-white/40 text-[10px] uppercase font-black tracking-[0.2em] font-display">
                              MANAGER PROFILE
                            </span>
                            <h2
                              className={`text-4xl font-black drop-shadow-lg leading-none tracking-tighter uppercase ${USER_COLORS[activeManager.colorIndex % USER_COLORS.length].text}`}
                            >
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
                                className={`h-full rounded-full transition-all duration-500 ${getFidelityColor(
                                  (activeManager.players.filter(
                                    (p) => p.current_owner === activeManager.name
                                  ).length /
                                    activeManager.players.length) *
                                    100
                                )}`}
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
                        <div className="bg-slate-800/30 p-5 border-b border-slate-800 flex justify-between items-center text-center">
                          <h3 className="w-full flex items-center justify-center gap-3">
                            <span className="text-lg font-normal uppercase tracking-widest text-slate-500 font-bebas">
                              SQUAD REPARTO INICIAL DE
                            </span>
                            <span
                              className={`text-3xl font-normal uppercase tracking-wider font-bebas drop-shadow-[0_2px_8px_rgba(250,80,1,0.2)] ${USER_COLORS[activeManager.colorIndex % USER_COLORS.length].text}`}
                            >
                              {activeManager.name}
                            </span>
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">
                          {sortedPlayers.map((player, idx) => {
                            const isStillOwned = player.current_owner === activeManager.name;
                            const posData = POSITION_MAP[player.player_position] || {
                              label: '?',
                              styles: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
                            };

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
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-black ${posData.styles} border text-lg shadow-inner shrink-0`}
                                  >
                                    {posData.label}
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-bold text-slate-200 truncate group-hover/item:text-white transition-colors">
                                      {player.player_name}
                                    </span>
                                    <span className="text-xs text-slate-400 font-bold mt-0.5">
                                      <span className="text-slate-200 text-sm">
                                        {player.current_points}
                                      </span>{' '}
                                      <span className="text-[10px] text-slate-500 uppercase">
                                        pts
                                      </span>{' '}
                                      •{' '}
                                      <span className="text-emerald-400 text-sm">
                                        {(player.current_price / 1000000).toFixed(2)}M
                                      </span>
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center ml-2 shrink-0">
                                  <div
                                    className={`
                                      px-3 py-1.5 rounded-xl border min-w-[90px] text-center shadow-lg transition-all duration-300 flex items-center justify-center gap-2
                                      ${ownerStyles ? `bg-gradient-to-br ${ownerStyles.bg} ${ownerStyles.border}` : 'bg-slate-800/80 border-slate-700/50'}
                                    `}
                                  >
                                    {isStillOwned && (
                                      <Shield
                                        size={12}
                                        className={ownerStyles?.text || 'text-slate-400'}
                                        fill="currentColor"
                                        fillOpacity={0.2}
                                      />
                                    )}
                                    <span
                                      className={`text-[10px] font-black uppercase tracking-tighter truncate block ${ownerStyles ? ownerStyles.text : 'text-slate-400'}`}
                                    >
                                      {player.current_owner || 'MERCADO'}
                                    </span>
                                  </div>
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
