'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
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
import { getTeamColor } from '@/lib/constants/teamColors';

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

  // Suggested Purchase based on the new recommendation score
  let multiplier = 0.95; // Default lower target (Compra Arriesgada / Evitar)
  if (player.recommendation_score >= 90)
    multiplier = 1.3; // Fichaje Obligatorio
  else if (player.recommendation_score >= 75)
    multiplier = 1.15; // Compra Excelente
  else if (player.recommendation_score >= 50) multiplier = 1.05; // Compra Normal

  const targetPrice = Math.round(player.price * multiplier);

  const modalContent = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className="bg-background border border-border/50 rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl relative"
      >
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={onClose}
            className="bg-black/40 backdrop-blur-md p-2 rounded-full hover:bg-white/20 text-white transition-colors border border-white/10 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* 1. HERO HEADER */}
        <div
          className="h-44 sm:h-52 relative flex items-start px-6 sm:px-8 pt-8 sm:pt-10"
          style={{ backgroundColor: `${teamColor}20` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />

          {/* Photo Column */}
          <div className="w-24 h-24 sm:w-40 sm:h-40 bg-card rounded-2xl overflow-hidden border-4 border-background shadow-2xl flex-shrink-0 relative z-10">
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

          <div className="ml-5 sm:ml-6 text-white flex-1 flex flex-col sm:flex-row justify-between relative z-10 gap-3 h-full pb-4 sm:pb-5">
            {/* Identity Column */}
            <div className="flex flex-col">
              <h2 className="text-2xl sm:text-[34px] font-bold tracking-[0.05em] leading-tight mb-2 uppercase text-white drop-shadow-lg font-display">
                {player.name}
              </h2>
              <div className="flex flex-col gap-2.5 border-l-2 border-white/10 pl-4 mt-1">
                <Link
                  href={`/team/${player.team_id}`}
                  className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
                >
                  {player.team_img && (
                    <Image
                      src={player.team_img}
                      alt={player.team}
                      width={22}
                      height={22}
                      className="object-contain opacity-90"
                    />
                  )}
                  <p
                    className="text-[18px] sm:text-[20px] font-bold tracking-widest font-display uppercase"
                    style={{ color: teamColor }}
                  >
                    {player.team}
                  </p>
                </Link>
                <div>
                  <span
                    className={`inline-block px-4 py-1.5 rounded text-[16px] sm:text-[17px] font-bold uppercase tracking-[0.1em] border font-display shadow-lg ${
                      player.position?.includes('Base') ||
                      player.position === 'G' ||
                      player.position === 'B'
                        ? 'bg-sky-500/20 text-sky-400 border-sky-500/30 shadow-sky-500/5'
                        : player.position?.includes('Alero') ||
                            player.position === 'F' ||
                            player.position === 'A'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-emerald-500/5'
                          : player.position?.includes('Pivot') ||
                              player.position === 'C' ||
                              player.position === 'P'
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/30 shadow-rose-500/5'
                            : 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30 shadow-zinc-500/5'
                    }`}
                  >
                    {player.position}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Metrics Column (Bottom Right) */}
            {details && (
              <div className="hidden sm:flex gap-3 text-right self-end">
                <div className="bg-card/40 border border-white/10 rounded-xl px-5 py-3 backdrop-blur-md min-w-[180px] shadow-xl">
                  <p className="text-[14px] text-white/50 uppercase tracking-[0.2em] mb-1.5 font-display flex items-center justify-end gap-2">
                    Rol Actual
                  </p>
                  <p className="text-xl font-bold text-white flex items-center justify-end gap-2 font-display tracking-wide uppercase">
                    <Clock size={16} className="text-sky-400" /> {roleLabel}
                  </p>
                </div>
                <div className="bg-card/40 border border-white/10 rounded-xl px-5 py-3 backdrop-blur-md min-w-[140px] shadow-xl">
                  <p className="text-[14px] text-white/50 uppercase tracking-[0.2em] mb-1 font-display">
                    Minutos Prom.
                  </p>
                  <p className="text-3xl font-bold text-white tabular-nums font-display tracking-tight">
                    {avgMinutes}
                    <span className="text-base font-normal text-white/20 ml-1">MIN</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. MAIN CONTENT AREA */}
        <div className="p-4 sm:p-5 pt-8 sm:pt-10 flex-1 overflow-y-auto w-full bg-background custom-scrollbar">
          {detailsLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-500"></div>
            </div>
          ) : details ? (
            <div className="flex flex-col gap-6 max-w-6xl mx-auto">
              {/* Mobile Role Details (Shown only on small screens) */}
              <div className="sm:hidden grid grid-cols-2 gap-3 mb-2">
                <div className="bg-[#151820] border border-white/5 rounded-xl p-3">
                  <p className="text-[11px] text-white/40 uppercase tracking-widest font-bold mb-1 font-display">
                    Rol Actual
                  </p>
                  <p className="text-sm font-semibold text-white flex items-center gap-1.5 font-display tracking-wide">
                    <Clock size={12} className="text-sky-400" /> {roleLabel}
                  </p>
                </div>
                <div className="bg-[#151820] border border-white/5 rounded-xl p-3">
                  <p className="text-[11px] text-white/40 uppercase tracking-widest font-bold mb-1 font-display">
                    Min / Partido
                  </p>
                  <p className="text-sm font-semibold text-white tabular-nums font-display tracking-wide">
                    {avgMinutes} min
                  </p>
                </div>
              </div>

              {/* ROW 1: Context & Fantasy Performance */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Contexto del Equipo */}
                <div className="bg-card/40 border border-white/10 rounded-xl p-4 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-white/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  <h4 className="text-[22px] text-sky-400 font-medium uppercase tracking-[0.1em] flex items-center mb-5 font-display border-l-4 border-sky-500/50 pl-3 py-1">
                    <Activity size={18} className="mr-2" /> Estado del Equipo
                  </h4>
                  <div className="flex justify-between items-center mb-4 px-1">
                    <span className="text-[18px] text-white font-bold font-display uppercase tracking-widest">
                      Racha Reciente
                    </span>
                    <div className="flex gap-1.5 font-display">
                      {formArray.map((res, i) => (
                        <span
                          key={i}
                          className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-lg shadow-md border ${res === 'V' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'}`}
                        >
                          {res}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center mb-4 px-1">
                    <span className="text-[18px] text-white font-bold font-display uppercase tracking-widest">
                      % Asistencia
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-medium text-white font-display tracking-tight leading-none">
                        {details.player_total_matches}/{details.team_total_matches}
                      </span>
                      <span className="text-xl font-medium text-white/90 font-display uppercase tracking-tight leading-none ml-1">
                        Partidos
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center bg-white/5 rounded-lg p-2.5">
                    <span className="text-[18px] font-bold text-white flex items-center gap-1.5 font-display uppercase tracking-wide">
                      Prob. Playoffs
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-black/40 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            (details.playoff_probability || 0) >= 70
                              ? 'bg-emerald-400'
                              : (details.playoff_probability || 0) >= 40
                                ? 'bg-amber-400'
                                : 'bg-rose-400'
                          }`}
                          style={{ width: `${details.playoff_probability || 0}%` }}
                        />
                      </div>
                      <span
                        className={`text-xl font-bold tabular-nums font-display ${
                          (details.playoff_probability || 0) >= 70
                            ? 'text-emerald-400'
                            : (details.playoff_probability || 0) >= 40
                              ? 'text-amber-400'
                              : 'text-rose-400'
                        }`}
                      >
                        {details.playoff_probability || 0}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Fiabilidad / Techo y Suelo */}
                <div className="bg-card/40 border border-white/10 rounded-xl p-4 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  <h4 className="text-[22px] text-indigo-400 font-medium uppercase tracking-[0.1em] flex items-center mb-5 font-display border-l-4 border-indigo-500/50 pl-3 py-1">
                    <BarChart3 size={18} className="mr-2" /> Fiabilidad Biwenger
                  </h4>
                  <div className="flex justify-between items-center mb-5 px-1">
                    <span className="text-[18px] text-white font-bold font-display uppercase tracking-widest">
                      Promedio Puntos
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-medium text-white tabular-nums font-display tracking-tight leading-none">
                        {details.season_avg !== undefined && details.season_avg !== null
                          ? Number(details.season_avg).toFixed(1)
                          : player.average !== undefined
                            ? Number(player.average).toFixed(1)
                            : '-'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-end justify-between gap-4 mt-2">
                    <div className="flex-1 flex flex-col items-center bg-rose-500/5 border border-rose-500/10 rounded-lg p-3">
                      <span className="text-[16px] text-rose-400/80 font-semibold uppercase tracking-[0.1em] mb-1.5 font-display">
                        Suelo
                      </span>
                      <span className="text-3xl font-medium text-rose-400 leading-none font-display tracking-tight">
                        {floor}
                      </span>
                    </div>
                    <div className="flex-1 flex flex-col items-center bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3">
                      <span className="text-[16px] text-emerald-400/80 font-semibold uppercase tracking-[0.1em] mb-1.5 font-display">
                        Techo
                      </span>
                      <span className="text-3xl font-medium text-emerald-400 leading-none font-display tracking-tight">
                        {ceiling}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Volumen Ofensivo / Tiros */}
                <div className="bg-card/40 border border-white/10 rounded-xl p-4 relative overflow-hidden group md:col-span-2 lg:col-span-1">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-sky-500/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  <h4 className="text-[22px] text-emerald-400 font-medium uppercase tracking-[0.1em] flex items-center mb-5 font-display border-l-4 border-emerald-500/50 pl-3 py-1">
                    <Target size={18} className="mr-2" /> Volumen Ofensivo (%)
                  </h4>
                  <div className="space-y-3 font-display mt-2 px-1">
                    <div className="flex items-center gap-3">
                      <span className="text-[18px] text-white w-7 font-bold tracking-widest">
                        T2
                      </span>
                      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sky-400/80 rounded-full"
                          style={{ width: `${t2pct}%` }}
                        ></div>
                      </div>
                      <span className="text-xl font-medium text-white w-12 text-right tabular-nums tracking-tight">
                        {t2pct}%
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[18px] text-white w-7 font-bold tracking-widest">
                        T3
                      </span>
                      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-400/80 rounded-full"
                          style={{ width: `${t3pct}%` }}
                        ></div>
                      </div>
                      <span className="text-xl font-medium text-white w-12 text-right tabular-nums tracking-tight">
                        {t3pct}%
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[18px] text-white w-7 font-bold tracking-widest">
                        TL
                      </span>
                      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-400/80 rounded-full"
                          style={{ width: `${ftpct}%` }}
                        ></div>
                      </div>
                      <span className="text-xl font-medium text-white w-12 text-right tabular-nums tracking-tight">
                        {ftpct}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ROW 2: Calendario y Mercado */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Calendario 3 Rivales */}
                <div className="bg-card/40 border border-white/10 rounded-xl p-4 flex flex-col">
                  <h4 className="text-[22px] text-amber-400 font-medium uppercase tracking-[0.1em] flex items-center mb-5 font-display border-l-4 border-amber-500/50 pl-3 py-1">
                    <Calendar size={18} className="mr-2" /> Próximos Partidos (Próx 3)
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
                      const oppImg = isHome ? match.away_img : match.home_img;

                      // Use difficulty from the backend
                      const diffLevel = match.difficulty || 'Normal';

                      let diffColor = 'bg-amber-500/10 border-amber-500/20 text-amber-400';
                      let diffBg = 'bg-amber-500/50';
                      let DiffIcon = Activity;

                      if (diffLevel === 'Fácil') {
                        diffColor = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
                        diffBg = 'bg-emerald-500/50';
                        DiffIcon = ShieldCheck;
                      } else if (diffLevel === 'Duro') {
                        diffColor = 'bg-rose-500/10 border-rose-500/20 text-rose-400';
                        diffBg = 'bg-rose-500/50';
                        DiffIcon = ShieldAlert;
                      }

                      return (
                        <div
                          key={i}
                          className="bg-background border border-border/50 rounded-lg p-2.5 flex flex-col items-center justify-center text-center relative overflow-hidden group"
                        >
                          <div className={`absolute top-0 w-full h-1 ${diffBg}`}></div>
                          <span className="text-[12px] text-white/40 uppercase mb-2 font-bold tracking-wider">
                            {matchDate.toLocaleDateString('es-ES', {
                              weekday: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          {oppImg ? (
                            <Image
                              src={oppImg}
                              alt={oppName || 'Rival'}
                              width={40}
                              height={40}
                              className="mb-1.5 mt-1 object-contain h-10 w-auto drop-shadow-md"
                            />
                          ) : (
                            <span className="text-xs font-black text-white leading-tight line-clamp-2 md:line-clamp-1 h-8 md:h-auto flex items-center mb-1">
                              {oppName || 'TBD'}
                            </span>
                          )}
                          <div className="flex items-center gap-0.5 mt-2">
                            <span className="text-[9px] bg-white/5 px-1 py-[2px] rounded uppercase font-bold text-white/30 tracking-wider leading-none">
                              {isHome ? 'Local' : 'Visit'}
                            </span>
                            <span
                              className={`text-[9px] px-1 py-[2px] rounded uppercase font-bold flex items-center gap-0.5 tracking-wider leading-none ${diffColor}`}
                            >
                              <DiffIcon size={8} /> {diffLevel}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Contexto Bursátil */}
                <div className="bg-card/40 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
                  <h4 className="text-[22px] text-sky-400 font-medium uppercase tracking-[0.1em] flex items-center mb-5 font-display border-l-4 border-sky-400/50 pl-3 py-1">
                    <TrendingUp size={18} className="mr-2" /> Mercado Bursátil
                  </h4>
                  <div className="flex justify-between items-center bg-black/20 backdrop-blur-sm rounded-xl border border-white/5 p-4 mb-3">
                    <div className="flex flex-col">
                      <span className="text-[18px] font-bold text-white uppercase tracking-widest mb-1 font-display">
                        Precio Actual
                      </span>
                      <span className="text-3xl font-medium text-white tabular-nums leading-none font-display tracking-tight">
                        {new Intl.NumberFormat('es-ES').format(player.price)}{' '}
                        <span className="text-xl font-normal text-white/20 ml-1">€</span>
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[18px] font-bold text-sky-400 font-display uppercase tracking-widest mb-1">
                        Target sugerido
                      </span>
                      <span className="text-3xl font-medium text-sky-400 tabular-nums leading-none font-display tracking-tight">
                        {new Intl.NumberFormat('es-ES').format(targetPrice)}{' '}
                        <span className="text-xl font-normal text-sky-400/40 ml-1">€</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-4 border-t border-white/5 mt-auto font-display">
                    <span className="text-[18px] font-bold uppercase tracking-widest text-white">
                      Demanda (Ownership)
                    </span>
                    <div className="flex items-center gap-2">
                      {player.seller_name && player.seller_name !== 'Mercado' ? (
                        <Link
                          href={`/user/${player.seller_id}`}
                          className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
                        >
                          <span className="text-lg font-medium text-white font-display">
                            En propiedad
                          </span>
                          {player.seller_icon && (
                            <Image
                              src={player.seller_icon}
                              alt="Owner"
                              width={18}
                              height={18}
                              className="rounded-full border border-white/20"
                            />
                          )}
                        </Link>
                      ) : (
                        <span className="text-lg font-medium text-white font-display">
                          Mercado Libre
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <a
                  href={`/player/${player.player_id}`}
                  className="flex justify-center items-center w-full bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary font-black text-[18px] uppercase tracking-[0.2em] py-5 rounded-xl transition-all group cursor-pointer font-display"
                >
                  Ver Informe Completo en BiwengerStats
                  <TrendingUp
                    size={16}
                    className="ml-3 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all"
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
