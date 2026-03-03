'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import Image from 'next/image';
import {
  X,
  Calendar,
  Activity,
  BarChart3,
  TrendingUp,
  Clock,
  Target,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { useApiData } from '@/lib/hooks/useApiData';

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
  for (let i = 0; i < teamName.length; i++) hash = teamName.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

export default function ExpandedPlayerModal({ player, onClose }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line
    setMounted(true);
  }, []);

  useEffect(() => {
    if (player) document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [player]);

  const { data: details, loading: detailsLoading } = useApiData(
    () => `/api/players/${player?.player_id}/stats`,
    { skip: !player }
  );

  const teamColor = getTeamColor(player?.team);

  if (!player || !mounted) return null;

  // Compute Roles and Minutes
  const recentPlayedMatches = (details?.recentMatches || []).filter(
    (m) => m.minutes_played && m.minutes_played > 0
  );
  const totalMinutes = recentPlayedMatches.reduce((sum, m) => sum + (m.minutes_played || 0), 0);
  const avgMinutes = recentPlayedMatches.length
    ? Math.round(totalMinutes / recentPlayedMatches.length)
    : 0;

  let roleLabel = 'Fondo de Banquillo';
  if (avgMinutes >= 24) roleLabel = 'Titular Fijo';
  else if (avgMinutes >= 18) roleLabel = 'Titular/Sexto Hombre';
  else if (avgMinutes >= 12) roleLabel = 'Rotación';

  // Compute Floor/Ceiling
  const scores = recentPlayedMatches
    .map((m) => m.fantasy_points)
    .filter((p) => typeof p === 'number');
  const ceiling = scores.length ? Math.max(...scores) : '-';
  const floor = scores.length ? Math.min(...scores) : '-';

  // Compute Shooting %
  const adv = details?.advancedStats || {};
  const t2pct = adv.two_points_attempted
    ? Math.round((adv.two_points_made / adv.two_points_attempted) * 100)
    : 0;
  const t3pct = adv.three_points_attempted
    ? Math.round((adv.three_points_made / adv.three_points_attempted) * 100)
    : 0;
  const ftpct = adv.free_throws_attempted
    ? Math.round((adv.free_throws_made / adv.free_throws_attempted) * 100)
    : 0;

  // Compute Team Form
  const teamFormMatches = (details?.recentMatches || [])
    .filter((m) => m.home_score !== null)
    .slice(0, 3)
    .reverse();
  const formArray = teamFormMatches.map((m) => {
    const isHome = m.home_id === player.team_id;
    if (isHome) return m.home_score > m.away_score ? 'V' : 'D';
    else return m.away_score > m.home_score ? 'V' : 'D';
  });

  // Next Matches Setup
  const nextMatches = details?.nextMatches || [];
  // Ensure we always map 3 blocks even if empty
  const calendarBlocks = [0, 1, 2].map((i) => nextMatches[i] || null);

  // Suggested Purchase
  const targetPrice = Math.round(
    player.price * (player.value_score > 20 ? 1.15 : player.value_score > 15 ? 1.05 : 0.95)
  );

  const modalContent = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] bg-[#0b0c10]/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <motion.div
        layoutId={`player-card-${player.player_id}`}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0b0c10] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] relative"
      >
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={onClose}
            className="bg-black/40 backdrop-blur-md p-2 rounded-full hover:bg-white/20 text-white transition-colors border border-white/10"
          >
            <X size={18} />
          </button>
        </div>

        {/* 1. HERO HEADER */}
        <div
          className="h-32 sm:h-40 relative flex items-end px-6 sm:px-8 pb-5"
          style={{ backgroundColor: `${teamColor}30` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c10] via-[#0b0c10]/80 to-transparent pointer-events-none" />

          <div className="w-20 h-20 sm:w-28 sm:h-28 bg-[#151820] rounded-2xl overflow-hidden translate-y-6 sm:translate-y-8 border-4 border-[#0b0c10] shadow-2xl flex-shrink-0 relative">
            {player.img ? (
              <Image
                src={player.img}
                alt={player.name}
                fill
                className="object-cover object-top scale-110"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/20 font-bold text-3xl">
                {player.name?.charAt(0)}
              </div>
            )}
          </div>

          <div className="ml-5 sm:ml-6 mb-1 text-white flex-1 flex flex-col sm:flex-row justify-between sm:items-end relative z-10 gap-3">
            <div>
              <h2 className="text-xl sm:text-3xl font-black tracking-tight leading-none mb-1.5">
                {player.name}
              </h2>
              <div className="flex items-center gap-2">
                {player.team_img && (
                  <Image
                    src={player.team_img}
                    alt={player.team}
                    width={18}
                    height={18}
                    className="object-contain"
                  />
                )}
                <p
                  className="text-xs sm:text-sm font-semibold tracking-wide"
                  style={{ color: teamColor }}
                >
                  {player.team} • {player.position}
                </p>
              </div>
            </div>

            {/* Top Right Quick Metrics */}
            {details && (
              <div className="hidden sm:flex gap-3 text-right">
                <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 backdrop-blur-md">
                  <p className="text-[9px] text-white/50 uppercase tracking-widest font-bold mb-0.5 mt-0.5">
                    Rol Actual
                  </p>
                  <p className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Clock size={12} className="text-sky-400" /> {roleLabel}
                  </p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 backdrop-blur-md">
                  <p className="text-[9px] text-white/50 uppercase tracking-widest font-bold mb-0.5 mt-0.5">
                    Minutos Prom.
                  </p>
                  <p className="text-sm font-bold text-white tabular-nums">
                    {avgMinutes} <span className="text-xs font-normal text-white/40">min</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. MAIN CONTENT AREA */}
        <div className="p-5 sm:p-8 pt-10 sm:pt-14 flex-1 overflow-y-auto w-full bg-[#0b0c10] custom-scrollbar">
          {detailsLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-500"></div>
            </div>
          ) : details ? (
            <div className="flex flex-col gap-6 max-w-6xl mx-auto">
              {/* Mobile Role Details (Shown only on small screens) */}
              <div className="sm:hidden grid grid-cols-2 gap-3 mb-2">
                <div className="bg-[#151820] border border-white/5 rounded-xl p-3">
                  <p className="text-[9px] text-white/50 uppercase tracking-widest font-bold mb-1">
                    Rol Actual
                  </p>
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Clock size={12} className="text-sky-400" /> {roleLabel}
                  </p>
                </div>
                <div className="bg-[#151820] border border-white/5 rounded-xl p-3">
                  <p className="text-[9px] text-white/50 uppercase tracking-widest font-bold mb-1">
                    Min / Partido
                  </p>
                  <p className="text-xs font-bold text-white tabular-nums">{avgMinutes} min</p>
                </div>
              </div>

              {/* ROW 1: Context & Fantasy Performance */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Contexto del Equipo */}
                <div className="bg-[#151820] border border-white/5 rounded-xl p-5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-white/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  <h4 className="text-[10px] text-white/40 font-bold uppercase tracking-widest flex items-center mb-4">
                    <Activity size={12} className="mr-1.5" /> Estado del Equipo
                  </h4>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-white/80 font-medium">Racha Reciente</span>
                    <div className="flex gap-1">
                      {formArray.length > 0 ? (
                        formArray.map((res, i) => (
                          <span
                            key={i}
                            className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded ${res === 'V' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}
                          >
                            {res}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-white/30 italic">Sin datos</span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/80 font-medium">% Asistencia</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">
                        {details.player_total_matches}/{details.team_total_matches}
                      </span>
                      <span className="text-[10px] bg-white/10 text-white/50 px-1.5 py-0.5 rounded uppercase">
                        Partidos
                      </span>
                    </div>
                  </div>
                </div>

                {/* Fiabilidad / Techo y Suelo */}
                <div className="bg-[#151820] border border-white/5 rounded-xl p-5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  <h4 className="text-[10px] text-white/40 font-bold uppercase tracking-widest flex items-center mb-4">
                    <BarChart3 size={12} className="mr-1.5" /> Fiabilidad Biwenger
                  </h4>
                  <div className="flex items-end justify-between gap-4 mt-2">
                    <div className="flex-1 flex flex-col items-center bg-rose-500/5 border border-rose-500/10 rounded-lg p-3">
                      <span className="text-[10px] text-rose-400/70 font-bold uppercase tracking-wider mb-1">
                        Suelo (Peor)
                      </span>
                      <span className="text-2xl font-black text-rose-400 leading-none">
                        {floor}
                      </span>
                    </div>
                    <div className="flex-1 flex flex-col items-center bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3">
                      <span className="text-[10px] text-emerald-400/70 font-bold uppercase tracking-wider mb-1">
                        Techo (Mejor)
                      </span>
                      <span className="text-2xl font-black text-emerald-400 leading-none">
                        {ceiling}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Volumen Ofensivo / Tiros */}
                <div className="bg-[#151820] border border-white/5 rounded-xl p-5 relative overflow-hidden group md:col-span-2 lg:col-span-1">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-sky-500/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  <h4 className="text-[10px] text-white/40 font-bold uppercase tracking-widest flex items-center mb-4">
                    <Target size={12} className="mr-1.5" /> Volumen Ofensivo (%)
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-white/50 w-6 font-bold">T2</span>
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sky-400 rounded-full"
                          style={{ width: `${t2pct}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-bold text-white w-8 text-right tabular-nums">
                        {t2pct}%
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-white/50 w-6 font-bold">T3</span>
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-400 rounded-full"
                          style={{ width: `${t3pct}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-bold text-white w-8 text-right tabular-nums">
                        {t3pct}%
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-white/50 w-6 font-bold">TL</span>
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 rounded-full"
                          style={{ width: `${ftpct}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-bold text-white w-8 text-right tabular-nums">
                        {ftpct}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ROW 2: Calendario y Mercado */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Calendario 3 Rivales */}
                <div className="bg-[#151820] border border-white/5 rounded-xl p-5 flex flex-col">
                  <h4 className="text-[10px] text-white/40 font-bold uppercase tracking-widest flex items-center mb-4">
                    <Calendar size={12} className="mr-1.5" /> Calendario FAS (Próx 3)
                  </h4>
                  <div className="grid grid-cols-3 gap-2 flex-1">
                    {calendarBlocks.map((match, i) => {
                      if (!match)
                        return (
                          <div
                            key={i}
                            className="bg-white/5 border border-white/5 rounded-lg border-dashed flex items-center justify-center opacity-40"
                          >
                            <span className="text-[10px] text-white/30 uppercase text-center">
                              Sin
                              <br />
                              partido
                            </span>
                          </div>
                        );

                      const matchDate = new Date(match.date || match.match_date);
                      const isHome = match.home_id === player.team_id;
                      const oppName = isHome ? match.away_team : match.home_team;

                      // Simple pseudo-difficulty logic
                      const easyTeams = ['ALBA', 'ASVEL', 'Virtus', 'Paris'];
                      const isEasy = easyTeams.some((t) => oppName?.includes(t));
                      const diffColor = isEasy
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/10 border-rose-500/20 text-rose-400';
                      const DiffIcon = isEasy ? ShieldCheck : ShieldAlert;

                      return (
                        <div
                          key={i}
                          className="bg-[#111318] border border-white/10 rounded-lg p-2.5 flex flex-col items-center justify-center text-center relative overflow-hidden group"
                        >
                          <div
                            className={`absolute top-0 w-full h-1 ${isEasy ? 'bg-emerald-500/50' : 'bg-rose-500/50'}`}
                          ></div>
                          <span className="text-[9px] text-white/40 uppercase mb-2 font-bold tracking-wider">
                            {matchDate.toLocaleDateString('es-ES', {
                              weekday: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          <span className="text-xs font-black text-white leading-tight line-clamp-2 md:line-clamp-1 h-8 md:h-auto flex items-center mb-1">
                            {oppName || 'TBD'}
                          </span>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="text-[8px] bg-white/10 px-1.5 py-0.5 rounded uppercase font-bold text-white/50">
                              {isHome ? 'Local' : 'Visit'}
                            </span>
                            <span
                              className={`text-[8px] px-1 py-0.5 rounded uppercase font-bold flex items-center gap-0.5 ${diffColor}`}
                            >
                              <DiffIcon size={8} /> {isEasy ? 'Fácil' : 'Duro'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Contexto Bursátil */}
                <div className="bg-[#151820] border border-white/5 rounded-xl p-5 flex flex-col justify-between">
                  <h4 className="text-[10px] text-white/40 font-bold uppercase tracking-widest flex items-center mb-4">
                    <TrendingUp size={12} className="mr-1.5" /> Mercado Bursátil
                  </h4>
                  <div className="flex justify-between items-center bg-[#111318] rounded-xl border border-white/5 p-4 mb-4">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-1.5">
                        Precio Actual
                      </span>
                      <span className="text-2xl font-black text-white tabular-nums leading-none">
                        {new Intl.NumberFormat('es-ES').format(player.price)}{' '}
                        <span className="text-sm font-normal text-white/40">€</span>
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] font-bold text-sky-400/60 uppercase tracking-widest mb-1.5">
                        Target sugerido
                      </span>
                      <span className="text-2xl font-black text-sky-400 tabular-nums leading-none">
                        {new Intl.NumberFormat('es-ES').format(targetPrice)}{' '}
                        <span className="text-sm font-normal text-sky-400/50">€</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-3 border-t border-white/5 mt-auto">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">
                      Demanda (Ownership)
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">
                        {player.seller_name && player.seller_name !== 'Mercado'
                          ? 'En propiedad'
                          : 'Mercado Libre'}
                      </span>
                      {player.seller_name &&
                      player.seller_name !== 'Mercado' &&
                      player.seller_icon ? (
                        <Image
                          src={player.seller_icon}
                          alt="Owner"
                          width={18}
                          height={18}
                          className="rounded-full border border-white/20"
                        />
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <a
                  href={`/player/${player.player_id}`}
                  target="_blank"
                  className="flex justify-center items-center w-full bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 font-bold text-[11px] uppercase tracking-widest py-4 rounded-xl transition-colors group cursor-pointer"
                >
                  Ver Informe Completo en BiwengerStats
                  <TrendingUp
                    size={14}
                    className="ml-2 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all"
                  />
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center text-white/40 text-sm italic py-20">
              Datos de análisis no disponibles.
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );

  return createPortal(modalContent, document.body);
}
