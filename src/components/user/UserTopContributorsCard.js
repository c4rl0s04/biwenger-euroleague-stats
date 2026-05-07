'use client';

import { useState } from 'react';
import { Trophy, Activity, ChevronDown, ChevronUp, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ElegantCard } from '@/components/ui';

export default function UserTopContributorsCard({ contributors }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!contributors || contributors.length === 0) {
    return (
      <ElegantCard
        title="Máximos Contribuidores"
        icon={Trophy}
        color="amber"
        className="col-span-full"
      >
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-white/40 italic">No hay datos de contribución de jugadores todavía.</p>
        </div>
      </ElegantCard>
    );
  }

  const top10 = contributors.slice(0, 10);
  const theRest = contributors.slice(10);
  const maxContribution = contributors[0].total_contribution || 1;

  return (
    <ElegantCard
      title="Máximos Contribuidores"
      subtitle="Comparativa entre puntos totales marcados y aportación real al equipo."
      icon={Trophy}
      color="amber"
      className="col-span-full"
    >
      {/* Top 10 Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mt-6">
        {top10.map((player, idx) => (
          <ContributorCard
            key={player.player_id}
            player={player}
            index={idx}
            maxContribution={maxContribution}
          />
        ))}
      </div>

      {/* Expandable History for the Rest */}
      {theRest.length > 0 && (
        <div className="mt-8">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-amber-500/30 transition-all group cursor-pointer"
          >
            <span className="text-sm font-black text-white/60 group-hover:text-amber-400 transition-colors uppercase tracking-widest">
              {isExpanded ? 'Ocultar historial completo' : `Ver otros ${theRest.length} jugadores`}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-amber-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-amber-500" />
            )}
          </button>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4, ease: 'circOut' }}
                className="overflow-hidden"
              >
                <div className="mt-4 overflow-x-auto rounded-xl border border-white/5 bg-black/20">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-white/[0.02]">
                        <th className="p-4 text-[10px] font-black text-white/80 uppercase tracking-widest">
                          Jugador
                        </th>
                        <th className="p-4 text-[10px] font-black text-white/80 uppercase tracking-widest text-center">
                          Partidos
                        </th>
                        <th className="p-4 text-[10px] font-black text-white/80 uppercase tracking-widest text-right">
                          Puntos Base
                        </th>
                        <th className="p-4 text-[10px] font-black text-white/80 uppercase tracking-widest text-right">
                          Aportación Real
                        </th>
                        <th className="p-4 text-[10px] font-black text-white/80 uppercase tracking-widest text-right">
                          Eficiencia
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {theRest.map((player, idx) => (
                        <tr
                          key={player.player_id}
                          className="border-t border-white/5 hover:bg-white/[0.03] transition-colors group"
                        >
                          <td className="p-4">
                            <Link
                              href={`/player/${player.player_id}`}
                              className="flex items-center gap-3"
                            >
                              <div className="relative w-8 h-8 overflow-hidden rounded-full bg-white/5 border border-white/10">
                                {player.player_img ? (
                                  <Image
                                    src={player.player_img}
                                    alt={player.player_name}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                  />
                                ) : (
                                  <User className="w-full h-full p-1.5 text-white/20" />
                                )}
                              </div>
                              <span className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                                {player.player_name}
                              </span>
                            </Link>
                          </td>
                          <td className="p-4 text-center">
                            <span className="text-sm font-bold text-white/60">
                              {player.games_played}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <span className="text-sm font-bold text-white/60">
                              {player.total_base_points}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <span className="text-sm font-black text-amber-400">
                              {player.total_contribution}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <span
                              className={`text-xs font-black ${
                                (player.total_contribution / (player.total_base_points || 1)) *
                                  100 >=
                                100
                                  ? 'text-emerald-400'
                                  : 'text-amber-500/70'
                              }`}
                            >
                              {(
                                (player.total_contribution / (player.total_base_points || 1)) *
                                100
                              ).toFixed(0)}
                              %
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </ElegantCard>
  );
}

function ContributorCard({ player, index, maxContribution }) {
  const efficiency = ((player.total_contribution / (player.total_base_points || 1)) * 100).toFixed(
    0
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group relative"
    >
      <Link href={`/player/${player.player_id}`} className="block">
        <div className="relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-amber-500/30 transition-all duration-300 group-hover:bg-white/[0.06] group-hover:shadow-2xl group-hover:shadow-black/50">
          {/* Rank Badge */}
          <div className="absolute top-3 left-3 z-20">
            <div
              className={`
              w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black border
              ${
                index === 0
                  ? 'bg-amber-500 text-black border-amber-400'
                  : index === 1
                    ? 'bg-slate-300 text-black border-slate-200'
                    : index === 2
                      ? 'bg-orange-600 text-white border-orange-500'
                      : 'bg-white/10 text-white/60 border-white/10'
              }
            `}
            >
              {index + 1}
            </div>
          </div>

          <div className="p-4 pt-6 flex flex-col items-center text-center">
            {/* Player Image */}
            <div className="relative w-24 h-24 mb-4">
              <div className="absolute inset-0 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all" />
              <div className="relative w-full h-full overflow-hidden rounded-full border-2 border-white/5 group-hover:border-amber-500/20 transition-all">
                {player.player_img ? (
                  <Image
                    src={player.player_img}
                    alt={player.player_name}
                    fill
                    className="object-contain object-top scale-125 pt-2 group-hover:scale-135 transition-transform duration-500"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full bg-white/5 flex items-center justify-center">
                    <Activity className="w-8 h-8 text-white/10" />
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <h4 className="text-base font-black text-white truncate w-full group-hover:text-amber-400 transition-colors">
              {player.player_name}
            </h4>

            <div className="mt-3 w-full space-y-3">
              <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 group-hover:bg-amber-500/20 transition-all">
                <span className="text-[10px] font-black text-amber-500/80 uppercase tracking-widest">
                  Aportación Real
                </span>
                <span className="text-3xl font-black text-amber-400 tabular-nums">
                  {player.total_contribution}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col items-center p-1.5 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-[8px] font-bold text-white/70 uppercase">Puntos Base</span>
                  <span className="text-sm font-black text-white/80">
                    {player.total_base_points}
                  </span>
                </div>
                <div className="flex flex-col items-center p-1.5 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-[8px] font-bold text-white/70 uppercase">Eficiencia</span>
                  <span
                    className={`text-sm font-black ${parseInt(efficiency) >= 100 ? 'text-emerald-400' : 'text-amber-500/70'}`}
                  >
                    {efficiency}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-[11px] font-bold text-white/60">
                <Activity className="w-3 h-3 text-amber-500/50" />
                <span>En {player.games_played} convocatorias</span>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 w-full h-1 bg-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(player.total_contribution / maxContribution) * 100}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
            />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
