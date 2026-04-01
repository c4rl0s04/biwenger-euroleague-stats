import React from 'react';
import clsx from 'clsx';
import Image from 'next/image';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Star, Activity, Calendar, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApiData } from '@/lib/hooks/useApiData';
import { getShortTeamName } from '@/lib/utils/format';

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

function getTeamColorByName(teamName) {
  if (!teamName) return '#ffffff';
  const name = teamName.toLowerCase();
  if (name.includes('madrid')) return '#FEBE10';
  if (name.includes('barcelona')) return '#ED2939';
  if (name.includes('baskonia')) return '#B40039';
  if (name.includes('valencia')) return '#F39200';
  if (name.includes('olympiacos')) return '#E2001A';
  if (name.includes('panathinaikos')) return '#007934';
  if (name.includes('fenerbahce')) return '#F0C405';
  if (name.includes('efes')) return '#2249AB';
  if (name.includes('monaco')) return '#E31B23';
  if (name.includes('maccabi')) return '#F9D308';
  if (name.includes('partizan') || name.includes('virtus') || name.includes('asvel'))
    return '#E4E4E7';
  if (name.includes('zalgiris')) return '#006737';
  if (name.includes('milano')) return '#DA291C';
  if (name.includes('bayern')) return '#DC052D';
  if (name.includes('alba')) return '#FFCD00';
  if (name.includes('zvezda')) return '#E31B23';
  if (name.includes('paris')) return '#27C4F3';
  return '#ffffff';
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
  if (score === null || score === 'X') {
    return (
      <div className="flex-1 h-8 bg-rose-600/40 border border-rose-500/50 rounded flex items-center justify-center">
        <span className="text-xs font-bold text-rose-100">X</span>
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
        <div className="absolute inset-0 backface-hidden h-full w-full">
          <CardFront
            player={player}
            heuristic={heuristic}
            posStyle={posStyle}
            onToggleExpand={onToggleExpand}
          />
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 backface-hidden h-full w-full"
          style={{ transform: 'rotateY(180deg)' }}
        >
          <CardBack
            player={player}
            heuristic={heuristic}
            isExpanded={isExpanded}
            onToggleExpand={onToggleExpand}
            onExpandLevel2={onExpandLevel2}
          />
        </div>
      </motion.div>

      {/* Invisible spacer to maintain natural grid height */}
      <div className="invisible pointer-events-none opacity-0">
        <CardFront
          player={player}
          heuristic={heuristic}
          posStyle={posStyle}
          onToggleExpand={() => {}}
          isSpacer={true}
        />
      </div>
    </motion.div>
  );
}

// ── FRONT ─────────────────────────────────────────────────────────────────────
function CardFront({ player, heuristic, posStyle, onToggleExpand, isSpacer = false }) {
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
      className={`bg-card backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden flex flex-col shadow-xl ${isSpacer ? '' : 'h-full w-full'} relative`}
    >
      <div
        className={`h-1 w-full flex-shrink-0 bg-gradient-to-r from-transparent ${heuristic.accent} to-transparent opacity-80`}
      />

      <Link
        href={`/player/${player.player_id}`}
        className="p-4 flex-1 flex flex-col gap-4 group/link hover:bg-white/[0.03] transition-colors"
      >
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
            <h3
              className="text-[22px] font-display font-bold text-white leading-none truncate tracking-wide uppercase mt-0.5 transition-all duration-300 origin-left group-hover/link:scale-[1.03] group-hover/link:text-[var(--team-color)] inline-block max-w-full drop-shadow-md"
              title={player.name}
              style={{ '--team-color': getTeamColorByName(player.team) }}
            >
              {player.name}
            </h3>
            <div className="flex items-center gap-2 mt-1.5">
              {player.position && (
                <span
                  className={`text-[15px] font-display font-medium px-2.5 py-0.5 rounded border ${posStyle.text} ${posStyle.bg} uppercase tracking-widest flex-shrink-0 leading-none mt-0.5`}
                >
                  {player.position === 'Pivot' ? 'Pívot' : player.position}
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
          <p className="text-[11px] text-white uppercase tracking-wider font-bold mb-1.5">
            Precio en Mercado
          </p>
          <div className="flex items-center gap-2 justify-center">
            <p className="text-3xl font-display text-white tabular-nums leading-none tracking-tight">
              {new Intl.NumberFormat('es-ES').format(player.price)}
              <span className="text-base text-white/40 font-normal ml-1">€</span>
            </p>
            {player.price_trend !== undefined &&
              player.price_trend !== null &&
              player.price_trend !== 0 && (
                <span
                  className={`flex items-center ${player.price_trend > 0 ? 'text-emerald-400' : 'text-rose-400'}`}
                  title={`Tendencia hoy: ${player.price_trend > 0 ? '+' : ''}${new Intl.NumberFormat('es-ES').format(player.price_trend)}€`}
                >
                  {player.price_trend > 0 ? (
                    <TrendingUp size={20} strokeWidth={3} />
                  ) : (
                    <TrendingDown size={20} strokeWidth={3} />
                  )}
                </span>
              )}
          </div>
          {player.real_price != null && (
            <p className="text-[11px] text-white/50 tabular-nums leading-none mt-2 font-bold uppercase tracking-wider font-sans">
              Valor real:{' '}
              <span className="text-white/80">
                {new Intl.NumberFormat('es-ES').format(player.real_price)}
              </span>
              <span className="text-white/50 ml-0.5">€</span>
            </p>
          )}
        </div>

        {/* Form */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-white uppercase tracking-wider font-bold font-sans">
              Forma reciente
            </span>
            <span className="text-[11px] text-white/50 uppercase tracking-wider font-bold font-sans flex items-center">
              Media:
              <span className="text-emerald-400 font-display text-[15px] leading-none ml-1.5 mr-0.5 translate-y-[1px]">
                {player.avg_recent_points?.toFixed(1) || '0.0'}
              </span>
              <span className="text-[9px]">pts</span>
            </span>
          </div>
          <div className="flex gap-1">
            {displayScores.map((score, i) => (
              <ScoreBar key={i} score={score} />
            ))}
          </div>
        </div>

        {/* Heuristic + Seller */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
          <div
            className={`flex items-center text-[9px] font-sans font-black uppercase tracking-wider px-2 py-1 rounded-lg border shadow-sm whitespace-nowrap overflow-hidden text-ellipsis ${heuristic.color}`}
          >
            {heuristic.icon}
            {heuristic.label}
          </div>
          {player.seller_icon && player.seller_name !== 'Mercado' ? (
            <div
              className="flex items-center gap-1.5 px-2 py-1 rounded-full border shadow-sm"
              style={{
                backgroundColor: sellerColor ? `${sellerColor}10` : 'rgba(255,255,255,0.03)',
                borderColor: sellerColor ? `${sellerColor}20` : 'rgba(255,255,255,0.08)',
              }}
            >
              <span
                className="text-[10px] font-sans font-black uppercase tracking-wider mt-0.5 truncate max-w-20"
                style={{ color: sellerColor || 'rgba(255,255,255,0.7)' }}
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
            <div className="px-2.5 py-1 rounded-full border border-white/5 bg-white/5 shadow-sm">
              <span className="text-[11px] text-white/40 font-bold uppercase tracking-wider font-sans mt-0.5 inline-block">
                Biwenger
              </span>
            </div>
          )}
        </div>
      </Link>

      <button
        onClick={onToggleExpand}
        className="w-full py-4 bg-white/[0.03] hover:bg-white/5 text-[13px] font-black font-sans uppercase tracking-[0.1em] text-white/70 hover:text-white flex items-center justify-center gap-2 transition-colors duration-300 border-t border-white/5 cursor-pointer flex-shrink-0 group/btn"
      >
        <span className="transition-transform duration-300 origin-center group-hover/btn:scale-[1.05] inline-block">
          Analizar Fichaje
        </span>
      </button>
    </div>
  );
}

// ── BACK ──────────────────────────────────────────────────────────────────────
function CardBack({
  player,
  heuristic,
  isExpanded,
  onToggleExpand,
  onExpandLevel2,
  isSpacer = false,
}) {
  const { data: detailsData, loading: detailsLoading } = useApiData(
    () => `/api/players/${player.player_id}/stats`,
    { skip: !isExpanded || isSpacer }
  );
  const details = detailsData;

  const priceTrendPositive = player.price_trend > 0;
  const priceTrendNeutral = player.price_trend === 0;

  return (
    <div
      className={`bg-card backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden flex flex-col shadow-2xl ${isSpacer ? '' : 'h-full w-full'} text-white relative group/card`}
    >
      {/* Same accent as front — ties both faces together */}
      <div
        className={`h-1 w-full flex-shrink-0 bg-gradient-to-r from-transparent ${heuristic.accent} to-transparent opacity-80`}
      />

      {/* Header */}
      <div className="px-3 py-2 flex items-center justify-between border-b border-white/6 relative z-10">
        <div className="flex items-center gap-2.5">
          <Activity
            size={15}
            className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)] transition-transform duration-500 group-hover/card:scale-110"
          />
          <span className="text-[14px] font-black font-sans text-slate-300 uppercase tracking-widest group-hover/card:text-white transition-colors">
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

      <div className="p-3 flex-1 flex flex-col gap-2">
        {/* Next match */}
        {player.next_opponent_id ? (
          <div className="bg-white/4 border border-white/8 rounded-xl px-3 py-2 flex flex-col gap-1.5 flex-shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-white uppercase tracking-wider font-bold flex items-center gap-1.5">
                <Calendar size={12} className="text-amber-400" /> Próx. Partido
              </span>
              <span className="text-[10px] bg-white/6 border border-white/8 px-2 py-0.5 rounded-lg text-white/80 font-medium font-sans">
                {new Date(player.next_match_date).toLocaleDateString('es-ES', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
            </div>

            <div className="flex items-center justify-between bg-black/20 rounded-lg px-4 py-1.5 border border-white/5">
              {/* My Team */}
              <div className="flex flex-col items-center flex-1">
                <span className="text-[11px] font-bold text-white uppercase tracking-tight truncate max-w-[80px]">
                  {getShortTeamName(player.team)}
                </span>
              </div>

              <div className="flex items-center justify-center px-3">
                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest italic leading-none">
                  VS
                </span>
              </div>

              {/* Opponent Team */}
              <div className="flex flex-col items-center flex-1">
                <span className="text-[11px] font-bold text-white uppercase tracking-tight truncate max-w-[80px]">
                  {getShortTeamName(player.next_opponent_name)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/4 border border-white/8 rounded-xl p-2.5 flex items-center justify-center flex-shrink-0">
            <span className="text-[11px] text-white uppercase tracking-wider font-bold">
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
              <div className="bg-white/4 border border-white/8 rounded-xl p-2 flex flex-col gap-0.5">
                <span className="text-[11px] text-white uppercase tracking-wider font-bold">
                  Calidad/Precio
                </span>
                <span
                  className={clsx(
                    'text-xl font-bold tabular-nums leading-none mt-0.5 font-display',
                    (player.value_score || 0) >= 25
                      ? 'text-emerald-400'
                      : (player.value_score || 0) >= 15
                        ? 'text-sky-400'
                        : (player.value_score || 0) >= 8
                          ? 'text-amber-400'
                          : (player.value_score || 0) > 0
                            ? 'text-rose-400'
                            : 'text-white'
                  )}
                >
                  {(player.value_score || 0).toFixed(1)}
                  <span className="text-[10px] opacity-60 ml-0.5 font-sans">pts/M</span>
                </span>
              </div>
              <div className="bg-white/4 border border-white/8 rounded-xl p-2 flex flex-col gap-0.5">
                <span className="text-[11px] text-white uppercase tracking-wider font-bold">
                  Partidos
                </span>
                <span className="text-xl font-bold text-white tabular-nums leading-none mt-0.5 font-display">
                  {details.games_played}
                </span>
              </div>
            </div>

            {/* Divider rows — same pattern as front's bottom section */}
            <div className="bg-white/4 border border-white/8 rounded-xl divide-y divide-white/6 flex-shrink-0">
              <div className="flex items-center justify-between px-3 py-1.5">
                <span className="text-[11px] text-white uppercase tracking-wider font-bold">
                  Total Pts
                </span>
                <span className="text-base font-bold text-emerald-400 tabular-nums font-display">
                  {details.total_points}
                </span>
              </div>
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-[11px] text-white uppercase tracking-wider font-bold">
                  Flujo Diario
                </span>
                <span
                  className={`text-base font-bold tabular-nums font-display ${priceTrendPositive ? 'text-emerald-400' : priceTrendNeutral ? 'text-white/50' : 'text-rose-400'}`}
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
              className="mt-auto w-full py-2.5 bg-white/[0.03] hover:bg-white/5 text-[13px] font-black font-sans uppercase tracking-[0.1em] text-white/70 hover:text-white flex items-center justify-center gap-2 transition-all duration-300 border border-white/8 rounded-xl cursor-pointer flex-shrink-0 group/btn"
            >
              <span className="transition-transform duration-300 origin-center group-hover/btn:scale-[1.05] inline-block">
                Ver Análisis Completo
              </span>
              <TrendingUp
                size={14}
                className="opacity-70 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform"
              />
            </button>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-white/4 rounded-xl border border-white/8">
            <span className="text-[11px] text-white uppercase tracking-wider font-bold">
              Error cargando detalles
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
