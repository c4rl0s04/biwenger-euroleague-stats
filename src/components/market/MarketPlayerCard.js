import React from 'react';
import Image from 'next/image';
import { TrendingUp, TrendingDown, Star, Activity, Calendar, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApiData } from '@/lib/hooks/useApiData';

function getPurchaseHeuristic(player) {
  // Use the advanced 0-100 algorithm recommendation from backend if available
  if (player.recommendation_label) {
    const icons = { TrendingUp, TrendingDown, Star, Activity };
    const IconCmp = icons[player.recommendation_icon] || Activity;

    // Extract base color name (e.g. 'fuchsia', 'emerald', 'amber', 'orange', 'rose')
    const colorMatch = player.recommendation_color?.match(/(?:bg|text|border)-([a-z]+)-/);
    const baseColor = colorMatch ? colorMatch[1] : 'gray';

    // Map explicit Tailwind classes so they aren't purged
    const accentMap = {
      fuchsia: 'via-fuchsia-500/60',
      emerald: 'via-emerald-500/60',
      amber: 'via-amber-500/60',
      orange: 'via-orange-500/60',
      rose: 'via-rose-500/60',
    };

    return {
      label: player.recommendation_label,
      score: player.recommendation_score,
      color: player.recommendation_color,
      accent: accentMap[baseColor] || 'via-gray-500/60',
      dot: player.recommendation_dot,
      icon: <IconCmp size={11} className="mr-1" />,
    };
  }

  // Legacy fallback
  const { value_score, price_trend } = player;
  if (value_score > 30 && price_trend > 0) {
    return {
      label: 'Compra Excelente',
      color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      accent: 'via-emerald-500/60',
      dot: 'bg-emerald-400',
      icon: <TrendingUp size={11} className="mr-1" />,
    };
  } else if (value_score < 10 || price_trend < 0) {
    return {
      label: 'Compra Arriesgada',
      color: 'bg-red-500/15 text-red-400 border-red-500/30',
      accent: 'via-red-500/60',
      dot: 'bg-red-400',
      icon: <TrendingDown size={11} className="mr-1" />,
    };
  } else {
    return {
      label: 'Compra Normal',
      color: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      accent: 'via-amber-500/60',
      dot: 'bg-amber-400',
      icon: <Star size={11} className="mr-1" />,
    };
  }
}

const positionColors = {
  Base: { text: 'text-sky-400', bg: 'bg-sky-400/10 border-sky-400/30', initial: 'B' },
  Alero: { text: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/30', initial: 'A' },
  Pívot: { text: 'text-rose-400', bg: 'bg-rose-400/10 border-rose-400/30', initial: 'P' },
  Pivot: { text: 'text-rose-400', bg: 'bg-rose-400/10 border-rose-400/30', initial: 'P' },
};

const userColors = [
  '#f43f5e',
  '#3b82f6',
  '#10b981',
  '#8b5cf6',
  '#f59e0b',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
  '#a855f7',
  '#14b8a6',
];

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
      ? 'bg-rose-700    text-white border-rose-600/50'
      : score < 6
        ? 'bg-amber-700   text-white border-amber-600/50'
        : score < 10
          ? 'bg-emerald-700 text-white border-emerald-600/50'
          : 'bg-sky-700     text-white border-sky-600/50';
  return (
    <div className={`flex-1 h-8 rounded flex items-center justify-center border ${color}`}>
      <span className="text-xs font-bold font-mono">{score}</span>
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function MarketPlayerCard({ player, isExpanded, onToggleExpand, onExpandLevel2 }) {
  const heuristic = getPurchaseHeuristic(player);
  const posStyle = positionColors[player.position] || {
    text: 'text-white/60',
    bg: 'bg-white/5 border-white/10',
    initial: '?',
  };

  return (
    <motion.div
      className={`relative group perspective-[1000px] hover:-translate-y-0.5 transition-transform duration-300 ${isExpanded ? 'z-50' : 'z-10'}`}
    >
      <motion.div
        className="absolute inset-0 preserve-3d"
        animate={{ rotateY: isExpanded ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        {/* Front */}
        <div className="absolute inset-0 backface-hidden">
          <CardFront
            player={player}
            heuristic={heuristic}
            posStyle={posStyle}
            onToggleExpand={onToggleExpand}
          />
        </div>

        {/* Back */}
        <div className="absolute inset-0 backface-hidden" style={{ transform: 'rotateY(180deg)' }}>
          <CardBack
            player={player}
            heuristic={heuristic}
            isExpanded={isExpanded}
            onToggleExpand={onToggleExpand}
            onExpandLevel2={onExpandLevel2}
          />
        </div>
      </motion.div>

      {/* Invisible spacer */}
      <div className="invisible pointer-events-none">
        <CardFront
          player={player}
          heuristic={heuristic}
          posStyle={posStyle}
          onToggleExpand={() => {}}
        />
      </div>
    </motion.div>
  );
}

// ── FRONT ─────────────────────────────────────────────────────────────────────
function CardFront({ player, heuristic, posStyle, onToggleExpand }) {
  const recentScores = player.recent_scores
    ? player.recent_scores
        .split(',')
        .filter((s) => s.trim() !== '')
        .map((s) => (s === 'X' ? null : parseInt(s, 10)))
    : [];
  const displayScores = Array(5)
    .fill(null)
    .map((_, i) => recentScores[i] ?? null);
  const sellerColor =
    player.seller_color != null ? userColors[player.seller_color % userColors.length] : null;

  return (
    <div
      className="bg-[#111318] border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-xl h-full w-full"
      style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}
    >
      <div
        className={`h-0.5 w-full flex-shrink-0 bg-gradient-to-r from-transparent ${heuristic.accent} to-transparent`}
      />

      <div className="p-4 flex-1 flex flex-col gap-4">
        {/* Identity */}
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
                  {posStyle.initial}
                </span>
              )}
            </div>
          </div>
          {player.team_img && (
            <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center">
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

        {/* Price */}
        <div className="flex flex-col items-center">
          <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-0.5">
            Precio
          </p>
          <p className="text-2xl font-bold text-white tabular-nums leading-none">
            {new Intl.NumberFormat('es-ES').format(player.price)}
            <span className="text-base text-white/40 font-normal ml-1">€</span>
          </p>
        </div>

        {/* Form */}
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

        {/* Heuristic + Seller */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/6">
          <div
            className={`flex items-center text-[10px] font-semibold px-2 py-1 rounded border ${heuristic.color}`}
          >
            {heuristic.icon}
            {heuristic.label}
          </div>
          {player.seller_icon && player.seller_name !== 'Mercado' ? (
            <div
              className="flex items-center gap-1.5 px-2 py-1 rounded-full border"
              style={{
                backgroundColor: sellerColor ? `${sellerColor}15` : 'rgba(255,255,255,0.05)',
                borderColor: sellerColor ? `${sellerColor}30` : 'rgba(255,255,255,0.1)',
              }}
            >
              <span
                className="text-[10px] font-bold capitalize"
                style={{ color: sellerColor || 'rgba(255,255,255,0.6)' }}
              >
                {player.seller_name}
              </span>
              <Image
                src={player.seller_icon}
                alt={player.seller_name}
                width={14}
                height={14}
                className="rounded-full"
              />
            </div>
          ) : (
            <div className="px-2 py-1 rounded-full border border-white/10 bg-white/5">
              <span className="text-[10px] text-white/40 font-medium">Biwenger</span>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={onToggleExpand}
        className="w-full py-3 bg-white/4 hover:bg-white/8 text-sm font-semibold text-white/70 hover:text-white flex items-center justify-center gap-2 transition-all duration-200 border-t border-white/8 cursor-pointer flex-shrink-0"
      >
        Analizar Fichaje
      </button>
    </div>
  );
}

// ── BACK ──────────────────────────────────────────────────────────────────────
function CardBack({ player, heuristic, isExpanded, onToggleExpand, onExpandLevel2 }) {
  const { data: detailsData, loading: detailsLoading } = useApiData(
    () => `/api/players/${player.player_id}/stats`,
    { skip: !isExpanded }
  );
  const details = detailsData;

  const priceTrendPositive = player.price_trend > 0;
  const priceTrendNeutral = player.price_trend === 0;

  return (
    <div
      className="bg-[#111318] border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-xl h-full w-full text-white"
      style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}
    >
      {/* Same accent as front — ties both faces together */}
      <div
        className={`h-0.5 w-full flex-shrink-0 bg-gradient-to-r from-transparent ${heuristic.accent} to-transparent`}
      />

      {/* Header */}
      <div className="px-3 py-2.5 flex items-center justify-between border-b border-white/6">
        <div className="flex items-center gap-2">
          <Activity size={13} className="text-emerald-400" />
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">
            Quick Stats
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand();
          }}
          className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 flex items-center justify-center text-white/40 hover:text-white transition-colors cursor-pointer"
        >
          <X size={13} />
        </button>
      </div>

      <div className="p-3 flex-1 flex flex-col gap-2.5">
        {/* Next match */}
        {player.next_opponent_id ? (
          <div className="bg-white/4 border border-white/8 rounded-xl p-2.5 flex items-center justify-between flex-shrink-0">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-white/30 uppercase tracking-widest font-semibold flex items-center gap-1">
                <Calendar size={10} /> Próx. Partido
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                {player.next_opponent_img && (
                  <Image
                    src={player.next_opponent_img}
                    alt="Opponent"
                    width={16}
                    height={16}
                    className="object-contain"
                  />
                )}
                <span className="font-bold text-sm text-white truncate max-w-[110px]">
                  {player.next_opponent_name}
                </span>
              </div>
            </div>
            <span className="text-[10px] bg-white/6 border border-white/8 px-2 py-1 rounded-lg text-white/50 font-medium">
              {new Date(player.next_match_date).toLocaleDateString('es-ES', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}
            </span>
          </div>
        ) : (
          <div className="bg-white/4 border border-white/8 rounded-xl p-2.5 flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] text-white/30 uppercase tracking-widest font-semibold">
              Sin próximos partidos
            </span>
          </div>
        )}

        {/* Stats */}
        {detailsLoading ? (
          <div className="flex-1 flex flex-col gap-2.5 animate-pulse">
            <div className="flex gap-2">
              <div className="flex-1 h-14 bg-white/8 rounded-xl" />
              <div className="flex-1 h-14 bg-white/8 rounded-xl" />
            </div>
            <div className="flex-1 bg-white/8 rounded-xl" />
          </div>
        ) : details ? (
          <div className="flex-1 flex flex-col gap-2.5 min-h-0">
            {/* 2-col tiles — mirror the stat block style from front */}
            <div className="grid grid-cols-2 gap-2 flex-shrink-0">
              <div className="bg-white/4 border border-white/8 rounded-xl p-2.5 flex flex-col gap-0.5">
                <span className="text-[10px] text-white/30 uppercase tracking-widest font-semibold">
                  Calidad/Precio
                </span>
                <span className="text-xl font-bold text-sky-400 tabular-nums leading-none mt-0.5">
                  {(player.value_score || 0).toFixed(1)}
                </span>
              </div>
              <div className="bg-white/4 border border-white/8 rounded-xl p-2.5 flex flex-col gap-0.5">
                <span className="text-[10px] text-white/30 uppercase tracking-widest font-semibold">
                  Partidos
                </span>
                <span className="text-xl font-bold text-white tabular-nums leading-none mt-0.5">
                  {details.games_played}
                </span>
              </div>
            </div>

            {/* Divider rows — same pattern as front's bottom section */}
            <div className="bg-white/4 border border-white/8 rounded-xl divide-y divide-white/6 flex-shrink-0">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-[10px] text-white/30 uppercase tracking-widest font-semibold">
                  Total Pts
                </span>
                <span className="text-sm font-bold text-emerald-400 tabular-nums">
                  {details.total_points}
                </span>
              </div>
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-[10px] text-white/30 uppercase tracking-widest font-semibold">
                  Flujo Diario
                </span>
                <span
                  className={`text-sm font-bold tabular-nums ${priceTrendPositive ? 'text-emerald-400' : priceTrendNeutral ? 'text-white/50' : 'text-rose-400'}`}
                >
                  {priceTrendPositive ? '+' : ''}
                  {new Intl.NumberFormat('es-ES').format(player.price_trend)} €
                </span>
              </div>
            </div>

            {/* CTA — matches front button style */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onExpandLevel2) onExpandLevel2();
              }}
              className="mt-auto w-full py-2.5 bg-white/4 hover:bg-white/8 text-xs font-semibold text-white/70 hover:text-white flex items-center justify-center gap-2 transition-all duration-200 border border-white/8 rounded-xl cursor-pointer flex-shrink-0"
            >
              Ver Análisis Completo
              <TrendingUp size={14} className="opacity-70" />
            </button>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-white/4 rounded-xl border border-white/8">
            <span className="text-[10px] text-white/30 uppercase tracking-widest font-semibold">
              Error cargando detalles
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
