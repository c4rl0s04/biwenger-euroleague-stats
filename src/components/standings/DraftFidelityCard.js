'use client';

import { Heart, Info } from 'lucide-react';
import { Card } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import StatsList from '@/components/ui/StatsList';

export default function DraftFidelityCard() {
  const { data, loading, error } = useApiData('/api/standings/initial-squad-stats');
  const [hoveredUser, setHoveredUser] = useState(null);

  const retainedRanking = data?.retainedRanking ?? [];
  const retainedBreakdown = data?.retainedBreakdown ?? [];

  return (
    <Card title="Rendimiento del Reparto" icon={Heart} color="emerald" loading={loading}>
      {!loading && (
        <div className="flex flex-col h-full overflow-hidden">
          <p className="text-xs text-slate-400 italic px-2 mb-4 flex-shrink-0">
            Puntos totales aportados por los jugadores del reparto inicial (puntos reales, sin
            ponderar por posición).
          </p>

          {error ? (
            <p className="text-red-400 text-center py-4 text-sm">{error}</p>
          ) : retainedRanking.length === 0 ? (
            <p className="text-slate-500 text-center py-4 text-sm">No hay datos disponibles</p>
          ) : (
            <StatsList
              items={retainedRanking.map((user) => ({
                ...user,
                name: user.user_name,
                color_index: user.user_color_index,
                user_id: null, // We don't have user_id here, StatsList handles it
                subtitle: (
                  <span className="flex items-center gap-1.5">
                    {user.players_contributed} jugador
                    {user.players_contributed !== 1 ? 'es' : ''} del reparto
                    <Info size={10} className="text-slate-500 group-hover:text-emerald-400" />
                  </span>
                ),
              }))}
              onMouseEnter={(item) => setHoveredUser(item.user_name)}
              onMouseLeave={() => setHoveredUser(null)}
              renderRight={(user) => (
                <div className="flex flex-col items-end">
                  <span className="font-black text-2xl text-emerald-400 leading-none">
                    {(user.total_points ?? 0).toLocaleString()}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-1">
                    pts
                  </span>
                </div>
              )}
              renderExtra={(user) => {
                const userBreakdown = retainedBreakdown.filter(
                  (b) => b.user_name === user.user_name
                );
                return (
                  <AnimatePresence>
                    {hoveredUser === user.user_name && userBreakdown.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute bottom-full left-0 right-0 mb-2 z-50 bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-2xl backdrop-blur-md pointer-events-none"
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
                );
              }}
            />
          )}
        </div>
      )}
    </Card>
  );
}
