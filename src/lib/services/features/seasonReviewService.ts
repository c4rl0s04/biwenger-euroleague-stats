import 'server-only';
import { getSeasonReviewRawData, type SeasonReviewRawData } from '../../db';
import { cached, CACHE_TTL } from '../../utils/cache';
import {
  DEFAULT_SCENARIO,
  POSITION_PRESETS,
  PROFILE_DEFINITIONS,
  isParetoDominated,
  rankRound,
  scenarioConfigSchema,
  simulateScenario,
  weightedScore,
} from '../../season-review/engine';
import {
  REVIEW_SEASON_ID,
  type DataQualityReport,
  type LeverDiagnostic,
  type RecommendationProfile,
  type ReviewRound,
  type ReviewUser,
  type ScenarioConfig,
  type ScenarioResult,
  type SeasonReviewDataset,
  type SeasonReviewOverview,
  type TimelinePoint,
} from '../../season-review/types';

const USER_COLORS = ['#fa5001', '#38bdf8', '#a78bfa', '#34d399', '#fbbf24', '#fb7185', '#94a3b8'];

const dayOf = (value: string) => value.slice(0, 10);
const keyOf = (userId: string, roundId: number) => `${userId}:${roundId}`;

function buildIdealPlayers(raw: SeasonReviewRawData) {
  const byRound = new Map<number, SeasonReviewRawData['playerStats']>();
  raw.playerStats.forEach((row) => {
    const rows = byRound.get(row.round_id) || [];
    rows.push(row);
    byRound.set(row.round_id, rows);
  });

  const idealByRound = new Map<number, Set<number>>();
  const mvpByRound = new Map<number, Set<number>>();
  byRound.forEach((rows, roundId) => {
    const sorted = [...rows].sort(
      (left, right) =>
        Number(right.fantasy_points) - Number(left.fantasy_points) ||
        left.player_id - right.player_id
    );
    const positionCount: Record<string, number> = { Base: 0, Alero: 0, Pivot: 0 };
    const starters: number[] = [];
    const used = new Set<number>();
    sorted.forEach((player) => {
      if (starters.length >= 5) return;
      const position = player.position || 'Base';
      if ((positionCount[position] || 0) >= 3) return;
      starters.push(player.player_id);
      used.add(player.player_id);
      positionCount[position] = (positionCount[position] || 0) + 1;
    });
    const bench = sorted
      .filter((player) => !used.has(player.player_id))
      .slice(0, 5)
      .map((player) => player.player_id);
    idealByRound.set(roundId, new Set([...starters, ...bench]));
    const maxPoints = sorted[0] ? Number(sorted[0].fantasy_points) : 0;
    mvpByRound.set(
      roundId,
      new Set(
        sorted
          .filter((player) => Number(player.fantasy_points) === maxPoints)
          .map((player) => player.player_id)
      )
    );
  });
  return { idealByRound, mvpByRound };
}

function reconstructEconomy(raw: SeasonReviewRawData) {
  const nameToId = new Map(raw.users.map((user) => [user.name, user.id]));
  const squads = new Map(raw.users.map((user) => [user.id, new Set<number>()]));
  const initialValues = new Map(raw.users.map((user) => [user.id, 0]));
  const marketNet = new Map(raw.users.map((user) => [user.id, 0]));
  raw.initialSquads.forEach((row) => {
    squads.get(row.user_id)?.add(row.player_id);
    initialValues.set(row.user_id, (initialValues.get(row.user_id) || 0) + Number(row.price));
  });

  const transfers = raw.transfers.map((transfer) => ({ ...transfer, day: dayOf(transfer.fecha) }));
  transfers.forEach((transfer) => {
    const sellerId = nameToId.get(transfer.vendedor);
    const buyerId = nameToId.get(transfer.comprador);
    if (sellerId) marketNet.set(sellerId, (marketNet.get(sellerId) || 0) + Number(transfer.precio));
    if (buyerId) marketNet.set(buyerId, (marketNet.get(buyerId) || 0) - Number(transfer.precio));
  });

  const pricesByDay = new Map<string, SeasonReviewRawData['marketValues']>();
  raw.marketValues.forEach((row) => {
    const rows = pricesByDay.get(dayOf(row.date)) || [];
    rows.push(row);
    pricesByDay.set(dayOf(row.date), rows);
  });
  const sortedDays = Array.from(pricesByDay.keys()).sort();
  const seasonStart = transfers[0]?.day || '2025-09-01';
  const currentPrices = new Map<number, number>();
  const rosterSizes: number[] = [];
  const squadValues: number[] = [];
  let transferIndex = 0;

  sortedDays.forEach((day) => {
    pricesByDay.get(day)?.forEach((row) => currentPrices.set(row.player_id, Number(row.price)));
    if (day < seasonStart) return;
    while (transferIndex < transfers.length && transfers[transferIndex].day <= day) {
      const transfer = transfers[transferIndex];
      const sellerId = nameToId.get(transfer.vendedor);
      const buyerId = nameToId.get(transfer.comprador);
      if (sellerId) squads.get(sellerId)?.delete(transfer.player_id);
      if (buyerId) squads.get(buyerId)?.add(transfer.player_id);
      transferIndex += 1;
    }
    raw.users.forEach((user) => {
      const squad = squads.get(user.id) || new Set<number>();
      rosterSizes.push(squad.size);
      squadValues.push(
        Array.from(squad).reduce((sum, playerId) => sum + (currentPrices.get(playerId) || 0), 0)
      );
    });
  });

  while (transferIndex < transfers.length) {
    const transfer = transfers[transferIndex];
    const sellerId = nameToId.get(transfer.vendedor);
    const buyerId = nameToId.get(transfer.comprador);
    if (sellerId) squads.get(sellerId)?.delete(transfer.player_id);
    if (buyerId) squads.get(buyerId)?.add(transfer.player_id);
    transferIndex += 1;
  }

  const users: ReviewUser[] = raw.users.map((user, index) => {
    const squad = squads.get(user.id) || new Set<number>();
    return {
      id: user.id,
      name: user.name,
      color: USER_COLORS[Number(user.color_index) % USER_COLORS.length] || USER_COLORS[index],
      initialSquadValue: initialValues.get(user.id) || 0,
      finalSquadValue: Array.from(squad).reduce(
        (sum, playerId) => sum + (currentPrices.get(playerId) || 0),
        0
      ),
      finalRosterSize: squad.size,
      marketNet: marketNet.get(user.id) || 0,
    };
  });
  return { users, rosterSizes, squadValues };
}

function normalizeDataset(raw: SeasonReviewRawData): SeasonReviewDataset {
  const { users, rosterSizes, squadValues } = reconstructEconomy(raw);
  const { idealByRound, mvpByRound } = buildIdealPlayers(raw);
  const lineupByUserRound = new Map<string, number[]>();
  raw.lineups.forEach((row) => {
    const key = keyOf(row.user_id, row.round_id);
    const players = lineupByUserRound.get(key) || [];
    players.push(row.player_id);
    lineupByUserRound.set(key, players);
  });
  const recordedByUserRound = new Map<string, number>();
  raw.finances.forEach((row) => {
    if (!row.user_id || row.round_id == null) return;
    recordedByUserRound.set(keyOf(row.user_id, row.round_id), Number(row.amount));
  });

  const roundRows = new Map<number, ReviewRound>();
  raw.userRounds.forEach((row) => {
    const round = roundRows.get(row.round_id) || {
      id: row.round_id,
      name: row.round_name,
      users: [],
    };
    const alignedPlayers = lineupByUserRound.get(keyOf(row.user_id, row.round_id)) || [];
    const idealPlayers = idealByRound.get(row.round_id) || new Set<number>();
    const mvpPlayers = mvpByRound.get(row.round_id) || new Set<number>();
    round.users.push({
      userId: row.user_id,
      points: Number(row.points),
      participated: Boolean(row.participated),
      recordedBonus: recordedByUserRound.get(keyOf(row.user_id, row.round_id)) || 0,
      porraResidual: 0,
      idealHits: alignedPlayers.filter((playerId) => idealPlayers.has(playerId)).length,
      mvpHits: alignedPlayers.filter((playerId) => mvpPlayers.has(playerId)).length,
    });
    roundRows.set(row.round_id, round);
  });

  const rounds = Array.from(roundRows.values())
    .filter((round) => round.users.some((entry) => entry.participated))
    .sort((left, right) => left.id - right.id);
  rounds.forEach((round) => {
    const ranked = new Map(rankRound(round).map((entry) => [entry.userId, entry]));
    round.users.forEach((entry) => {
      const inversePoints = ranked.get(entry.userId)?.inversePoints || 0;
      const difference = entry.recordedBonus - inversePoints * 10000;
      entry.porraResidual = difference > 5000 ? Math.round(difference) : 0;
    });
  });
  const baselineRecordedPayout = rounds.reduce(
    (sum, round) => sum + round.users.reduce((roundSum, user) => roundSum + user.recordedBonus, 0),
    0
  );
  const baselinePorraResidual = rounds.reduce(
    (sum, round) => sum + round.users.reduce((roundSum, user) => roundSum + user.porraResidual, 0),
    0
  );
  return {
    seasonId: REVIEW_SEASON_ID,
    users,
    rounds,
    structural: {
      rosterSizes,
      squadValues,
      automaticMarketSlots: raw.marketListings.map((row) => Number(row.automatic)),
      totalPlayers: raw.counts.totalPlayers,
      marketDays: raw.marketListings.length,
    },
    baselineRecordedPayout,
    baselinePorraResidual,
  };
}

const getCachedDataset = () =>
  cached('season-review:dataset:2025-26', CACHE_TTL.VERY_LONG, async () =>
    normalizeDataset(await getSeasonReviewRawData())
  );

function mergeConfig(base: ScenarioConfig, patch: Partial<ScenarioConfig>): ScenarioConfig {
  return scenarioConfigSchema.parse({ ...base, ...patch });
}

function candidateKey(config: ScenarioConfig) {
  return JSON.stringify(config);
}

function rankCandidates(
  dataset: SeasonReviewDataset,
  configs: ScenarioConfig[],
  weights: RecommendationProfile['weights']
) {
  const unique = Array.from(
    new Map(configs.map((config) => [candidateKey(config), config])).values()
  );
  return unique
    .map((config) => simulateScenario(dataset, config))
    .sort((left, right) => {
      const scoreDifference = weightedScore(right, weights) - weightedScore(left, weights);
      if (Math.abs(scoreDifference) > 0.001) return scoreDifference;
      const practicalityDifference = right.scores.practicality - left.scores.practicality;
      if (Math.abs(practicalityDifference) > 0.001) return practicalityDifference;
      return Math.abs(left.inflation) - Math.abs(right.inflation);
    });
}

function generateRecommendations(dataset: SeasonReviewDataset) {
  const payoutPatches: Array<Partial<ScenarioConfig>> = [];
  (['inverse', 'direct'] as const).forEach((payoutMode) => {
    ([5000, 7500, 10000] as const).forEach((eurosPerPoint) => {
      (['literal', 'neutral'] as const).forEach((budgetMode) =>
        payoutPatches.push({ payoutMode, eurosPerPoint, budgetMode })
      );
    });
  });
  ([0.25, 0.5, 0.75] as const).forEach((meritWeight) => {
    (['literal', 'neutral'] as const).forEach((budgetMode) =>
      payoutPatches.push({
        payoutMode: 'hybrid',
        meritWeight,
        eurosPerPoint: 10000,
        budgetMode,
      })
    );
  });
  payoutPatches.push({ payoutMode: 'equal', eurosPerPoint: 10000, budgetMode: 'neutral' });

  const categories: Array<Array<Partial<ScenarioConfig>>> = [
    ([18, 20, 22, 25] as const).map((rosterCap) => ({ rosterCap })),
    payoutPatches,
    (['none', 'winner', 'podium-light', 'podium-strong', 'bottom-support'] as const).map(
      (positionPreset) => ({
        positionPreset,
        positionBonuses: POSITION_PRESETS[positionPreset],
      })
    ),
    [
      { idealPlayerBonus: 0 as const, mvpBonus: 0 as const, stackMvpAndIdeal: true },
      { idealPlayerBonus: 50000 as const, mvpBonus: 60000 as const, stackMvpAndIdeal: true },
      { idealPlayerBonus: 50000 as const, mvpBonus: 60000 as const, stackMvpAndIdeal: false },
      { idealPlayerBonus: 100000 as const, mvpBonus: 150000 as const, stackMvpAndIdeal: true },
      { idealPlayerBonus: 100000 as const, mvpBonus: 150000 as const, stackMvpAndIdeal: false },
    ],
    ([10, 15, 20, 25, 30] as const).map((marketSlots) => ({ marketSlots })),
    ([null, 70000000, 80000000, 90000000, 100000000, 110000000] as const).map((squadValueCap) => ({
      squadValueCap,
    })),
  ];

  const recommendations: RecommendationProfile[] = [];
  const frontierPool: ScenarioResult[] = [simulateScenario(dataset, DEFAULT_SCENARIO)];
  PROFILE_DEFINITIONS.forEach((profile) => {
    const shortlisted = categories.map((category) => {
      const ranked = category
        .map((patch) => ({
          patch,
          result: simulateScenario(dataset, mergeConfig(DEFAULT_SCENARIO, patch)),
        }))
        .sort((left, right) => {
          const scoreDifference =
            weightedScore(right.result, profile.weights) -
            weightedScore(left.result, profile.weights);
          if (Math.abs(scoreDifference) > 0.001) return scoreDifference;
          return right.result.scores.practicality - left.result.scores.practicality;
        })
        .slice(0, 3);
      return [{}, ...ranked.map((entry) => entry.patch)];
    });
    let combined: ScenarioConfig[] = [DEFAULT_SCENARIO];
    shortlisted.forEach((category) => {
      const next: ScenarioConfig[] = [];
      combined.forEach((current) => {
        category.forEach((lever) => next.push(mergeConfig(current, lever)));
      });
      combined = Array.from(new Map(next.map((config) => [candidateKey(config), config])).values());
    });
    const ranked = rankCandidates(dataset, combined, profile.weights);
    const winner = simulateScenario(dataset, ranked[0].config, { bootstrap: true });
    const runnerUp = simulateScenario(dataset, ranked[1].config, { bootstrap: true });
    recommendations.push({ ...profile, winner, runnerUp });
    frontierPool.push(...ranked.slice(0, 40));
  });
  const uniquePool = Array.from(
    new Map(frontierPool.map((result) => [candidateKey(result.config), result])).values()
  );
  const pareto = uniquePool
    .filter((candidate) => !isParetoDominated(candidate, uniquePool))
    .sort(
      (left, right) =>
        right.scores.equality + right.scores.merit - left.scores.equality - left.scores.merit
    )
    .slice(0, 24);
  return { recommendations, pareto };
}

function buildTimeline(dataset: SeasonReviewDataset): TimelinePoint[] {
  const cumulativeByUser = new Map(dataset.users.map((user) => [user.id, 0]));
  let cumulativePayout = 0;
  let cumulativePoints = 0;
  return dataset.rounds.map((round) => {
    round.users.forEach((user) => {
      cumulativePayout += user.recordedBonus;
      cumulativePoints += user.points;
      cumulativeByUser.set(
        user.userId,
        (cumulativeByUser.get(user.userId) || 0) + user.recordedBonus
      );
    });
    const values = Array.from(cumulativeByUser.values()).sort((a, b) => a - b);
    const total = values.reduce((sum, value) => sum + value, 0);
    const weighted = values.reduce((sum, value, index) => sum + (index + 1) * value, 0);
    const payoutGini = total
      ? (2 * weighted) / (values.length * total) - (values.length + 1) / values.length
      : 0;
    return {
      roundId: round.id,
      roundName: round.name,
      cumulativePayout,
      cumulativePoints,
      payoutGini,
    };
  });
}

function breachDiagnostic(values: number[], cap: number, label: string): LeverDiagnostic {
  const breached = values.filter((value) => value > cap);
  return {
    value: cap,
    label,
    breachRate: values.length ? breached.length / values.length : 0,
    maxExcess: breached.length ? Math.max(...breached.map((value) => value - cap)) : 0,
    confidence: 'medium',
  };
}

function buildQuality(raw: SeasonReviewRawData, dataset: SeasonReviewDataset): DataQualityReport {
  const scoredRoundIds = new Set(dataset.rounds.map((round) => round.id));
  const financeRoundIds = new Set(raw.finances.map((row) => row.round_id));
  return {
    rawFinanceRows: raw.counts.rawFinanceRows,
    uniqueFinanceEvents: raw.counts.uniqueFinanceEvents,
    comparableRounds: dataset.rounds.length,
    financeOnlyRounds: Array.from(financeRoundIds).filter((roundId) => !scoredRoundIds.has(roundId))
      .length,
    users: dataset.users.length,
    transfers: raw.counts.transfers,
    initialSquadRows: raw.counts.initialSquadRows,
    marketValueRows: raw.counts.marketValueRows,
    marketSnapshotDays: raw.counts.marketSnapshotDays,
    warnings: [
      'Las primas se deduplican antes de calcular cualquier agregado.',
      'Las porras se estiman como residual y permanecen constantes entre escenarios.',
      'No existen snapshots de saldo ni salarios históricos: los recursos son una estimación.',
      'Los snapshots del mercado empiezan el 1 de marzo; sus escenarios tienen confianza baja.',
    ],
  };
}

async function buildOverview(): Promise<SeasonReviewOverview> {
  const [raw, dataset] = await Promise.all([getSeasonReviewRawData(), getCachedDataset()]);
  const baseline = simulateScenario(dataset, DEFAULT_SCENARIO, { bootstrap: true });
  const { recommendations, pareto } = generateRecommendations(dataset);
  const diagnostics = {
    rosterCaps: ([18, 20, 22, 25] as const).map((cap) =>
      breachDiagnostic(dataset.structural.rosterSizes, cap, `${cap} jugadores`)
    ),
    marketSlots: ([10, 15, 20, 25, 30] as const).map((slots) => ({
      value: slots,
      label: `${slots} jugadores diarios`,
      expectedWaitDays: Math.ceil(dataset.structural.totalPlayers / slots),
      confidence: 'low' as const,
    })),
    squadValueCaps: [null, 70000000, 80000000, 90000000, 100000000, 110000000].map((cap) =>
      cap == null
        ? ({
            value: 'none',
            label: 'Sin límite',
            breachRate: 0,
            maxExcess: 0,
            confidence: 'high',
          } as const)
        : breachDiagnostic(dataset.structural.squadValues, cap, `${cap / 1000000} M€`)
    ),
  };
  return {
    seasonId: REVIEW_SEASON_ID,
    baseline,
    recommendations,
    pareto,
    timeline: buildTimeline(dataset),
    quality: buildQuality(raw, dataset),
    diagnostics,
    defaults: DEFAULT_SCENARIO,
    generatedAt: new Date().toISOString(),
  };
}

export const getSeasonReviewOverview = () =>
  cached('season-review:overview:2025-26:v1', CACHE_TTL.VERY_LONG, buildOverview);

export async function simulateSeasonReview(input: unknown) {
  const config = scenarioConfigSchema.parse(input);
  const dataset = await getCachedDataset();
  return simulateScenario(dataset, config, { bootstrap: true });
}
