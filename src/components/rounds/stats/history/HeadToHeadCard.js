'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import {
  ChevronDown,
  Trophy,
  Zap,
  Activity,
  Brain,
  Target,
  Banknote,
  Flame,
  MapPin,
} from 'lucide-react';
import { getColorForUser } from '@/lib/constants/colors';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';

/**
 * HeadToHeadCard - Full width component comparing two users directly
 * Includes Rounds, Standings, and Predictions data.
 */
export default function HeadToHeadCard({
  currentUser,
  allUsersHistory = [],
  usersList = [],
  standings = [],
  predictions = {},
  advancedStats = {},
}) {
  const [rivalId, setRivalId] = useState(null);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  // Set default rival if none selected (e.g. 2nd place or next user)
  useMemo(() => {
    if (!rivalId && usersList.length > 1 && currentUser) {
      const defaultRival = usersList.find((u) => u.id !== currentUser.id);
      if (defaultRival) setRivalId(defaultRival.id);
    }
  }, [usersList, currentUser, rivalId]);

  // Derived Data
  const stats = useMemo(() => {
    if (!currentUser || !rivalId || !allUsersHistory.length) return null;

    // Retrieve full data objects
    const userFullData =
      allUsersHistory.find((h) => String(h.userId) === String(currentUser.id)) || {};
    const rivalFullData = allUsersHistory.find((h) => String(h.userId) === String(rivalId)) || {};

    // Extract history arrays
    const userHistory = userFullData.history || [];
    const rivalHistory = rivalFullData.history || [];

    // Identify rival user object
    const rivalUser = usersList.find((u) => String(u.id) === String(rivalId)) || {
      name: 'Rival',
      id: rivalId,
    };

    // --- HELPER: Pre-calculate metrics for all users to determine ranks ---
    const allMetrics = allUsersHistory.map((h) => {
      const history = h.history || [];
      // Use FULL history for consistency with Dashboard (Avg includes 0s if missed)
      const validHistory = history;

      const perfect = validHistory.filter((r) => (r.efficiency || 0) >= 95).length;

      const totalActual = validHistory.reduce((sum, r) => sum + r.actual_points, 0);
      const totalIdeal = validHistory.reduce((sum, r) => sum + (r.ideal_points || 0), 0);
      const pointsLost = totalIdeal - totalActual;

      // Avg Player Points from squadStats (added in backend)
      const avgPlayer = h.squadStats?.avgPlayerPoints || 0;

      // New Metrics for Ranking
      const avgEff =
        validHistory.length > 0
          ? validHistory.reduce((sum, r) => sum + (r.efficiency || 0), 0) / validHistory.length
          : 0;
      const best =
        validHistory.length > 0 ? Math.max(...validHistory.map((r) => r.actual_points)) : 0;

      const form =
        validHistory.length > 0
          ? [...validHistory]
              .sort((a, b) => b.round_number - a.round_number)
              .slice(0, 5)
              .reduce((sum, r) => sum + r.actual_points, 0) / 5
          : 0;

      const avgCaptain = parseFloat(h.captain?.avg_points || 0);
      const extraCaptain = parseFloat(h.captain?.extra_points || 0);

      return {
        id: String(h.userId),
        perfect,
        pointsLost,
        avgPlayer,
        avgEff,
        best,
        form,
        avgCaptain,
        extraCaptain,
      };
    });

    const getDynamicRank = (metric, uid, inverse = false) => {
      const sorted = [...allMetrics].sort((a, b) =>
        inverse ? a[metric] - b[metric] : b[metric] - a[metric]
      );

      const userItem = sorted.find((m) => m.id === String(uid));
      if (!userItem) return null;
      const userVal = userItem[metric];

      // Tie-aware Rank: Index of first item with same value + 1
      const index = sorted.findIndex((m) => m[metric] === userVal);
      return index !== -1 ? index + 1 : null;
    };

    // --- 1. Rounds History (Wins, Losses, Stats) ---
    let wins = 0;
    let losses = 0;
    let ties = 0;
    const rivalRoundMap = new Map(rivalHistory.map((r) => [r.round_number, r]));

    userHistory.forEach((r) => {
      const rivalR = rivalRoundMap.get(r.round_number);
      if (rivalR) {
        if (r.actual_points > rivalR.actual_points) wins++;
        else if (r.actual_points < rivalR.actual_points) losses++;
        else ties++;
      }
    });

    const calculateHistoryStats = (hist, uid) => {
      if (!hist.length)
        return {
          best: 0,
          avgEff: 0,
          totalRounds: 0,
          pointsLost: { value: 0, rank: null },
          perfectRounds: { value: 0, rank: null },
        };

      // Use FULL history for consistency
      const validHistory = hist;
      if (!validHistory.length)
        return {
          best: { value: 0, rank: null },
          avgEff: { value: 0, rank: null },
          totalRounds: 0,
          pointsLost: { value: 0, rank: null },
          perfectRounds: { value: 0, rank: null },
        };

      const avgEff =
        validHistory.reduce((sum, r) => sum + (r.efficiency || 0), 0) / validHistory.length;
      const best = Math.max(...validHistory.map((r) => r.actual_points));

      const totalActual = validHistory.reduce((sum, r) => sum + r.actual_points, 0);
      const totalIdeal = validHistory.reduce((sum, r) => sum + (r.ideal_points || 0), 0);
      const pointsLostVal = totalIdeal - totalActual;

      const perfectRoundsVal = validHistory.filter((r) => (r.efficiency || 0) >= 95).length;

      return {
        best: { value: best, rank: uid ? getDynamicRank('best', uid) : null },
        avgEff: { value: avgEff, rank: uid ? getDynamicRank('avgEff', uid) : null },
        totalRounds: hist.length,
        pointsLost: {
          value: pointsLostVal,
          rank: uid ? getDynamicRank('pointsLost', uid, true) : null,
        },
        perfectRounds: {
          value: perfectRoundsVal,
          rank: uid ? getDynamicRank('perfect', uid) : null,
        },
      };
    };

    const userRounds = calculateHistoryStats(userHistory, currentUser.id);
    const rivalRounds = calculateHistoryStats(rivalHistory, rivalId);

    // Form (Last 5)
    // Use actual_points for form calculation to match displayed points
    const getForm = (hist) => {
      return (
        [...hist]
          .sort((a, b) => b.round_number - a.round_number)
          .slice(0, 5)
          .reduce((sum, r) => sum + r.actual_points, 0) / 5
      );
    };
    const userForm = getForm(userHistory);
    const rivalForm = getForm(rivalHistory);

    // --- 2. General Stats (Standings) ---
    const getRank = (list, key, uid, descending = true) => {
      if (!list || !list.length) return null;
      // Sort first to establish order
      const sorted = [...list].sort((a, b) => {
        const valA = parseFloat(a[key] || 0);
        const valB = parseFloat(b[key] || 0);
        return descending ? valB - valA : valA - valB;
      });

      // Find user's value
      const userItem = sorted.find((item) => String(item.user_id) === String(uid));
      if (!userItem) return null;

      const userValue = parseFloat(userItem[key] || 0);

      // Find rank: Index of first item with same value + 1 (Standard Competition Ranking: 1, 1, 3)
      const rankIndex = sorted.findIndex((item) => {
        const val = parseFloat(item[key] || 0);
        return val === userValue;
      });

      return rankIndex !== -1 ? rankIndex + 1 : null;
    };

    const getGeneral = (uid, fullData) => {
      const u = String(uid);
      const row = standings.find((s) => String(s.user_id) === u);
      return {
        totalPoints: { value: row?.total_points || 0, rank: getRank(standings, 'total_points', u) },
        avgPoints: {
          value: parseFloat(row?.avg_points || 0),
          rank: getRank(standings, 'avg_points', u),
        },
        teamValue: { value: row?.team_value || 0, rank: getRank(standings, 'team_value', u) },
        titles: { value: row?.titles || 0, rank: null },
        avgPlayer: {
          value: fullData?.squadStats?.avgPlayerPoints || 0,
          rank: getDynamicRank('avgPlayer', u),
        },
        bestPlayer: fullData?.squadStats?.bestPlayer || { name: '-', points: 0 },
      };
    };
    const userGeneral = getGeneral(currentUser.id, userFullData);
    const rivalGeneral = getGeneral(rivalId, rivalFullData);

    // --- 3. Predictions ---
    const getPredictionStats = (uid) => {
      const u = String(uid);
      const row = predictions.promedios?.find((p) => String(p.user_id) === u);
      const victoryRow = predictions.victorias?.find((v) => String(v.user_id) === u);
      const clutchRow = predictions.clutch?.find((c) => String(c.user_id) === u);

      // Count achievements
      const perfect10Count =
        predictions.achievements?.perfect_10?.filter((p) => String(p.user_id) === u).length || 0;
      const blankedCount =
        predictions.achievements?.blanked?.filter((p) => String(p.user_id) === u).length || 0;

      return {
        hits: {
          value: parseInt(row?.total_aciertos || 0),
          rank: getRank(predictions.promedios, 'total_aciertos', u),
        },
        accuracy: {
          value: parseFloat(row?.promedio || 0),
          rank: getRank(predictions.promedios, 'promedio', u),
        },
        participations: parseInt(row?.jornadas_jugadas || 0),
        victories: {
          value: parseInt(victoryRow?.victorias || 0),
          rank: getRank(predictions.victorias, 'victorias', u),
        },
        clutch: {
          value: parseFloat(clutchRow?.avg_last_3 || 0),
          rank: getRank(predictions.clutch, 'avg_last_3', u),
        },
        perfect10s: perfect10Count,
        roscos: blankedCount,
      };
    };
    const userPreds = getPredictionStats(currentUser.id);
    const rivalPreds = getPredictionStats(rivalId);

    // --- 4. Advanced Stats ---
    const getAdvanced = (uid) => {
      const u = String(uid);
      const findStat = (dataset, key = 'user_id') => {
        const index = dataset?.findIndex((item) => String(item[key]) === u);
        const item = index !== -1 ? dataset[index] : {};
        return { ...item, rank: index !== -1 ? index + 1 : null };
      };

      const streakItem = findStat(advancedStats.streaks);
      // Calculate specific rank for current_streak (as list might be sorted by longest)
      streakItem.currentRank = getRank(advancedStats.streaks, 'current_streak', u);
      // Ensure longest rank handles ties too if using the generic findStat rank isn't enough (findStat uses index)
      // Actually, let's explicitely calc longest rank too for consistency
      streakItem.rank = getRank(advancedStats.streaks, 'longest_streak', u);

      const jinxItem = findStat(advancedStats.jinx);
      jinxItem.rank = getRank(advancedStats.jinx, 'jinxed_count', u);

      const heartbreakerItem = findStat(advancedStats.heartbreaker);
      heartbreakerItem.rank = getRank(advancedStats.heartbreaker, 'total_diff', u);

      return {
        streak: streakItem,
        heat: findStat(advancedStats.heatCheck),
        hunter: findStat(advancedStats.hunter),
        bottler: findStat(advancedStats.bottler),
        heartbreaker: heartbreakerItem,
        noGlory: findStat(advancedStats.noGlory),
        jinx: jinxItem,
        floorCeiling: findStat(advancedStats.floorCeiling),
        volatility: findStat(advancedStats.volatility),
        dominance: findStat(advancedStats.dominance),
        reliability: findStat(advancedStats.reliability),
        gap: findStat(advancedStats.theoreticalGap),
        leaguePerf: findStat(advancedStats.leagueComparison),
      };
    };
    const userAdv = getAdvanced(currentUser.id);
    const rivalAdv = getAdvanced(rivalId);

    // --- 5. Extras ---
    const getExtraStats = (data) => ({
      captain: data?.captain || {},
      homeAway: data?.homeAway || {},
    });
    const userExtras = getExtraStats(userFullData);
    const rivalExtras = getExtraStats(rivalFullData);

    // --- 5. Official H2H Matrix Logic ---
    let recordToUse = { wins, losses, ties };
    if (
      advancedStats.rivalryMatrix &&
      advancedStats.rivalryMatrix[currentUser.id] &&
      advancedStats.rivalryMatrix[currentUser.id][rivalId]
    ) {
      recordToUse = advancedStats.rivalryMatrix[currentUser.id][rivalId];
    }

    return {
      rival: rivalUser,
      record: recordToUse,
      general: { user: userGeneral, rival: rivalGeneral },
      extras: {
        user: {
          ...userExtras,
          captain: {
            ...userExtras.captain,
            avg_points: {
              value: userExtras.captain?.avg_points || 0,
              rank: getDynamicRank('avgCaptain', currentUser.id),
            },
            extra_points: {
              value: userExtras.captain?.extra_points || 0,
              rank: getDynamicRank('extraCaptain', currentUser.id),
            },
          },
        },
        rival: {
          ...rivalExtras,
          captain: {
            ...rivalExtras.captain,
            avg_points: {
              value: rivalExtras.captain?.avg_points || 0,
              rank: getDynamicRank('avgCaptain', rivalId),
            },
            extra_points: {
              value: rivalExtras.captain?.extra_points || 0,
              rank: getDynamicRank('extraCaptain', rivalId),
            },
          },
        },
      },
      rounds: { user: userRounds, rival: rivalRounds },
      form: {
        user: { value: userForm, rank: getDynamicRank('form', currentUser.id) },
        rival: { value: rivalForm, rank: getDynamicRank('form', rivalId) },
      },
      preds: { user: userPreds, rival: rivalPreds },
      adv: { user: userAdv, rival: rivalAdv },
    };
  }, [currentUser, rivalId, allUsersHistory, usersList, standings, predictions, advancedStats]);

  if (!stats) return null;

  const userColor = getColorForUser(currentUser.id, currentUser.name, currentUser.color_index);
  const rivalColor = getColorForUser(stats.rival.id, stats.rival.name, stats.rival.color_index);

  /* Comparison Row with Highlights */
  const ComparisonRow = ({
    label,
    subLabel,
    info,
    valueA,
    valueB,
    rankA,
    rankB,
    nameA,
    nameB,
    format = (v) => v,
    inverse = false,
    highlightColor = 'text-indigo-400',
  }) => {
    const winA = inverse
      ? parseFloat(valueA) < parseFloat(valueB)
      : parseFloat(valueA) > parseFloat(valueB);
    const winB = inverse
      ? parseFloat(valueB) < parseFloat(valueA)
      : parseFloat(valueB) > parseFloat(valueA);
    const tie = parseFloat(valueA) === parseFloat(valueB);

    const absA = Math.abs(parseFloat(valueA) || 0);
    const absB = Math.abs(parseFloat(valueB) || 0);
    // Use total of absolute values to treat negative stats (like Hunter) as magnitude
    const total = absA + absB;

    let widthA = 0;
    let widthB = 0;

    if (total > 0) {
      widthA = (absA / total) * 100;
      widthB = (absB / total) * 100;
      // Don't enforce min 5% if it's actually 0 or close to 0
      if (absA > 0) widthA = Math.max(2, Math.min(98, widthA));
      if (absB > 0) widthB = Math.max(2, Math.min(98, widthB));
    }

    // New Helper: Render Highlighted Info
    const renderInfo = (text) => {
      if (!text) return null;
      const parts = text.split('*');
      return parts.map((part, index) => {
        if (index % 2 === 1) {
          return (
            <span key={index} className={`font-bold ${highlightColor}`}>
              {part}
            </span>
          );
        }
        return part;
      });
    };

    const RankBadge = ({ rank, colorClass }) => {
      if (!rank) return null;
      let color = 'text-zinc-600';
      if (rank === 1) color = 'text-yellow-500';
      if (rank === 2) color = 'text-zinc-400';
      if (rank === 3) color = 'text-amber-700';

      // Allow passing external margins/classes if needed, but default is just color + font
      return <span className={`text-xs font-black ${color} ${colorClass || ''}`}>#{rank}</span>;
    };

    return (
      <div className="py-2 border-b border-white/5 last:border-0 px-4 rounded-lg hover:bg-white/5 transition-colors group">
        {/* UPPER LABEL AREA */}
        <div className="flex flex-col items-center justify-center mb-1 relative">
          <div className="flex items-center gap-1.5 justify-center group/label cursor-help">
            <span className="text-[11px] uppercase tracking-wider text-white font-bold group-hover:text-white transition-colors text-center">
              {label}
            </span>
            {info && (
              <div className="relative">
                <div className="opacity-0 group-hover/label:opacity-100 transition-opacity absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-zinc-950 border border-white/10 rounded-xl p-4 text-xs text-zinc-300 shadow-2xl pointer-events-none z-50 text-center leading-relaxed">
                  {renderInfo(info)}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-zinc-950" />
                </div>
              </div>
            )}
          </div>

          {subLabel && (
            <span className="text-[10px] text-zinc-400 font-medium -mt-0.5">{subLabel}</span>
          )}
        </div>

        {/* LOWER VALUE & BAR AREA - Perfectly Centered */}
        <div className="flex items-center gap-4">
          {/* USER A VALUE */}
          <div
            className={`w-32 text-right font-bold text-sm flex items-center justify-end gap-3 ${winA ? userColor.text : 'text-zinc-500'}`}
          >
            <RankBadge rank={rankA} />
            <div className="flex flex-col items-end">
              {nameA && (
                <span className="text-xs font-bold text-white/90 leading-tight mb-0.5 max-w-[120px] truncate">
                  {nameA}
                </span>
              )}
              <span className="tabular-nums">{format(valueA)}</span>
            </div>
          </div>

          {/* BAR */}
          <div className="flex-1 h-2 rounded-full overflow-hidden bg-zinc-800/50">
            <div className="flex w-full h-full">
              <div className="flex-1 flex justify-end pr-0.5">
                <div
                  style={{
                    width: `${widthA}%`,
                    backgroundColor: winA || tie ? userColor.stroke : '#52525b',
                  }}
                  className="h-full rounded-l-full transition-all duration-1000 ease-out min-w-[2px]"
                />
              </div>
              <div className="w-px bg-zinc-900/50" />
              <div className="flex-1 flex pl-0.5">
                <div
                  style={{
                    width: `${widthB}%`,
                    backgroundColor: winB || tie ? rivalColor.stroke : '#52525b',
                  }}
                  className="h-full rounded-r-full transition-all duration-1000 ease-out min-w-[2px]"
                />
              </div>
            </div>
          </div>

          {/* USER B VALUE */}
          <div
            className={`w-32 text-left font-bold text-sm flex items-center justify-start gap-3 ${winB ? rivalColor.text : 'text-zinc-500'}`}
          >
            <div className="flex flex-col items-start">
              {nameB && (
                <span className="text-xs font-bold text-white/90 leading-tight mb-0.5 max-w-[120px] truncate">
                  {nameB}
                </span>
              )}
              <span className="tabular-nums">{format(valueB)}</span>
            </div>
            <RankBadge rank={rankB} />
          </div>
        </div>
      </div>
    );
  };

  const SectionHeader = ({ title, icon: Icon, color = 'text-indigo-400' }) => (
    <div className="flex items-center gap-2 mb-3 mt-6 pb-2 border-b border-white/10 first:mt-0">
      <Icon className={`w-4 h-4 ${color}`} />
      <h4 className={`text-xs font-bold uppercase tracking-wider ${color}`}>{title}</h4>
    </div>
  );

  const RivalSelector = () => (
    <div className="relative z-20">
      <button
        onClick={() => setIsSelectorOpen(!isSelectorOpen)}
        className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-white/5 shadow-lg"
      >
        <span className="text-zinc-400">RIVAL:</span>
        <span className="text-white font-bold">{stats.rival.name}</span>
        <ChevronDown size={14} className="text-zinc-500" />
      </button>

      {isSelectorOpen && (
        <>
          <div className="fixed inset-0" onClick={() => setIsSelectorOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-56 max-h-80 overflow-y-auto bg-zinc-900 border border-white/10 rounded-lg shadow-xl z-50 p-1 custom-scrollbar">
            {usersList
              .filter((u) => u.id !== currentUser.id)
              .map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    setRivalId(u.id);
                    setIsSelectorOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-md text-sm flex items-center gap-3 hover:bg-white/5 transition-colors ${u.id === rivalId ? 'bg-indigo-500/10 text-indigo-400' : 'text-zinc-300'}`}
                >
                  {u.icon ? (
                    <Image
                      src={u.icon}
                      alt={u.name}
                      width={20}
                      height={20}
                      className="rounded-full w-5 h-5 object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-zinc-700" />
                  )}
                  <span className="font-medium">{u.name}</span>
                </button>
              ))}
          </div>
        </>
      )}
    </div>
  );

  return (
    <ElegantCard
      title="Centro de Comparación"
      icon={Activity}
      color="indigo"
      actionRight={<RivalSelector />}
      className="overflow-visible"
    >
      {/* BODY */}
      <div className="pt-8 pb-4 px-2 md:px-6">
        {/* MATCHUP HEADER */}
        <div className="flex items-center justify-center gap-4 md:gap-16 mb-8">
          {/* User A */}
          <div className="flex flex-col items-center gap-2 w-24 md:w-40 relative group">
            <div
              className="w-20 h-20 md:w-28 md:h-28 rounded-full p-1 relative shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.1)]"
              style={{ background: `linear-gradient(135deg, ${userColor.stroke}, transparent)` }}
            >
              {currentUser.icon ? (
                <Image
                  src={currentUser.icon}
                  alt={currentUser.name}
                  width={112}
                  height={112}
                  className="rounded-full w-full h-full object-cover bg-zinc-900"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full rounded-full bg-zinc-800 flex items-center justify-center text-3xl font-bold">
                  {currentUser.name[0]}
                </div>
              )}
            </div>
            <div
              className={`font-black text-lg md:text-xl text-center leading-none tracking-tight ${userColor.text}`}
            >
              {currentUser.name}
            </div>
          </div>

          {/* VS SCOREBOARD */}
          <div className="flex flex-col items-center bg-zinc-950 px-6 py-4 rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
            <div className="flex items-baseline gap-4 text-5xl md:text-6xl font-black tabular-nums tracking-tighter drop-shadow-2xl z-10">
              <span
                className={
                  stats.record.wins > stats.record.losses ? userColor.text : 'text-zinc-600'
                }
              >
                {stats.record.wins}
              </span>
              <span className="text-zinc-800 text-3xl transform -translate-y-1">-</span>
              <span
                className={
                  stats.record.losses > stats.record.wins ? rivalColor.text : 'text-zinc-600'
                }
              >
                {stats.record.losses}
              </span>
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mt-2 font-bold z-10">
              Historial
            </div>
            {stats.record.ties > 0 && (
              <div className="text-[10px] text-zinc-600 mt-1 font-medium z-10">
                {stats.record.ties} Empates
              </div>
            )}
          </div>

          {/* User B */}
          <div className="flex flex-col items-center gap-2 w-24 md:w-40 relative group">
            <div
              className="w-20 h-20 md:w-28 md:h-28 rounded-full p-1 relative shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.1)]"
              style={{ background: `linear-gradient(135deg, ${rivalColor.stroke}, transparent)` }}
            >
              {stats.rival.icon ? (
                <Image
                  src={stats.rival.icon}
                  alt={stats.rival.name}
                  width={112}
                  height={112}
                  className="rounded-full w-full h-full object-cover bg-zinc-900"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full rounded-full bg-zinc-800 flex items-center justify-center text-3xl font-bold">
                  {stats.rival.name[0]}
                </div>
              )}
            </div>
            <div
              className={`font-black text-lg md:text-xl text-center leading-none tracking-tight ${rivalColor.text}`}
            >
              {stats.rival.name}
            </div>
          </div>
        </div>

        {/* STATS SECTIONS - COMPACT LAYOUT */}
        <div className="flex flex-col gap-6 max-w-4xl mx-auto">
          {/* GROUP 1: ESSENTIALS */}
          <div className="space-y-6">
            <div>
              <SectionHeader title="Estadísticas Generales" icon={Trophy} color="text-yellow-400" />
              <div className="space-y-0.5">
                <ComparisonRow
                  label="Victorias de Jornada"
                  info="Número total de jornadas *ganadas* (1º puesto)"
                  valueA={stats.adv.user.dominance?.wins || 0}
                  rankA={stats.adv.user.dominance?.rank}
                  valueB={stats.adv.rival.dominance?.wins || 0}
                  rankB={stats.adv.rival.dominance?.rank}
                  highlightColor="text-yellow-400"
                />
                <ComparisonRow
                  label="Media de Puntos"
                  info="Promedio de puntos obtenidos por jornada"
                  valueA={stats.general.user.avgPoints.value}
                  rankA={stats.general.user.avgPoints.rank}
                  valueB={stats.general.rival.avgPoints.value}
                  rankB={stats.general.rival.avgPoints.rank}
                  format={(v) => v.toFixed(1)}
                  highlightColor="text-yellow-400"
                />
                <ComparisonRow
                  label="Puntos Totales"
                  info="Puntos fantasy *acumulados* en toda la temporada"
                  valueA={stats.general.user.totalPoints.value}
                  rankA={stats.general.user.totalPoints.rank}
                  valueB={stats.general.rival.totalPoints.value}
                  rankB={stats.general.rival.totalPoints.rank}
                  format={(v) => v.toLocaleString()}
                  highlightColor="text-yellow-400"
                />
                <ComparisonRow
                  label="Valor de Plantilla"
                  info="*Valor de mercado* actual de todos los *jugadores en propiedad*"
                  valueA={stats.general.user.teamValue.value}
                  rankA={stats.general.user.teamValue.rank}
                  valueB={stats.general.rival.teamValue.value}
                  rankB={stats.general.rival.teamValue.rank}
                  format={(v) => (v / 1000000).toFixed(1) + 'M'}
                  highlightColor="text-yellow-400"
                />

                <ComparisonRow
                  label="Mejor Jugador"
                  info="Jugador de la plantilla actual con *más puntos*"
                  valueA={stats.general.user.bestPlayer.points}
                  nameA={stats.general.user.bestPlayer.name}
                  valueB={stats.general.rival.bestPlayer.points}
                  nameB={stats.general.rival.bestPlayer.name}
                  highlightColor="text-yellow-400"
                />
              </div>
            </div>

            <div>
              <SectionHeader
                title="Rendimiento en Jornadas"
                icon={Activity}
                color="text-blue-400"
              />
              <div className="space-y-0.5">
                <ComparisonRow
                  label="Eficiencia Media"
                  info="Porcentaje medio de puntos obtenidos sobre el *máximo posible (Ideal)*"
                  valueA={stats.rounds.user.avgEff.value}
                  rankA={stats.rounds.user.avgEff.rank}
                  valueB={stats.rounds.rival.avgEff.value}
                  rankB={stats.rounds.rival.avgEff.rank}
                  format={(v) => v.toFixed(1) + '%'}
                  highlightColor="text-blue-400"
                />
                <ComparisonRow
                  label="Mejor Puntuación"
                  info="*Máxima puntuación* conseguida en una sola jornada"
                  valueA={stats.rounds.user.best.value}
                  rankA={stats.rounds.user.best.rank}
                  valueB={stats.rounds.rival.best.value}
                  rankB={stats.rounds.rival.best.rank}
                  highlightColor="text-blue-400"
                />
                <ComparisonRow
                  label="Forma Reciente"
                  subLabel="Media ult. 5"
                  info="Promedio de puntos en las *últimas 5 jornadas*"
                  valueA={stats.form.user.value}
                  rankA={stats.form.user.rank}
                  valueB={stats.form.rival.value}
                  rankB={stats.form.rival.rank}
                  format={(v) => v.toFixed(1)}
                  highlightColor="text-blue-400"
                />
              </div>
            </div>
          </div>

          {/* GROUP 2: STRATEGY & PREDICTIONS */}
          <div className="space-y-6">
            <div>
              <SectionHeader title="Predicciones (Porras)" icon={Brain} color="text-purple-400" />
              <div className="space-y-0.5">
                <ComparisonRow
                  label="Aciertos Totales"
                  info="Suma total de *aciertos 1-X-2* en la temporada"
                  valueA={stats.preds.user.hits.value}
                  rankA={stats.preds.user.hits.rank}
                  valueB={stats.preds.rival.hits.value}
                  rankB={stats.preds.rival.hits.rank}
                  highlightColor="text-purple-400"
                />
                {/* Only show accuracy if both have participated */}
                {stats.preds.user.participations > 0 && stats.preds.rival.participations > 0 && (
                  <ComparisonRow
                    label="Media (Aciertos)"
                    subLabel="/jornada"
                    valueA={stats.preds.user.accuracy.value}
                    rankA={stats.preds.user.accuracy.rank}
                    valueB={stats.preds.rival.accuracy.value}
                    rankB={stats.preds.rival.accuracy.rank}
                    format={(v) => v.toFixed(2)}
                    highlightColor="text-purple-400"
                  />
                )}
                <ComparisonRow
                  label="Jornadas Ganadas"
                  info="Veces que has obtenido la *mayor puntuación* en la porra de una jornada"
                  valueA={stats.preds.user.victories.value}
                  rankA={stats.preds.user.victories.rank}
                  valueB={stats.preds.rival.victories.value}
                  rankB={stats.preds.rival.victories.rank}
                  highlightColor="text-purple-400"
                />
                <ComparisonRow
                  label="Factor Clutch"
                  subLabel="Media ult. 3"
                  info="Media de aciertos en las *últimas 3 jornadas* (momentos decisivos)"
                  valueA={stats.preds.user.clutch.value}
                  rankA={stats.preds.user.clutch.rank}
                  valueB={stats.preds.rival.clutch.value}
                  rankB={stats.preds.rival.clutch.rank}
                  format={(v) => v.toFixed(1)}
                  highlightColor="text-purple-400"
                />
                <ComparisonRow
                  label="Plenos (10/10)"
                  info="Número de jornadas con *10 aciertos perfectos*"
                  valueA={stats.preds.user.perfect10s}
                  valueB={stats.preds.rival.perfect10s}
                  highlightColor="text-purple-400"
                />
                <ComparisonRow
                  label="Roscos (Último)"
                  subLabel="Menos es mejor"
                  info="Veces que has quedado *último* en la jornada de porras"
                  valueA={stats.preds.user.roscos}
                  valueB={stats.preds.rival.roscos}
                  inverse={true}
                  highlightColor="text-purple-400"
                />
              </div>
            </div>

            <div>
              <SectionHeader title="Gestión de Capitán" icon={Brain} color="text-pink-400" />
              <div className="space-y-0.5">
                <ComparisonRow
                  label="Puntos de Capitán"
                  subLabel="Total Extra"
                  info="Puntos *extra* generados por el *bonus de capitán*"
                  valueA={stats.extras.user.captain.extra_points.value || 0}
                  rankA={stats.extras.user.captain.extra_points.rank}
                  valueB={stats.extras.rival.captain.extra_points.value || 0}
                  rankB={stats.extras.rival.captain.extra_points.rank}
                  highlightColor="text-pink-400"
                />
                <ComparisonRow
                  label="Media Capitán"
                  info="Promedio total *(base + bonus)* del jugador capitán"
                  valueA={stats.extras.user.captain.avg_points.value || 0}
                  rankA={stats.extras.user.captain.avg_points.rank}
                  valueB={stats.extras.rival.captain.avg_points.value || 0}
                  rankB={stats.extras.rival.captain.avg_points.rank}
                  format={(v) => v.toFixed(1)}
                  highlightColor="text-pink-400"
                />
              </div>
            </div>
          </div>

          {/* GROUP 3: ADVANCED */}
          <div className="space-y-6">
            <div>
              <SectionHeader title="Gestión y Consistencia" icon={Target} color="text-orange-400" />
              <div className="space-y-0.5">
                <ComparisonRow
                  label="Jornadas Perfectas"
                  subLabel="Eficiencia > 95%"
                  info="Rondas donde obtuviste el *95% o más* de tus puntos posibles"
                  valueA={stats.rounds.user.perfectRounds.value}
                  rankA={stats.rounds.user.perfectRounds.rank}
                  valueB={stats.rounds.rival.perfectRounds.value}
                  rankB={stats.rounds.rival.perfectRounds.rank}
                  highlightColor="text-orange-400"
                />
                <ComparisonRow
                  label="Fiabilidad"
                  subLabel="% Rondas > Media"
                  info="Porcentaje de jornadas *superando la media* de la liga"
                  valueA={parseFloat(stats.adv.user.reliability?.pct || 0)}
                  rankA={stats.adv.user.reliability?.rank}
                  valueB={parseFloat(stats.adv.rival.reliability?.pct || 0)}
                  rankB={stats.adv.rival.reliability?.rank}
                  format={(v) => v.toFixed(1) + '%'}
                  highlightColor="text-orange-400"
                />
                <ComparisonRow
                  label="Consistencia (Desviación)"
                  subLabel="Menos es mejor"
                  info="*Desviación estándar*. Valores bajos indican puntuaciones estables"
                  valueA={parseFloat(stats.adv.user.volatility?.std_dev || 0)}
                  rankA={stats.adv.user.volatility?.rank}
                  valueB={parseFloat(stats.adv.rival.volatility?.std_dev || 0)}
                  rankB={stats.adv.rival.volatility?.rank}
                  inverse={true}
                  format={(v) => v.toFixed(1)}
                  highlightColor="text-orange-400"
                />
                <ComparisonRow
                  label="Puntos Perdidos"
                  subLabel="Menos es mejor"
                  info="Total de puntos dejados en el *banquillo* (Ideal - Actual)"
                  valueA={stats.rounds.user.pointsLost.value}
                  rankA={stats.rounds.user.pointsLost.rank}
                  valueB={stats.rounds.rival.pointsLost.value}
                  rankB={stats.rounds.rival.pointsLost.rank}
                  inverse={true}
                  format={(v) => Math.round(v)}
                  highlightColor="text-orange-400"
                />
                <div className="pt-2"></div>
                <ComparisonRow
                  label="Suelo (Puntuación Mínima)"
                  info="La *peor* puntuación obtenida en una jornada"
                  valueA={stats.adv.user.floorCeiling?.floor || 0}
                  rankA={stats.adv.user.floorCeiling?.rank}
                  valueB={stats.adv.rival.floorCeiling?.floor || 0}
                  rankB={stats.adv.rival.floorCeiling?.rank}
                  highlightColor="text-orange-400"
                />
                <ComparisonRow
                  label="Techo (Puntuación Máxima)"
                  info="La *mejor* puntuación obtenida en una jornada"
                  valueA={stats.adv.user.floorCeiling?.ceiling || 0}
                  rankA={stats.adv.user.floorCeiling?.rank}
                  valueB={stats.adv.rival.floorCeiling?.ceiling || 0}
                  rankB={stats.adv.rival.floorCeiling?.rank}
                  highlightColor="text-orange-400"
                />
              </div>
            </div>

            <div>
              <SectionHeader title="Dominio y Competitividad" icon={Zap} color="text-emerald-400" />
              <div className="space-y-0.5">
                <ComparisonRow
                  label="Margen de Victoria"
                  subLabel="Promedio pts"
                  info="Diferencia media de puntos sobre el *2do* cuando ganas la jornada"
                  valueA={parseFloat(stats.adv.user.dominance?.avg_margin || 0)}
                  rankA={stats.adv.user.dominance?.rank}
                  valueB={parseFloat(stats.adv.rival.dominance?.avg_margin || 0)}
                  rankB={stats.adv.rival.dominance?.rank}
                  format={(v) => '+' + v.toFixed(1)}
                  highlightColor="text-emerald-400"
                />
                <ComparisonRow
                  label="Rendimiento vs Liga"
                  subLabel="Diff Promedio"
                  info="Diferencia media de tus puntos respecto a la *media de la liga*"
                  valueA={parseFloat(stats.adv.user.leaguePerf?.avg_diff || 0)}
                  rankA={stats.adv.user.leaguePerf?.rank}
                  valueB={parseFloat(stats.adv.rival.leaguePerf?.avg_diff || 0)}
                  rankB={stats.adv.rival.leaguePerf?.rank}
                  format={(v) => (v > 0 ? '+' : '') + v.toFixed(1)}
                  highlightColor="text-emerald-400"
                />
                <ComparisonRow
                  label="Gap Teórico"
                  subLabel="% de Puntos Posibles"
                  info="Porcentaje de puntos obtenidos respecto a *ganar todas las jornadas* (puntuación perfecta)"
                  valueA={parseFloat(stats.adv.user.gap?.pct || 0)}
                  rankA={stats.adv.user.gap?.rank}
                  valueB={parseFloat(stats.adv.rival.gap?.pct || 0)}
                  rankB={stats.adv.rival.gap?.rank}
                  format={(v) => v.toFixed(1) + '%'}
                  highlightColor="text-emerald-400"
                />
              </div>
            </div>

            <div>
              <SectionHeader title="Rachas e Hitos" icon={Flame} color="text-red-400" />
              <div className="space-y-0.5">
                <ComparisonRow
                  label="Racha Actual"
                  info="Jornadas consecutivas (ACTIVAS) sumando más de *175 puntos*"
                  valueA={stats.adv.user.streak?.current_streak || 0}
                  rankA={stats.adv.user.streak?.currentRank}
                  valueB={stats.adv.rival.streak?.current_streak || 0}
                  rankB={stats.adv.rival.streak?.currentRank}
                  highlightColor="text-red-400"
                />
                <ComparisonRow
                  label="Racha Histórica (Mejor)"
                  info="Récord de jornadas consecutivas sumando más de *175 puntos*"
                  valueA={stats.adv.user.streak?.longest_streak || 0}
                  rankA={stats.adv.user.streak?.rank}
                  valueB={stats.adv.rival.streak?.longest_streak || 0}
                  rankB={stats.adv.rival.streak?.rank}
                  highlightColor="text-red-400"
                />
                <ComparisonRow
                  label="Racha de Fuego"
                  info="Comparación de tu *media reciente (5J)* vs tu media de temporada. Positivo = En racha"
                  valueA={parseFloat(stats.adv.user.heat?.diff || 0)}
                  rankA={stats.adv.user.heat?.rank}
                  valueB={parseFloat(stats.adv.rival.heat?.diff || 0)}
                  rankB={stats.adv.rival.heat?.rank}
                  format={(v) => v.toFixed(0)}
                  highlightColor="text-red-400"
                />
                <ComparisonRow
                  label="Cazador (vs Líder)"
                  subLabel="Pts recortados (5J)"
                  info="Puntos *recortados al líder* actual en las últimas 5 jornadas"
                  valueA={stats.adv.user.hunter?.gained || 0}
                  rankA={stats.adv.user.hunter?.rank}
                  valueB={stats.adv.rival.hunter?.gained || 0}
                  rankB={stats.adv.rival.hunter?.rank}
                  highlightColor="text-red-400"
                />
                <ComparisonRow
                  label="Pecho Frío (Bottler)"
                  subLabel="Score"
                  info="Índice que mide *segundas y terceras posiciones* sin victorias (Menos es mejor)"
                  valueA={stats.adv.user.bottler?.bottler_score || 0}
                  rankA={stats.adv.user.bottler?.rank}
                  valueB={stats.adv.rival.bottler?.bottler_score || 0}
                  rankB={stats.adv.rival.bottler?.rank}
                  inverse={true}
                  highlightColor="text-red-400"
                />
                <ComparisonRow
                  label="El Pupas (Jinx)"
                  subLabel="Rondas Malditas"
                  info="Rondas con puntuación *superior a la media* pero acabando en la *mitad inferior*"
                  valueA={stats.adv.user.jinx?.jinxed_count || 0}
                  rankA={stats.adv.user.jinx?.rank}
                  valueB={stats.adv.rival.jinx?.jinxed_count || 0}
                  rankB={stats.adv.rival.jinx?.rank}
                  highlightColor="text-red-400"
                />
                <ComparisonRow
                  label="Rompecorazones"
                  subLabel="Pts Perdidos"
                  info="Puntos perdidos en jornadas donde quedaste *2º o 3º* (Casi ganas)"
                  valueA={stats.adv.user.heartbreaker?.total_diff || 0}
                  rankA={stats.adv.user.heartbreaker?.rank}
                  valueB={stats.adv.rival.heartbreaker?.total_diff || 0}
                  rankB={stats.adv.rival.heartbreaker?.rank}
                  highlightColor="text-red-400"
                />
                <ComparisonRow
                  label="Mala Suerte (No Glory)"
                  subLabel="Pts sin ganar"
                  info="Total de puntos sumados en jornadas donde *NO ganaste*"
                  valueA={stats.adv.user.noGlory?.total_points_no_glory || 0}
                  rankA={stats.adv.user.noGlory?.rank}
                  valueB={stats.adv.rival.noGlory?.total_points_no_glory || 0}
                  rankB={stats.adv.rival.noGlory?.rank}
                  highlightColor="text-red-400"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ElegantCard>
  );
}
