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

  return (
    <div
      className={`relative group perspective-[1000px] hover:-translate-y-0.5 transition-transform duration-300 ${isExpanded ? 'z-50' : 'z-10'}`}
    >
      <motion.div
        className="absolute inset-0 preserve-3d"
        animate={{ rotateY: isExpanded ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        {/* Lado Frontal */}
        <div className="absolute inset-0 backface-hidden">
          <CardFront
            player={player}
            heuristic={heuristic}
            posStyle={posStyle}
            onToggleExpand={onToggleExpand}
          />
        </div>

        {/* Lado Trasero (Análisis) */}
        <div
          className="absolute inset-0 backface-hidden bg-[#0b0c10] border-2 border-emerald-500/50 rounded-2xl overflow-hidden flex flex-col shadow-2xl"
          style={{ transform: 'rotateY(180deg)' }}
        >
          <CardBack player={player} isExpanded={isExpanded} onToggleExpand={onToggleExpand} />
        </div>
      </motion.div>

      {/* Invisible spacer to maintain fixed height/aspect ratio for the 3D space */}
      {/* 400px is roughly the height we need, but we can adjust to match the Front strictly */}
      <div className="invisible pointer-events-none">
        <CardFront
          player={player}
          heuristic={heuristic}
          posStyle={posStyle}
          onToggleExpand={() => {}}
        />
      </div>
    </div>
  );
}

// ── FRONT FACE COMPONENT ──
function CardFront({ player, heuristic, posStyle, onToggleExpand }) {
  const recentScores = player.recent_scores
    ? player.recent_scores
        .split(',')
        .filter((s) => s.trim() !== '')
        .map((s) => (s === 'X' ? null : parseInt(s, 10)))
    : [];

  const displayScores = Array(5)
    .fill(null)
    .map((_, i) => (recentScores[i] !== undefined ? recentScores[i] : null));

  return (
    <div
      className="bg-[#111318] border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-xl h-full w-full"
      style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}
    >
      {/* Subtle top accent line */}
      <div
        className={`h-0.5 w-full flex-shrink-0 ${
          heuristic.dot === 'bg-emerald-400'
            ? 'bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent'
            : heuristic.dot === 'bg-red-400'
              ? 'bg-gradient-to-r from-transparent via-red-500/60 to-transparent'
              : 'bg-gradient-to-r from-transparent via-amber-500/60 to-transparent'
        }`}
      />

      <div className="p-4 flex-1 flex flex-col gap-4">
        {/* ROW 1: Player identity */}
        <div className="flex items-center gap-3">
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
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white leading-tight truncate" title={player.name}>
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

        <div className="h-px bg-white/6" />

        {/* ROW 2: Price */}
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

        {/* ROW 3: Form */}
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

        {/* ROW 4: Heuristic */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/6">
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
                      ? `${userColors[player.seller_color % userColors.length]}15`
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

      <button
        onClick={onToggleExpand}
        className="w-full py-3 bg-white/4 hover:bg-white/8 text-sm font-semibold text-white/70 hover:text-white flex items-center justify-center gap-2 transition-all duration-200 border-t border-white/8 cursor-pointer group/btn flex-shrink-0 m-0"
      >
        Analizar Fichaje
      </button>
    </div>
  );
}

// ── BACK FACE COMPONENT ──
function CardBack({ player, isExpanded, onToggleExpand }) {
  const { data: detailsData, loading: detailsLoading } = useApiData(
    () => `/api/players/${player.player_id}/stats`,
    { skip: !isExpanded }
  );

  const details = detailsData;

  return (
    <div
      className="flex flex-col h-full w-full"
      style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}
    >
      <div className="p-5 flex-1 overflow-y-auto w-full flex flex-col">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
          Análisis Detallado
        </h3>

        {/* PRÓXIMO PARTIDO */}
        <div className="mb-4 bg-blue-900/10 border border-blue-900/30 p-3 rounded-xl flex-shrink-0">
          <h4 className="text-xs font-bold text-blue-400 uppercase flex items-center mb-1.5">
            <Calendar size={12} className="mr-1" /> Próximo Partido
          </h4>
          {player.next_opponent_id ? (
            <div className="flex items-center space-x-2">
              <span className="text-white/50 text-xs">vs</span>
              {player.next_opponent_img && (
                <Image
                  src={player.next_opponent_img}
                  alt={player.next_opponent_name}
                  width={16}
                  height={16}
                />
              )}
              <span className="font-bold text-white text-sm truncate">
                {player.next_opponent_name}
              </span>
              <span className="text-[10px] text-white/50 ml-auto flex-shrink-0">
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

        {/* ESTADÍSTICAS */}
        {detailsLoading ? (
          <div className="animate-pulse flex-1 flex flex-col gap-3">
            <div className="h-4 w-1/2 bg-white/10 rounded"></div>
            <div className="h-16 w-full bg-white/5 rounded-xl border border-white/5 mt-auto"></div>
          </div>
        ) : details ? (
          <div className="flex-1 flex flex-col">
            <h4 className="text-[10px] font-bold text-white/50 uppercase mb-2 tracking-wider">
              Desempeño & Mercado
            </h4>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-white/5 border border-white/10 p-2.5 rounded-lg text-center flex flex-col justify-center">
                <span className="text-[10px] text-white/50 uppercase">Partidos</span>
                <span className="font-bold text-white text-base leading-none mt-1">
                  {details.games_played}
                </span>
              </div>
              <div className="bg-[#111318] border border-white/10 p-2.5 rounded-lg text-center flex flex-col justify-center shadow-inner">
                <span className="text-[10px] text-white/50 uppercase">Value Score</span>
                <span className="font-bold text-sky-400 text-base leading-none mt-1">
                  {(player.value_score || 0).toFixed(1)}
                </span>
              </div>
            </div>

            <div className="bg-[#111318] border border-white/10 p-3 rounded-xl text-xs text-white/70 shadow-inner mt-auto space-y-2">
              <div className="flex justify-between items-center">
                <span>Tendencia Precio</span>
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
              <div className="w-full h-px bg-white/5" />
              <div className="flex justify-between items-center">
                <span>Puntos Totales</span>
                <strong className="text-emerald-400">{details.total_points}</strong>
              </div>
            </div>

            <a
              href={`/player/${player.player_id}`}
              className="mt-3 flex items-center justify-center p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-[11px] font-bold uppercase tracking-widest transition-colors w-full border border-blue-500/20"
            >
              Ver Perfil Completo <TrendingUp size={12} className="ml-1.5" />
            </a>
          </div>
        ) : (
          <div className="text-xs text-white/40 italic p-4 bg-[#111318] rounded-xl border border-white/10 text-center shadow-inner m-auto">
            Error cargando detalles.
          </div>
        )}
      </div>

      {/* Botón Volver */}
      <button
        onClick={onToggleExpand}
        className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 border-t border-red-500/20 cursor-pointer flex-shrink-0"
      >
        Cerrar Análisis
      </button>
    </div>
  );
}
