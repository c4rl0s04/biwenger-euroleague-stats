'use client';

import { useState } from 'react';
import { Users, Shield, Award, TrendingUp, DollarSign, Info, User, Activity } from 'lucide-react';
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
        <div className="mt-2 flex flex-col gap-4">
          {error ? (
            <p className="text-red-400 text-center py-12 text-sm bg-red-400/5 rounded-2xl border border-red-400/10">
              {error}
            </p>
          ) : managers.length === 0 ? (
            <p className="text-slate-400 text-center py-12 text-sm bg-slate-800/20 rounded-2xl">
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

              <AnimatePresence mode="wait">
                {activeManager && (
                  <motion.div
                    key={activeManager.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col gap-5"
                  >
                    {/* Hyper-Compact Manager Hero Bar */}
                    <div
                      className="rounded-2xl p-4 md:p-5 shadow-xl relative overflow-hidden group border border-white/5"
                      style={{ background: 'var(--manager-card-bg)' }}
                    >
                      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-black text-white shadow-lg bg-gradient-to-br ${getVibrantGradient(activeManager.colorIndex)}`}
                          >
                            {activeManager.name.charAt(0)}
                          </div>
                          <div>
                            <span className="text-white/40 text-xs uppercase font-black tracking-[0.2em] font-display block mb-0.5">
                              MANAGER
                            </span>
                            <h2
                              className={`text-2xl md:text-3xl font-black leading-none tracking-tighter uppercase ${USER_COLORS[activeManager.colorIndex % USER_COLORS.length].text}`}
                            >
                              {activeManager.name}
                            </h2>
                          </div>
                        </div>

                        {/* Enhanced Visual Stats Row (No Boxes, Just Colors & Impact) */}
                        <div className="flex flex-wrap items-center gap-6 md:gap-8">
                          {/* Points Stat */}
                          <div className="flex flex-col gap-0.5 group/stat cursor-default">
                            <div className="flex items-center gap-1.5 opacity-60 group-hover/stat:opacity-100 transition-opacity">
                              <Award size={12} className="text-amber-400" />
                              <span className="text-white text-[11px] uppercase font-black tracking-widest leading-none">
                                Puntos Totales
                              </span>
                            </div>
                            <span className="text-2xl md:text-3xl font-black text-amber-400 drop-shadow-sm transition-transform group-hover/stat:scale-105 origin-left">
                              {activeManager.players
                                .reduce((sum, p) => sum + p.current_points, 0)
                                .toLocaleString()}
                            </span>
                          </div>

                          {/* Value Stat */}
                          <div className="flex flex-col gap-0.5 group/stat cursor-default">
                            <div className="flex items-center gap-1.5 opacity-60 group-hover/stat:opacity-100 transition-opacity">
                              <DollarSign size={12} className="text-emerald-400" />
                              <span className="text-white text-[11px] uppercase font-black tracking-widest leading-none">
                                Valor Draft
                              </span>
                            </div>
                            <span className="text-2xl md:text-3xl font-black text-emerald-400 drop-shadow-sm transition-transform group-hover/stat:scale-105 origin-left">
                              {(
                                activeManager.players.reduce((sum, p) => sum + p.current_price, 0) /
                                1000000
                              ).toFixed(1)}
                              M
                            </span>
                          </div>

                          {/* Fidelity Progress - Integrated Colorfully */}
                          <div className="flex flex-col gap-1.5 min-w-[160px] group/stat">
                            <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-wider leading-none">
                              <div className="flex items-center gap-1.5 opacity-60 group-hover/stat:opacity-100 transition-opacity">
                                <Shield size={12} className="text-blue-400" />
                                <span className="text-white">Fidelidad</span>
                              </div>
                              <span className="text-blue-400 group-hover/stat:scale-110 transition-transform">
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

                            <div className="h-2 bg-white/5 rounded-full overflow-hidden w-full flex items-center shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] mt-1">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${(activeManager.players.filter((p) => p.current_owner === activeManager.name).length / activeManager.players.length) * 100}%`,
                                }}
                                transition={{ delay: 0.5, duration: 1 }}
                                className={`h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(37,99,235,0.3)] bg-gradient-to-r from-blue-600 to-blue-400`}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Hyper-Compact Squad Grid Section */}
                    <div className="bg-slate-900/30 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
                      <div className="bg-slate-800/20 px-6 py-3 border-b border-slate-800 flex justify-center items-center">
                        <span className="text-base font-normal uppercase tracking-[0.2em] text-slate-500 font-bebas">
                          DETALLE SQUAD REPARTO INICIAL
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-5">
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
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: idx * 0.01 }}
                              className="flex flex-col gap-2.5 p-3 bg-slate-800/10 rounded-xl border border-white/5 hover:border-white/10 transition-all group/item shadow-sm"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div
                                  className={`w-10 h-10 rounded-lg flex items-center justify-center font-black ${posData.styles} border text-base shadow-inner shrink-0 group-hover/item:scale-110 transition-transform`}
                                >
                                  {posData.label}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-base font-bold text-slate-200 truncate group-hover/item:text-white transition-colors leading-tight">
                                    {player.player_name}
                                  </span>
                                  <div className="flex items-center gap-2 text-sm font-bold mt-1 whitespace-nowrap">
                                    <div
                                      className="flex items-center gap-0.5 text-pink-400"
                                      title="Puntos para el manager inicial"
                                    >
                                      <Award size={13} />
                                      {player.points_contributed}
                                    </div>
                                    <span className="text-slate-500">|</span>
                                    <div
                                      className="text-slate-400"
                                      title="Puntos totales temporada"
                                    >
                                      {player.current_points}
                                    </div>
                                    <span className="text-slate-500/50">•</span>
                                    <span className="text-emerald-500/80">
                                      {(player.current_price / 1000000).toFixed(1)}M
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div
                                className={`
                                  px-2 py-1 rounded-lg border text-center transition-all duration-300 flex items-center justify-center gap-1.5
                                  ${ownerStyles ? `bg-gradient-to-br ${ownerStyles.bg} ${ownerStyles.border}` : 'bg-slate-800/80 border-slate-700/50'}
                                `}
                              >
                                {(isStillOwned && (
                                  <Shield
                                    size={12}
                                    className={ownerStyles?.text || 'text-slate-400'}
                                    fill="currentColor"
                                    fillOpacity={0.2}
                                  />
                                )) || <Activity size={12} className="text-slate-500" />}
                                <span
                                  className={`text-xs font-black uppercase tracking-tighter truncate ${ownerStyles ? ownerStyles.text : 'text-slate-400'}`}
                                >
                                  {player.current_owner || 'MERCADO'}
                                </span>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Info Footer (Hyper-Compact) */}
                    <div className="bg-slate-800/10 rounded-xl border border-slate-800/30 p-3.5 flex items-center gap-3">
                      <Info size={16} className="text-slate-500 shrink-0" />
                      <p className="text-sm text-slate-500 leading-tight italic">
                        <span className="text-pink-400/60 font-bold ml-1">★ Pts Manager</span>{' '}
                        indica aportación al dueño original. Escudo = Retenido.
                      </p>
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
