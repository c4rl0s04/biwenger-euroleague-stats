/** Pure comparison calculations; formulas and ranking quirks preserved from the original card.
 * @param {import('../models/compare').HeadToHeadProps & { rivalId: string | number | null }} input
 */
export function calculateHeadToHead({
  currentUser,
  rivalId,
  allUsersHistory = [],
  usersList = [],
  standings = [],
  predictions = {},
  advancedStats = {},
}) {
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
      roundWins: {
        value: parseInt(row?.round_wins || 0),
        rank: getRank(standings, 'round_wins', u),
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
    if (!advancedStats) {
      return {
        streak: {},
        heat: {},
        hunter: {},
        bottler: {},
        heartbreaker: {},
        noGlory: {},
        jinx: {},
        floorCeiling: {},
        volatility: {},
        dominance: {},
        reliability: {},
        gap: {},
        leaguePerf: {},
      };
    }

    const u = String(uid);
    const findStat = (dataset, key = 'user_id') => {
      if (!dataset) return {};
      const index = dataset.findIndex((item) => String(item[key]) === u);
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
    advancedStats &&
    advancedStats.rivalryMatrix &&
    advancedStats.rivalryMatrix[currentUser.id] &&
    advancedStats.rivalryMatrix[currentUser.id][rivalId]
  ) {
    recordToUse = advancedStats.rivalryMatrix[currentUser.id][rivalId];
  }

  // --- 6. Market ---
  const getMarket = (uid) => {
    if (!advancedStats || !advancedStats.market) return {};
    const u = String(uid);
    const row = advancedStats.market.find((s) => String(s.user_id) === u);
    const sellerRow = advancedStats.bestSeller?.find((s) => String(s.user_id) === u);
    const thiefRow = advancedStats.theThief?.find(
      (s) =>
        String(s.user_id) === u ||
        s.name === (uid === currentUser.id ? currentUser.name : rivalUser?.name)
    );

    return {
      purchases: {
        count: row?.purchases_count || 0,
        total: row?.purchases_total || 0,
      },
      sales: {
        count: row?.sales_count || 0,
        total: row?.sales_total || 0,
      },
      balance: {
        value: row?.balance || 0,
        rank: getRank(advancedStats.market, 'balance', u, true),
      },
      bestSeller: {
        netProfit: sellerRow?.net_profit || 0,
        salesCount: sellerRow?.sales_count || 0,
        rank: getRank(advancedStats.bestSeller || [], 'net_profit', u, true),
      },
      theThief: {
        stolenCount: thiefRow?.stolen_count || 0,
        rank: getRank(advancedStats.theThief || [], 'stolen_count', u, true),
      },
      spentRank: getRank(advancedStats.market, 'purchases_total', u, true),
      incomeRank: getRank(advancedStats.market, 'sales_total', u, true),
    };
  };
  const userMarket = getMarket(currentUser.id);
  const rivalMarket = getMarket(rivalId);

  // Bidding Duels Record
  let duelsRecord = { wins: 0, losses: 0, duels: 0, avg_margin: 0 };
  if (
    advancedStats?.biddingDuels?.matrix &&
    advancedStats.biddingDuels.matrix[currentUser.id] &&
    advancedStats.biddingDuels.matrix[currentUser.id][rivalId]
  ) {
    const duelStats = advancedStats.biddingDuels.matrix[currentUser.id][rivalId];
    duelsRecord = {
      wins: duelStats.wins || 0,
      losses: duelStats.losses || 0,
      duels: duelStats.duels || 0,
      avg_margin: duelStats.duels > 0 ? duelStats.total_margin / duelStats.duels : 0,
    };
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
    market: { user: userMarket, rival: rivalMarket },
    duels: duelsRecord,
  };
}
