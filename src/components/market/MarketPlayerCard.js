import React, { useMemo } from 'react';
import Image from 'next/image';
import {
  TrendingUp,
  TrendingDown,
  Star,
  Info,
  ChevronDown,
  ChevronUp,
  Calendar,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApiData } from '@/lib/hooks/useApiData';

function getPurchaseHeuristic(player) {
  const { value_score, price_trend } = player;
  if (value_score > 30 && price_trend > 0) {
    return {
      label: 'Compra Excelente',
      color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      dot: 'bg-emerald-400',
      icon: <TrendingUp size={11} className="mr-1" />,
    };
  } else if (value_score < 10 || price_trend < 0) {
    return {
      label: 'Compra Arriesgada',
      color: 'bg-red-500/15 text-red-400 border-red-500/30',
      dot: 'bg-red-400',
      icon: <TrendingDown size={11} className="mr-1" />,
    };
  } else {
    return {
      label: 'Compra Normal',
      color: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      dot: 'bg-amber-400',
      icon: <Star size={11} className="mr-1" />,
    };
  }
}

const positionColors = {
  Base: { text: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/30', initial: 'B' },
  Alero: { text: 'text-green-400', bg: 'bg-green-400/10 border-green-400/30', initial: 'A' },
  Pívot: { text: 'text-red-400', bg: 'bg-red-400/10 border-red-400/30', initial: 'P' },
  Pivot: { text: 'text-red-400', bg: 'bg-red-400/10 border-red-400/30', initial: 'P' },
};

function ScoreBar({ score }) {
  if (score === null) {
    return (
      <div className="flex-1 h-8 bg-rose-950/50 border border-rose-900/50 rounded flex items-center justify-center">
        <span className="text-sm text-rose-500 font-bold leading-none pb-0.5">×</span>
      </div>
    );
  }
  const color =
    score < 0
      ? 'bg-rose-700 text-white border-rose-600/50'
      : score < 6
        ? 'bg-amber-700 text-white border-amber-600/50'
        : score < 10
          ? 'bg-emerald-700 text-white border-emerald-600/50'
          : 'bg-sky-700 text-white border-sky-600/50';

  return (
    <div
      className={`flex-1 h-8 rounded flex items-center justify-center border shadow-inner ${color}`}
    >
      <span className="text-xs font-bold font-mono">{score}</span>
    </div>
  );
}

// Global user colors from Biwenger structure
const userColors = [
  '#f43f5e', // rose-500
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#8b5cf6', // violet-500
  '#f59e0b', // amber-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#84cc16', // lime-500
  '#a855f7', // purple-500
  '#14b8a6', // teal-500
];

export default function MarketPlayerCard({ player, isExpanded, onToggleExpand }) {
  const heuristic = getPurchaseHeuristic(player);
  const posStyle = positionColors[player.position] || {
    text: 'text-white/60',
    bg: 'bg-white/5 border-white/10',
  };

  // Fetch expanded player insights conditionally
  const { data: detailsData, loading: detailsLoading } = useApiData(
    () => `/api/players/${player.player_id}/stats`,
    { skip: !isExpanded }
  );

  const details = detailsData?.data;

  // Parse up to 5 scores. The backend strings them chronologically (e.g. "5,12,0,22,-1").
  // We reverse them so the most recent match appears on the LEFT of the visualizer.
  const recentScores = player.recent_scores
    ? player.recent_scores
        .split(',')
        .filter((s) => s.trim() !== '')
        .map((s) => (s === 'X' ? null : parseInt(s, 10)))
    : [];

  // Ensure we always have exactly 5 elements mapped
  const displayScores = Array(5)
    .fill(null)
    .map((_, i) => (recentScores[i] !== undefined ? recentScores[i] : null));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        layout: { type: 'spring', bounce: 0.15, duration: 0.5 },
        default: { duration: 0.3, ease: 'easeOut' },
      }}
      className={`relative bg-[#111318] border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-xl hover:border-white/20 transition-all duration-300 hover:shadow-2xl group ${
        isExpanded
          ? 'md:col-span-2 lg:col-span-2 lg:flex-row ring-1 ring-emerald-500/50'
          : 'hover:-translate-y-0.5'
      }`}
      style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}
    >
      {/* ── LEFT / MAIN CONTENT CARD ── */}
      <motion.div
        layout="size"
        className={`flex flex-col flex-1 min-w-0 ${isExpanded ? 'lg:w-[320px] lg:flex-none border-r border-white/10' : ''}`}
      >
        {/* Subtle top accent line based on heuristic */}
        <div
          className={`h-0.5 w-full ${
            heuristic.dot === 'bg-emerald-400'
              ? 'bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent'
              : heuristic.dot === 'bg-red-400'
                ? 'bg-gradient-to-r from-transparent via-red-500/60 to-transparent'
                : 'bg-gradient-to-r from-transparent via-amber-500/60 to-transparent'
          }`}
        />

        <div className="p-4 flex-1 flex flex-col gap-4">
          {/* ── ROW 1: Player identity ── */}
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-white/5 border border-white/10 flex-shrink-0 flex items-center justify-center">
              {player.img ? (
                <Image
                  src={player.img}
                  alt={player.name}
                  fill
                  className="object-cover object-top scale-[1.8] origin-top translate-y-[10%]"
                  sizes="56px"
                />
              ) : (
                <span className="text-white/30 font-bold text-xl">?</span>
              )}
            </div>

            {/* Name + position */}
            <div className="flex-1 min-w-0">
              <h3
                className="text-lg font-bold text-white leading-tight truncate"
                title={player.name}
              >
                {player.name}
              </h3>
              <div className="flex items-center gap-2 mt-1.5">
                {player.position && (
                  <span
                    className={`text-sm font-bold px-2 py-0.5 rounded border ${posStyle.text} ${posStyle.bg} uppercase tracking-wide flex-shrink-0 leading-none`}
                  >
                    {posStyle.initial || player.position?.charAt(0)}
                  </span>
                )}
              </div>
            </div>

            {/* Team logo right side */}
            {player.team_img && (
              <div className="w-12 h-12 ml-1 flex-shrink-0 flex items-center justify-center">
                <Image
                  src={player.team_img}
                  alt={player.team || 'Team'}
                  width={48}
                  height={48}
                  className="object-contain drop-shadow-md"
                />
              </div>
            )}
          </div>

          {/* ── DIVIDER ── */}
          <div className="h-px bg-white/6" />

          {/* ── ROW 2: Price ── */}
          <div className="flex flex-col items-center justify-center">
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-0.5 text-center">
                Precio
              </p>
              <p className="text-2xl font-bold text-white tabular-nums leading-none text-center">
                {new Intl.NumberFormat('es-ES').format(player.price)}
                <span className="text-base text-white/40 font-normal ml-1">€</span>
              </p>
            </div>
          </div>

          {/* ── ROW 3: Stats row ── */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/4 border border-white/8 rounded-xl p-3 flex flex-col gap-0.5">
              <span className="text-[10px] text-white/30 uppercase tracking-widest font-semibold">
                Total pts
              </span>
              <span className="text-xl font-bold text-emerald-400 tabular-nums leading-none">
                {player.total_points}
              </span>
            </div>
            <div className="bg-white/4 border border-white/8 rounded-xl p-3 flex flex-col gap-0.5 relative">
              <span className="text-[10px] text-white/30 uppercase tracking-widest font-semibold flex items-center gap-1">
                Media <Info size={9} className="opacity-40" />
              </span>
              <span className="text-xl font-bold text-sky-400 tabular-nums leading-none">
                {player.season_avg}
              </span>
            </div>
          </div>

          {/* ── ROW 4: Recent form ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-white/30 uppercase tracking-widest font-semibold">
                Forma reciente
              </span>
              <span className="text-[10px] text-white/30 font-medium">
                Media:{' '}
                <span className="text-emerald-400 font-bold">
                  {player.avg_recent_points?.toFixed(1) || '0.0'}
                </span>{' '}
                pts
              </span>
            </div>
            <div className="flex gap-1">
              {displayScores.map((score, i) => (
                <ScoreBar key={i} score={score} />
              ))}
            </div>
          </div>

          {/* ── ROW 5: Heuristic & Seller ── */}
          <div className="flex items-center justify-between mt-1 pt-3 border-t border-white/6">
            <div
              className={`flex items-center text-[10px] font-semibold px-2 py-1 rounded border ${heuristic.color}`}
            >
              {heuristic.icon}
              {heuristic.label}
            </div>
            <div className="flex-shrink-0 flex flex-col items-end">
              {player.seller_icon && player.seller_name !== 'Mercado' ? (
                <div
                  className="flex items-center gap-1.5 opacity-90 px-2 py-1 rounded-full border border-white/10"
                  style={{
                    backgroundColor:
                      player.seller_color !== undefined && player.seller_color !== null
                        ? `${userColors[player.seller_color % userColors.length]}15` // 15% opacity background
                        : 'rgba(255,255,255,0.05)',
                    borderColor:
                      player.seller_color !== undefined && player.seller_color !== null
                        ? `${userColors[player.seller_color % userColors.length]}30`
                        : 'rgba(255,255,255,0.1)',
                  }}
                >
                  <span
                    className="text-[10px] font-bold capitalize"
                    style={{
                      color:
                        player.seller_color !== undefined && player.seller_color !== null
                          ? userColors[player.seller_color % userColors.length]
                          : 'rgba(255,255,255,0.6)',
                    }}
                  >
                    {player.seller_name}
                  </span>
                  {player.seller_icon && (
                    <Image
                      src={player.seller_icon}
                      alt={player.seller_name}
                      width={14}
                      height={14}
                      className="rounded-full"
                    />
                  )}
                </div>
              ) : (
                <div className="opacity-80 px-2 py-1 rounded-full border border-white/10 bg-white/5">
                  <span className="text-[10px] text-white/40 font-medium">Biwenger</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── ACTION BUTTON ── */}
        <button
          onClick={onToggleExpand}
          className={`w-full py-3 hover:bg-white/8 text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 border-t border-white/8 cursor-pointer group/btn mt-auto ${
            isExpanded ? 'bg-white/10 text-white' : 'bg-white/4 text-white/70 hover:text-white'
          }`}
        >
          {isExpanded ? (
            <>
              <ChevronUp
                size={18}
                className="opacity-60 group-hover/btn:opacity-100 transition-opacity"
              />
              Cerrar Análisis
            </>
          ) : (
            <>
              <ChevronDown
                size={18}
                className="opacity-60 group-hover/btn:opacity-100 transition-opacity"
              />
              Analizar Fichaje
            </>
          )}
        </button>
      </motion.div>

      {/* ── RIGHT / EXPANDED ANALYTICS DRAWER ── */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            layout="size"
            initial={{ opacity: 0, width: 0, height: 0 }}
            animate={{ opacity: 1, width: 'auto', height: 'auto' }}
            exit={{ opacity: 0, width: 0, height: 0 }}
            transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
            className="flex-1 bg-[#0b0c10] overflow-hidden flex flex-col"
          >
            <motion.div
              layout="position"
              className="p-5 lg:p-6 overflow-y-auto w-full min-w-[280px]"
            >
              <h3 className="text-lg font-bold text-white mb-4">Análisis Detallado</h3>

              {/* Next Match Indicator */}
              <div className="mb-6 bg-blue-900/10 border border-blue-900/30 p-4 rounded-xl">
                <h4 className="text-xs font-bold text-blue-400 uppercase flex items-center mb-2">
                  <Calendar size={14} className="mr-1.5" /> Próximo Partido
                </h4>
                {player.next_opponent_id ? (
                  <div className="flex items-center space-x-3">
                    <span className="text-white/50 text-sm">vs</span>
                    {player.next_opponent_img && (
                      <Image
                        src={player.next_opponent_img}
                        alt={player.next_opponent_name}
                        width={20}
                        height={20}
                      />
                    )}
                    <span className="font-bold text-white text-sm">
                      {player.next_opponent_name}
                    </span>
                    <span className="text-xs text-white/50 ml-auto">
                      {new Date(player.next_match_date).toLocaleDateString('es-ES', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>
                ) : (
                  <div className="text-xs text-white/50">Sin partidos próximos.</div>
                )}
              </div>

              {/* Detailed Stats */}
              <h4 className="text-xs font-bold text-white/50 uppercase mb-3">
                Estadísticas de Temporada
              </h4>
              {detailsLoading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-4 w-3/4 bg-white/10 rounded"></div>
                  <div className="h-4 w-1/2 bg-white/10 rounded"></div>
                  <div className="h-20 w-full bg-white/5 rounded-xl mt-4"></div>
                </div>
              ) : details ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 border border-white/10 p-3 rounded-lg flex justify-between items-center">
                      <span className="text-xs text-white/60">Partidos</span>
                      <span className="font-bold text-white">{details.games_played}</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-3 rounded-lg flex justify-between items-center">
                      <span className="text-xs text-white/60">Pts Totales</span>
                      <span className="font-bold text-emerald-400">{details.total_points}</span>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-sm text-white/70">
                    <p className="flex justify-between mb-2">
                      <span>Valoración Mánager</span>
                      <strong className="text-white">{player.value_score} Pts/M€</strong>
                    </p>
                    <p className="flex justify-between">
                      <span>Tendencia Mercado</span>
                      <strong
                        className={player.price_trend > 0 ? 'text-green-400' : 'text-red-400'}
                      >
                        {player.price_trend > 0 ? '+' : ''}
                        {new Intl.NumberFormat('es-ES').format(player.price_trend)} €
                      </strong>
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/10 text-right">
                    <a
                      href={`/players/${player.player_id}`}
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium inline-flex items-center transition"
                    >
                      Perfil Completo <TrendingUp size={14} className="ml-1" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-white/40 italic p-4 bg-white/5 rounded-xl border border-white/10 text-center">
                  Error cargando detalles.
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
