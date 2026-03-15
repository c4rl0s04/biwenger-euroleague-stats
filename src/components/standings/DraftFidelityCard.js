'use client';

import { Heart, Info } from 'lucide-react';
import { Card } from '@/components/ui';
import { getColorForUser } from '@/lib/constants/colors';
import { useApiData } from '@/lib/hooks/useApiData';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

/**
 * DraftFidelityCard — Stat B
 * Ranks users by total fantasy points from ALL initial squad players
 * while those players were in their lineup (even if later sold).
 */
export default function DraftFidelityCard() {
  const { data, loading, error } = useApiData('/api/standings/initial-squad-stats');
  const [hoveredUser, setHoveredUser] = useState(null);

  const retainedRanking = data?.retainedRanking ?? [];
  const retainedBreakdown = data?.retainedBreakdown ?? [];

  return (
    <Card title="Rendimiento del Reparto" icon={Heart} color="emerald" loading={loading}>
      {!loading && (
        <div className="space-y-4 pr-2 mt-2">
          <p className="text-xs text-slate-400 italic px-2">
            Puntos totales aportados por los jugadores del reparto inicial (puntos reales, sin
            ponderar por posición).
          </p>

          {error ? (
            <p className="text-red-400 text-center py-4 text-sm">{error}</p>
          ) : retainedRanking.length === 0 ? (
            <p className="text-slate-500 text-center py-4 text-sm">No hay datos disponibles</p>
          ) : (
            retainedRanking.map((user, index) => {
              const colors = getColorForUser(null, user.user_name, user.user_color_index);
              const userBreakdown = retainedBreakdown.filter((b) => b.user_name === user.user_name);

              return (
                <div
                  key={user.user_name}
                  className="relative group cursor-help"
                  onMouseEnter={() => setHoveredUser(user.user_name)}
                  onMouseLeave={() => setHoveredUser(null)}
                >
                  <div className="absolute inset-0 bg-slate-800/30 rounded-lg -z-10 transition-colors group-hover:bg-slate-800/50" />
                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-800 group-hover:border-emerald-500/30 transition-colors relative">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-xs border-2"
                          style={{
                            backgroundColor: colors.stroke,
                            borderColor: colors.fill,
                          }}
                        >
                          {user.user_name.substring(0, 2).toUpperCase()}
                        </div>
                        {index === 0 && (
                          <div className="absolute -top-2 -right-2 bg-emerald-500 text-white p-1 rounded-full shadow-lg">
                            <Heart size={12} />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-200 flex items-center gap-1.5">
                          {user.user_name}
                          <Info size={10} className="text-slate-500 group-hover:text-emerald-400" />
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {user.players_contributed} jugador
                          {user.players_contributed !== 1 ? 'es' : ''} del reparto
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="font-black text-2xl text-emerald-400">
                        {(user.total_points ?? 0).toLocaleString()}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-slate-500">
                        pts
                      </span>
                    </div>

                    {/* Tooltip Breakdown */}
                    <AnimatePresence>
                      {hoveredUser === user.user_name && userBreakdown.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 10 }}
                          className="absolute bottom-full left-0 right-0 mb-2 z-50 bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-2xl backdrop-blur-md"
                        >
                          <p className="text-[10px] font-bold uppercase text-slate-500 mb-2 border-b border-slate-800 pb-1">
                            Aportación por Jugador
                          </p>
                          <div className="max-h-[160px] overflow-y-auto custom-scrollbar">
                            <div className="space-y-1.5">
                              {userBreakdown.map((player) => (
                                <div
                                  key={player.player_name}
                                  className="flex justify-between items-center text-[10px]"
                                >
                                  <span className="text-slate-300 truncate pr-2">
                                    {player.player_name}
                                  </span>
                                  <span className="font-mono font-bold text-emerald-400">
                                    {player.points.toLocaleString()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="absolute -bottom-1 left-6 w-2 h-2 bg-slate-900 border-r border-b border-slate-700 rotate-45" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </Card>
  );
}
