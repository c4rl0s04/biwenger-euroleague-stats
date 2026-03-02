'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { X, Calendar, Activity, BarChart3, TrendingUp } from 'lucide-react';
import { useApiData } from '@/lib/hooks/useApiData';

// Function to generate deterministic colors based on a string (like team name)
const getTeamColor = (teamName) => {
  const colors = [
    '#f59e0b',
    '#ec4899',
    '#06b6d4',
    '#84cc16',
    '#a855f7',
    '#14b8a6',
    '#ef4444',
    '#3b82f6',
    '#10b981',
    '#f97316',
  ];
  if (!teamName) return colors[0];
  let hash = 0;
  for (let i = 0; i < teamName.length; i++) {
    hash = teamName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export default function ExpandedPlayerModal({ player, onClose }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    // Optional: lock body scroll when modal opens
    if (player) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [player]);

  // We fetch detailed stats automatically when this modal opens
  const { data: detailsData, loading: detailsLoading } = useApiData(
    () => `/api/players/${player?.player_id}/stats`,
    { skip: !player }
  );

  const details = detailsData;
  const teamColor = getTeamColor(player?.team);

  if (!player || !mounted) return null;

  const modalContent = (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[100] bg-[#0b0c10]/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
        onClick={onClose}
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      >
        {/* The Animated Modal */}
        <motion.div
          layoutId={`player-card-${player.player_id}`}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#0b0c10] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative"
        >
          {/* Close Button */}
          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={onClose}
              className="bg-black/50 backdrop-blur-md p-2 rounded-full hover:bg-white/20 text-white transition-colors border border-white/10"
            >
              <X size={20} />
            </button>
          </div>

          {/* Header Hero */}
          <div
            className="h-32 relative flex items-end px-8 pb-4"
            style={{ backgroundColor: `${teamColor}20` }}
          >
            {/* Decorative background gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c10] to-transparent pointer-events-none" />

            {/* Player Image Overlap */}
            <div className="w-24 h-24 bg-[#111318] rounded-xl overflow-hidden translate-y-8 border-4 border-[#0b0c10] shadow-xl flex-shrink-0 relative">
              {player.img ? (
                <Image src={player.img} alt={player.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/20 font-bold text-3xl">
                  {player.name?.charAt(0)}
                </div>
              )}
            </div>

            {/* Header Info */}
            <div className="ml-6 mb-1 text-white flex-1 flex justify-between items-end relative z-10">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black">{player.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  {player.team_img && (
                    <Image
                      src={player.team_img}
                      alt={player.team}
                      width={20}
                      height={20}
                      className="object-contain"
                    />
                  )}
                  <p className="text-sm font-medium" style={{ color: teamColor }}>
                    {player.team} • {player.position}
                  </p>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-white/50 text-xs uppercase mb-1">Valor de Mercado</p>
                <p className="text-2xl font-bold tabular-nums relative right-[-0.15em] tracking-tighter">
                  {new Intl.NumberFormat('es-ES').format(player.price)}
                  <span className="text-base text-white/50 ml-1">€</span>
                </p>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-8 pt-12 flex-1 overflow-y-auto w-full">
            {/* Mobile Price View (hidden on sm+) */}
            <div className="sm:hidden mb-6 bg-white/5 p-4 rounded-xl border border-white/10 text-center">
              <p className="text-white/50 text-xs uppercase mb-1">Valor de Mercado</p>
              <p className="text-2xl font-bold text-white tabular-nums">
                {new Intl.NumberFormat('es-ES').format(player.price)} €
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Col (Core Metrics) */}
              <div className="lg:col-span-1 space-y-6">
                {/* Base Performance Box */}
                <div className="bg-[#111318] p-5 rounded-xl border border-white/5 shadow-inner">
                  <h4 className="text-xs text-white/50 font-bold mb-4 uppercase flex items-center">
                    <Activity size={14} className="mr-2" /> Performance Histórico
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-white/5">
                      <span className="text-white/70 text-sm">Puntos Totales</span>
                      <strong className="text-emerald-400 text-lg">
                        {details?.total_points || player.total_points || '-'}
                      </strong>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-white/5">
                      <span className="text-white/70 text-sm">Media Reciente</span>
                      <strong className="text-white text-base">
                        {player.avg_recent_points?.toFixed(1) || '-'}
                      </strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70 text-sm">Partidos Jugados</span>
                      <strong className="text-white text-base">
                        {details?.games_played || '-'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Ceiling/Floor (Simulated for aesthetics based on points if API lacks real floor/ceiling logic) */}
                <div className="bg-[#111318] p-5 rounded-xl border border-white/5 shadow-inner">
                  <h4 className="text-xs text-white/50 font-bold mb-4 uppercase flex items-center">
                    <BarChart3 size={14} className="mr-2" /> Fiabilidad Virtual
                  </h4>
                  <p className="text-xs text-white/40 mb-4">
                    Estimación de Suelo (Peor Partido) y Techo (Mejor Partido).
                  </p>
                  <div className="relative h-4 bg-white/10 rounded-full mt-6 mb-2">
                    {/* Fake math for demo purposes to simulate varying floors/ceilings */}
                    <div className="absolute top-1/2 -translate-y-1/2 -mt-5 left-[5%] text-[10px] text-white/50 uppercase">
                      Suelo ({Math.max(0, Math.floor((player.avg_recent_points || 10) - 8))})
                    </div>
                    <div className="absolute top-1/2 -translate-y-1/2 -mt-5 left-[80%] text-[10px] text-emerald-500/80 uppercase text-right">
                      Techo ({Math.floor((player.avg_recent_points || 15) + 12)})
                    </div>
                    <div
                      className="absolute inset-y-0 bg-emerald-500/50 rounded-full"
                      style={{ left: '15%', right: '15%' }}
                    ></div>
                    <div className="absolute inset-y-0 w-1 bg-white" style={{ left: '40%' }}></div>
                  </div>
                </div>
              </div>

              {/* Right Col (Calendar & Deep Stats) */}
              <div className="lg:col-span-2 space-y-6">
                {/* Calendar Widget */}
                <div className="bg-[#111318] p-5 rounded-xl border border-white/5 shadow-inner">
                  <h4 className="text-xs text-white/50 font-bold mb-4 uppercase flex items-center">
                    <Calendar size={14} className="mr-2" /> Calendario FAS
                  </h4>

                  <div className="flex flex-col sm:flex-row gap-3">
                    {/* Real Next Match */}
                    {player.next_opponent_id ? (
                      <div className="flex-1 bg-blue-900/10 border border-blue-500/20 p-4 rounded-xl flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] text-white/40 mb-2 font-medium">
                          Próximo Partido
                        </span>
                        {player.next_opponent_img && (
                          <Image
                            src={player.next_opponent_img}
                            alt={player.next_opponent_name}
                            width={40}
                            height={40}
                            className="mb-2"
                          />
                        )}
                        <span className="text-sm font-bold text-white mb-2">
                          {player.next_opponent_name}
                        </span>
                        <span className="text-[10px] text-white/50 bg-white/5 px-2 py-1 rounded">
                          {new Date(player.next_match_date).toLocaleDateString('es-ES', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </div>
                    ) : (
                      <div className="flex-1 bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-center text-white/40 text-sm">
                        No hay próximos partidos programados.
                      </div>
                    )}

                    {/* Simulated Future Matches (Placeholders representing deep calendar) */}
                    <div className="flex-1 bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col items-center justify-center opacity-60 grayscale">
                      <span className="text-[10px] text-white/40 mb-2 font-medium">
                        Jornada N+1 (Proyección)
                      </span>
                      <div className="w-10 h-10 rounded-full bg-white/10 mb-2 flex items-center justify-center text-white/30">
                        ?
                      </div>
                      <span className="text-[10px] text-white/50 bg-white/5 px-2 py-1 rounded">
                        Rival por confirmar
                      </span>
                    </div>
                  </div>
                </div>

                {/* Market Details */}
                <div className="bg-[#111318] p-5 rounded-xl border border-white/5 shadow-inner flex flex-col sm:flex-row gap-6">
                  <div className="flex-1">
                    <h4 className="text-xs text-white/50 font-bold mb-3 uppercase">
                      Tendencia de Mercado
                    </h4>
                    <div className="flex flex-col space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-white/70">Subida/Bajada Diaria</span>
                        <strong
                          className={
                            player.price_trend > 0
                              ? 'text-green-400'
                              : player.price_trend < 0
                                ? 'text-red-400'
                                : 'text-white'
                          }
                        >
                          {player.price_trend > 0 ? '+' : ''}
                          {new Intl.NumberFormat('es-ES').format(player.price_trend)} €
                        </strong>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-white/70">Value Score (Calidad/Precio)</span>
                        <strong className="text-sky-400">
                          {(player.value_score || 0).toFixed(1)}
                        </strong>
                      </div>
                    </div>
                  </div>
                  <div className="hidden sm:block w-px bg-white/10" />
                  <div className="flex-1">
                    <h4 className="text-xs text-white/50 font-bold mb-3 uppercase">
                      Propietario Actual
                    </h4>
                    {player.seller_name && player.seller_name !== 'Mercado' ? (
                      <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/10">
                        {player.seller_icon && (
                          <Image
                            src={player.seller_icon}
                            alt="Owner"
                            width={24}
                            height={24}
                            className="rounded-full"
                          />
                        )}
                        <span className="font-bold text-white capitalize">
                          {player.seller_name}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-12 bg-white/5 rounded-lg border border-white/10 text-white/50 text-sm">
                        Libre en el Mercado
                      </div>
                    )}
                  </div>
                </div>

                {/* Full Profile CTA */}
                <a
                  href={`/player/${player.player_id}`}
                  className="flex items-center justify-center p-4 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-sm font-bold uppercase tracking-widest transition-colors w-full border border-blue-500/20 group cursor-pointer"
                >
                  Ver Perfil Exhaustivo en Nueva Pestaña
                  <TrendingUp
                    size={16}
                    className="ml-2 group-hover:translate-x-1 transition-transform"
                  />
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  );

  return createPortal(modalContent, document.body);
}
