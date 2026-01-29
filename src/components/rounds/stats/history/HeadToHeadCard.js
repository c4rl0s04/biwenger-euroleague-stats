'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { ChevronDown, Trophy, Zap, Activity, Brain, Target, Banknote } from 'lucide-react';
import { getColorForUser } from '@/lib/constants/colors';

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

    const userFullData = allUsersHistory.find((u) => String(u.userId) === String(currentUser.id));
    const rivalFullData = allUsersHistory.find((u) => String(u.userId) === String(rivalId));

    const userHistory = userFullData?.history || [];
    const rivalHistory = rivalFullData?.history || [];
    const rivalUser = usersList.find((u) => String(u.id) === String(rivalId));

    if (!rivalUser) return null;

    // --- 1. Rounds History Logic & Consistency ---
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

    const calculateHistoryStats = (hist) => {
      if (!hist.length)
        return { best: 0, avgEff: 0, totalRounds: 0, pointsLost: 0, perfectRounds: 0 };

      const avgEff = hist.reduce((sum, r) => sum + (r.efficiency || 0), 0) / hist.length;
      const best = Math.max(...hist.map((r) => r.actual_points));

      // New calc: Points Lost
      const pointsLost = hist.reduce(
        (sum, r) => sum + Math.max(0, (r.ideal_points || 0) - r.actual_points),
        0
      );

      // New calc: Perfect Rounds (>99% efficiency & participated)
      const perfectRounds = hist.filter((r) => (r.efficiency || 0) >= 99 && r.participated).length;

      return { best, avgEff, totalRounds: hist.length, pointsLost, perfectRounds };
    };

    const userRounds = calculateHistoryStats(userHistory);
    const rivalRounds = calculateHistoryStats(rivalHistory);

    // Current Form (Last 5)
    const userForm =
      [...userHistory]
        .sort((a, b) => b.round_number - a.round_number)
        .slice(0, 5)
        .reduce((sum, r) => sum + r.actual_points, 0) / 5;
    const rivalForm =
      [...rivalHistory]
        .sort((a, b) => b.round_number - a.round_number)
        .slice(0, 5)
        .reduce((sum, r) => sum + r.actual_points, 0) / 5;

    // Helper to calculate rank from a list
    const getRank = (list, key, uid, descending = true) => {
      if (!list || !list.length) return null;
      // Sort a copy
      const sorted = [...list].sort((a, b) => {
        const valA = parseFloat(a[key] || 0);
        const valB = parseFloat(b[key] || 0);
        return descending ? valB - valA : valA - valB;
      });
      const index = sorted.findIndex((item) => String(item.user_id) === String(uid));
      return index !== -1 ? index + 1 : null;
    };

    // --- 2. Standings Logic (General Stats) ---
    const getStandingsStats = (uid) => {
      const u = String(uid);
      const row = standings.find((s) => String(s.user_id) === u);
      return {
        totalPoints: { value: row?.total_points || 0, rank: getRank(standings, 'total_points', u) },
        teamValue: { value: row?.team_value || 0, rank: getRank(standings, 'team_value', u) },
        titles: { value: row?.titles || 0, rank: null },
      };
    };
    const userGeneral = getStandingsStats(currentUser.id);
    const rivalGeneral = getStandingsStats(rivalId);

    // --- 2b. Captain & Home/Away Stats ---
    // (Assume no ranking needed for private stats like Captain usage for now, or difficult to calculate without full list)
    const getExtraStats = (data) => {
      return {
        captain: data?.captain || {},
        homeAway: data?.homeAway || {},
      };
    };
    const userExtras = getExtraStats(userFullData);
    const rivalExtras = getExtraStats(rivalFullData);

    // --- 3. Predictions Logic (Porras) ---
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

    // --- 4. ADVANCED STATS LOGIC ---
    // Most advanced stats lists come pre-sorted from DB, so index is rank
    const getAdvanced = (uid) => {
      const u = String(uid);
      const findStat = (dataset, key = 'user_id') => {
        const index = dataset?.findIndex((item) => String(item[key]) === u);
        const item = index !== -1 ? dataset[index] : {};
        return { ...item, rank: index !== -1 ? index + 1 : null };
      };

      return {
        streak: findStat(advancedStats.streaks),
        heat: findStat(advancedStats.heatCheck),
        hunter: findStat(advancedStats.hunter),
        bottler: findStat(advancedStats.bottler),
        heartbreaker: findStat(advancedStats.heartbreaker),
        noGlory: findStat(advancedStats.noGlory),
        jinx: findStat(advancedStats.jinx),
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
      extras: { user: userExtras, rival: rivalExtras },
      rounds: { user: userRounds, rival: rivalRounds },
      form: { user: userForm, rival: rivalForm },
      preds: { user: userPreds, rival: rivalPreds },
      adv: { user: userAdv, rival: rivalAdv },
    };
  }, [currentUser, rivalId, allUsersHistory, usersList, standings, predictions, advancedStats]);

  if (!stats) return null;

  const userColor = getColorForUser(currentUser.id, currentUser.name, currentUser.color_index);
  const rivalColor = getColorForUser(stats.rival.id, stats.rival.name, stats.rival.color_index);

  // Helper for Comparison Bars
  const ComparisonRow = ({
    label,
    subLabel,
    valueA,
    valueB,
    rankA,
    rankB,
    format = (v) => v,
    inverse = false,
  }) => {
    // If values are objects with {value, rank}, unwrap them.
    // Wait, the call sites below might pass primitive values OR objects if I didn't update all.
    // For safety, let's treat valueA/valueB as primitive, and rankA/rankB as optional props.

    // Actually, cleaner design:
    // The calling code extracts .value and passes it to valueA.
    // The calling code extracts .rank and passes it to rankA.

    const winA = inverse ? valueA < valueB : valueA > valueB;
    const winB = inverse ? valueB < valueA : valueB > valueA;
    const tie = valueA === valueB;

    const max = Math.max(valueA, valueB) || 1;
    const widthA = (Math.abs(valueA) / max) * 100;
    const widthB = (Math.abs(valueB) / max) * 100;

    const RankBadge = ({ rank }) => {
      if (!rank) return null;
      let color = 'text-zinc-500 bg-zinc-800/50';
      if (rank === 1) color = 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      if (rank === 2) color = 'text-zinc-300 bg-zinc-300/10 border-zinc-300/20';
      if (rank === 3) color = 'text-amber-600 bg-amber-600/10 border-amber-600/20';

      return (
        <span
          className={`text-[10px] font-mono ml-2 px-1.5 py-0.5 rounded border border-transparent ${color}`}
        >
          (#{rank})
        </span>
      );
    };

    return (
      <div className="flex items-center gap-4 py-3 border-b border-white/5 last:border-0 group hover:bg-white/5 transition-colors px-2 rounded-lg">
        {/* USER A VALUE */}
        <div
          className={`w-28 text-right font-bold text-sm flex items-center justify-end ${winA ? userColor.text : 'text-zinc-500'}`}
        >
          <RankBadge rank={rankA} />
          <span className="ml-2">{format(valueA)}</span>
        </div>

        <div className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium group-hover:text-white transition-colors text-center leading-3">
            {label}{' '}
            {subLabel && (
              <span className="block text-zinc-600 text-[9px] mt-0.5">({subLabel})</span>
            )}
          </span>
          <div className="flex w-full h-2 rounded-full overflow-hidden bg-zinc-800">
            <div className="flex-1 flex justify-end pr-0.5">
              <div
                style={{
                  width: `${widthA}%`,
                  backgroundColor: winA || tie ? userColor.stroke : '#52525b',
                }}
                className="h-full rounded-l-full transition-all duration-500 min-w-[2px]"
              />
            </div>
            <div className="w-px bg-zinc-900" />
            <div className="flex-1 flex pl-0.5">
              <div
                style={{
                  width: `${widthB}%`,
                  backgroundColor: winB || tie ? rivalColor.stroke : '#52525b',
                }}
                className="h-full rounded-r-full transition-all duration-500 min-w-[2px]"
              />
            </div>
          </div>
        </div>

        {/* USER B VALUE */}
        <div
          className={`w-28 text-left font-bold text-sm flex items-center justify-start ${winB ? rivalColor.text : 'text-zinc-500'}`}
        >
          <span className="mr-2">{format(valueB)}</span>
          <RankBadge rank={rankB} />
        </div>
      </div>
    );
  };

  const SectionHeader = ({ title, icon: Icon }) => (
    <div className="flex items-center gap-2 mb-4 mt-8 pb-2 border-b border-white/10 first:mt-0">
      <Icon className="w-4 h-4 text-indigo-400" />
      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">{title}</h4>
    </div>
  );

  return (
    <div className="bg-zinc-900/50 border border-white/5 rounded-xl text-white overflow-hidden shadow-2xl">
      {/* HEADER */}
      <div className="p-4 bg-zinc-900 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-400" />
          <h3 className="font-bold text-sm uppercase tracking-wide">Centro de Comparación</h3>
        </div>

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
      </div>

      {/* BODY */}
      <div className="p-6">
        {/* MATCHUP HEADER */}
        <div className="flex items-center justify-center gap-4 md:gap-12 mb-10">
          {/* User A */}
          <div className="flex flex-col items-center gap-3 w-32 md:w-40 relative">
            <div
              className="w-20 h-20 md:w-24 md:h-24 rounded-full p-1 relative shadow-2xl transition-transform hover:scale-105"
              style={{ background: `linear-gradient(135deg, ${userColor.stroke}, transparent)` }}
            >
              {currentUser.icon ? (
                <Image
                  src={currentUser.icon}
                  alt={currentUser.name}
                  width={96}
                  height={96}
                  className="rounded-full w-full h-full object-cover bg-zinc-900"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full rounded-full bg-zinc-800 flex items-center justify-center text-xl font-bold">
                  {currentUser.name[0]}
                </div>
              )}
            </div>
            <div className={`font-bold text-lg text-center leading-tight ${userColor.text}`}>
              {currentUser.name}
            </div>
          </div>

          {/* VS SCOREBOARD */}
          <div className="flex flex-col items-center bg-zinc-950/50 px-6 py-4 rounded-2xl border border-white/5 shadow-inner">
            <div className="flex items-baseline gap-4 text-5xl md:text-6xl font-black tabular-nums tracking-tighter drop-shadow-lg">
              <span
                className={
                  stats.record.wins > stats.record.losses ? userColor.text : 'text-zinc-600'
                }
              >
                {stats.record.wins}
              </span>
              <span className="text-zinc-800 text-3xl">-</span>
              <span
                className={
                  stats.record.losses > stats.record.wins ? rivalColor.text : 'text-zinc-600'
                }
              >
                {stats.record.losses}
              </span>
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mt-2 font-bold">
              Historial (V-D)
            </div>
            {stats.record.ties > 0 && (
              <div className="text-[10px] text-zinc-600 mt-1 font-medium">
                {stats.record.ties} Empates
              </div>
            )}
          </div>

          {/* User B */}
          <div className="flex flex-col items-center gap-3 w-32 md:w-40 relative">
            <div
              className="w-20 h-20 md:w-24 md:h-24 rounded-full p-1 relative shadow-2xl transition-transform hover:scale-105"
              style={{ background: `linear-gradient(135deg, ${rivalColor.stroke}, transparent)` }}
            >
              {stats.rival.icon ? (
                <Image
                  src={stats.rival.icon}
                  alt={stats.rival.name}
                  width={96}
                  height={96}
                  className="rounded-full w-full h-full object-cover bg-zinc-900"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full rounded-full bg-zinc-800 flex items-center justify-center text-xl font-bold">
                  {stats.rival.name[0]}
                </div>
              )}
            </div>
            <div className={`font-bold text-lg text-center leading-tight ${rivalColor.text}`}>
              {stats.rival.name}
            </div>
          </div>
        </div>

        {/* STATS SECTIONS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0 max-w-5xl mx-auto">
          {/* LEFT COLUMN */}
          <div>
            <SectionHeader title="Estadísticas Generales" icon={Trophy} />
            <div className="space-y-1">
              <ComparisonRow
                label="Puntos Totales"
                valueA={stats.general.user.totalPoints.value}
                rankA={stats.general.user.totalPoints.rank}
                valueB={stats.general.rival.totalPoints.value}
                rankB={stats.general.rival.totalPoints.rank}
                format={(v) => v.toLocaleString()}
              />
              <ComparisonRow
                label="Valor de Plantilla"
                valueA={stats.general.user.teamValue.value}
                rankA={stats.general.user.teamValue.rank}
                valueB={stats.general.rival.teamValue.value}
                rankB={stats.general.rival.teamValue.rank}
                format={(v) => (v / 1000000).toFixed(1) + 'M'}
              />
            </div>

            <SectionHeader title="Predicciones (Porras)" icon={Brain} />
            <div className="space-y-1">
              <ComparisonRow
                label="Aciertos Totales"
                valueA={stats.preds.user.hits.value}
                rankA={stats.preds.user.hits.rank}
                valueB={stats.preds.rival.hits.value}
                rankB={stats.preds.rival.hits.rank}
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
                />
              )}
              <ComparisonRow
                label="Jornadas Ganadas"
                valueA={stats.preds.user.victories.value}
                rankA={stats.preds.user.victories.rank}
                valueB={stats.preds.rival.victories.value}
                rankB={stats.preds.rival.victories.rank}
              />
              <ComparisonRow
                label="Factor Clutch"
                subLabel="Media ult. 3"
                valueA={stats.preds.user.clutch.value}
                rankA={stats.preds.user.clutch.rank}
                valueB={stats.preds.rival.clutch.value}
                rankB={stats.preds.rival.clutch.rank}
                format={(v) => v.toFixed(1)}
              />
              <ComparisonRow
                label="Plenos (10/10)"
                valueA={stats.preds.user.perfect10s}
                valueB={stats.preds.rival.perfect10s}
              />
              <ComparisonRow
                label="Roscos (Último)"
                subLabel="Menos es mejor"
                valueA={stats.preds.user.roscos}
                valueB={stats.preds.rival.roscos}
                inverse={true}
              />
            </div>

            <SectionHeader title="Capitán y Localía" icon={Banknote} />
            <div className="space-y-1">
              <ComparisonRow
                label="Puntos de Capitán"
                subLabel="Total Extra"
                valueA={stats.extras.user.captain.extra_points || 0}
                valueB={stats.extras.rival.captain.extra_points || 0}
              />
              <ComparisonRow
                label="Media Capitán"
                valueA={stats.extras.user.captain.avg_points || 0}
                valueB={stats.extras.rival.captain.avg_points || 0}
                format={(v) => v.toFixed(1)}
              />
              <ComparisonRow
                label="Media en Casa"
                valueA={stats.extras.user.homeAway.avg_home || 0}
                valueB={stats.extras.rival.homeAway.avg_home || 0}
                format={(v) => v.toFixed(1)}
              />
              <ComparisonRow
                label="Media Fuera"
                valueA={stats.extras.user.homeAway.avg_away || 0}
                valueB={stats.extras.rival.homeAway.avg_away || 0}
                format={(v) => v.toFixed(1)}
              />
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div>
            <SectionHeader title="Rendimiento en Jornadas" icon={Activity} />
            <div className="space-y-1">
              <ComparisonRow
                label="Eficiencia Media"
                valueA={stats.rounds.user.avgEff}
                valueB={stats.rounds.rival.avgEff}
                format={(v) => v.toFixed(1) + '%'}
              />
              <ComparisonRow
                label="Mejor Puntuación"
                valueA={stats.rounds.user.best}
                valueB={stats.rounds.rival.best}
              />
              <ComparisonRow
                label="Forma Reciente"
                subLabel="Media ult. 5"
                valueA={stats.form.user}
                valueB={stats.form.rival}
                format={(v) => v.toFixed(1)}
              />
            </div>
          </div>

          {/* STATS SECTIONS - ROW 2 (Wide Layout) */}
          <div className="col-span-1 md:col-span-2 mt-8 md:mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
              {/* ADVANCED: Efficiency & Consistency */}
              <div>
                <SectionHeader title="Gestión y Consistencia" icon={Target} />
                <div className="space-y-1">
                  <ComparisonRow
                    label="Jornadas Perfectas"
                    subLabel="Eficiencia > 99%"
                    valueA={stats.rounds.user.perfectRounds}
                    valueB={stats.rounds.rival.perfectRounds}
                  />
                  <ComparisonRow
                    label="Fiabilidad"
                    subLabel="% Rondas > Media"
                    valueA={parseFloat(stats.adv.user.reliability?.pct || 0)}
                    rankA={stats.adv.user.reliability?.rank}
                    valueB={parseFloat(stats.adv.rival.reliability?.pct || 0)}
                    rankB={stats.adv.rival.reliability?.rank}
                    format={(v) => v.toFixed(1) + '%'}
                  />
                  <ComparisonRow
                    label="Consistencia (Desviación)"
                    subLabel="Menos es mejor"
                    valueA={parseFloat(stats.adv.user.volatility?.std_dev || 0)}
                    rankA={stats.adv.user.volatility?.rank}
                    valueB={parseFloat(stats.adv.rival.volatility?.std_dev || 0)}
                    rankB={stats.adv.rival.volatility?.rank}
                    inverse={true}
                    format={(v) => v.toFixed(1)}
                  />
                  <ComparisonRow
                    label="Puntos Perdidos"
                    subLabel="Menos es mejor"
                    valueA={stats.rounds.user.pointsLost}
                    valueB={stats.rounds.rival.pointsLost}
                    inverse={true}
                    format={(v) => Math.round(v)}
                  />
                  <div className="pt-2"></div>
                  <ComparisonRow
                    label="Suelo (Puntuación Mínima)"
                    valueA={stats.adv.user.floorCeiling?.floor || 0}
                    rankA={stats.adv.user.floorCeiling?.rank}
                    valueB={stats.adv.rival.floorCeiling?.floor || 0}
                    rankB={stats.adv.rival.floorCeiling?.rank}
                  />
                  <ComparisonRow
                    label="Techo (Puntuación Máxima)"
                    valueA={stats.adv.user.floorCeiling?.ceiling || 0}
                    rankA={stats.adv.user.floorCeiling?.rank}
                    valueB={stats.adv.rival.floorCeiling?.ceiling || 0}
                    rankB={stats.adv.rival.floorCeiling?.rank}
                  />
                </div>
              </div>

              {/* ADVANCED: Streaks & Curiosities */}
              <div>
                <SectionHeader title="Dominio y Competitividad" icon={Zap} />
                <div className="space-y-1">
                  <ComparisonRow
                    label="Margen de Victoria"
                    subLabel="Promedio pts"
                    valueA={parseFloat(stats.adv.user.dominance?.avg_margin || 0)}
                    rankA={stats.adv.user.dominance?.rank}
                    valueB={parseFloat(stats.adv.rival.dominance?.avg_margin || 0)}
                    rankB={stats.adv.rival.dominance?.rank}
                    format={(v) => '+' + v.toFixed(1)}
                  />
                  <ComparisonRow
                    label="Rendimiento vs Liga"
                    subLabel="Diff Promedio"
                    valueA={parseFloat(stats.adv.user.leaguePerf?.avg_diff || 0)}
                    rankA={stats.adv.user.leaguePerf?.rank}
                    valueB={parseFloat(stats.adv.rival.leaguePerf?.avg_diff || 0)}
                    rankB={stats.adv.rival.leaguePerf?.rank}
                    format={(v) => (v > 0 ? '+' : '') + v.toFixed(1)}
                  />
                  <ComparisonRow
                    label="Gap Teórico"
                    subLabel="% de Puntos Posibles"
                    valueA={parseFloat(stats.adv.user.gap?.pct || 0)}
                    rankA={stats.adv.user.gap?.rank}
                    valueB={parseFloat(stats.adv.rival.gap?.pct || 0)}
                    rankB={stats.adv.rival.gap?.rank}
                    format={(v) => v.toFixed(1) + '%'}
                  />

                  <div className="py-2 border-t border-white/5 my-2">
                    <h5 className="text-[10px] uppercase font-bold text-zinc-500 mb-2">
                      Rachas e Hitos
                    </h5>
                  </div>

                  <ComparisonRow
                    label="Racha Actual"
                    valueA={stats.adv.user.streak?.longest_streak || 0}
                    rankA={stats.adv.user.streak?.rank}
                    valueB={stats.adv.rival.streak?.longest_streak || 0}
                    rankB={stats.adv.rival.streak?.rank}
                  />
                  <ComparisonRow
                    label="Racha de Fuego"
                    valueA={parseFloat(stats.adv.user.heat?.diff || 0)}
                    rankA={stats.adv.user.heat?.rank}
                    valueB={parseFloat(stats.adv.rival.heat?.diff || 0)}
                    rankB={stats.adv.rival.heat?.rank}
                    format={(v) => v.toFixed(0)}
                  />
                  <ComparisonRow
                    label="Cazador (vs Líder)"
                    subLabel="Pts recortados (5J)"
                    valueA={stats.adv.user.hunter?.gained || 0}
                    rankA={stats.adv.user.hunter?.rank}
                    valueB={stats.adv.rival.hunter?.gained || 0}
                    rankB={stats.adv.rival.hunter?.rank}
                  />
                  <ComparisonRow
                    label="Pecho Frío (Bottler)"
                    subLabel="Score (Menos es mejor)"
                    valueA={stats.adv.user.bottler?.bottler_score || 0}
                    rankA={stats.adv.user.bottler?.rank}
                    valueB={stats.adv.rival.bottler?.bottler_score || 0}
                    rankB={stats.adv.rival.bottler?.rank}
                    inverse={true}
                  />
                  <ComparisonRow
                    label="Mala Suerte (No Glory)"
                    subLabel="Pts sin ganar"
                    valueA={stats.adv.user.noGlory?.total_points_no_glory || 0}
                    rankA={stats.adv.user.noGlory?.rank}
                    valueB={stats.adv.rival.noGlory?.total_points_no_glory || 0}
                    rankB={stats.adv.rival.noGlory?.rank}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
