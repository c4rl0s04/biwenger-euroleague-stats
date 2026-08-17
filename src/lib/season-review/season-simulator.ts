import { calculateRoundPayouts, gini } from './resilience';
import type {
  MonteCarloOptions,
  SeasonMonteCarloResult,
  SeasonSimulationDataset,
  SeasonSimulationOutcome,
  SeasonSimulationPlayer,
  SeasonSimulationRequest,
  SimulatedSeasonPoint,
  SimulatedTransaction,
  SimulatedUserSnapshot,
} from './simulation-types';

interface AgentProfile {
  id: string;
  marketActivity: number;
  bidAggression: number;
  pointsFocus: number;
  valueFocus: number;
  decisionNoise: number;
  lineupAccuracy: number;
}

interface SimulatedUserState {
  id: string;
  profile: AgentProfile;
  cash: number;
  roster: Set<string>;
  points: number;
  bonuses: number;
  lastLineup: string[];
  roundScores: number[];
}

interface SimulatedPlayerState {
  definition: SeasonSimulationPlayer;
  price: number;
  ownerId: string | null;
  trajectoryOffset: number;
}

const AGENT_PROFILES: AgentProfile[] = [
  {
    id: 'balanced',
    marketActivity: 0.72,
    bidAggression: 0.52,
    pointsFocus: 0.62,
    valueFocus: 0.58,
    decisionNoise: 0.16,
    lineupAccuracy: 0.86,
  },
  {
    id: 'value-hunter',
    marketActivity: 0.85,
    bidAggression: 0.46,
    pointsFocus: 0.4,
    valueFocus: 0.9,
    decisionNoise: 0.13,
    lineupAccuracy: 0.82,
  },
  {
    id: 'points-first',
    marketActivity: 0.7,
    bidAggression: 0.7,
    pointsFocus: 0.92,
    valueFocus: 0.32,
    decisionNoise: 0.14,
    lineupAccuracy: 0.92,
  },
  {
    id: 'aggressive',
    marketActivity: 0.94,
    bidAggression: 0.9,
    pointsFocus: 0.7,
    valueFocus: 0.55,
    decisionNoise: 0.3,
    lineupAccuracy: 0.82,
  },
  {
    id: 'conservative',
    marketActivity: 0.5,
    bidAggression: 0.28,
    pointsFocus: 0.62,
    valueFocus: 0.66,
    decisionNoise: 0.1,
    lineupAccuracy: 0.88,
  },
  {
    id: 'volatile',
    marketActivity: 0.82,
    bidAggression: 0.76,
    pointsFocus: 0.58,
    valueFocus: 0.52,
    decisionNoise: 0.42,
    lineupAccuracy: 0.72,
  },
  {
    id: 'patient',
    marketActivity: 0.58,
    bidAggression: 0.38,
    pointsFocus: 0.76,
    valueFocus: 0.74,
    decisionNoise: 0.12,
    lineupAccuracy: 0.9,
  },
];

const severity = { low: 0.65, medium: 1, high: 1.45 } as const;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const average = (values: number[]) =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

function percentile(values: number[], fraction: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * fraction))];
}

function median(values: number[]) {
  return percentile(values, 0.5);
}

function wilsonInterval(successes: number, total: number): [number, number] {
  if (!total) return [0, 1];
  const probability = successes / total;
  const z = 1.96;
  const denominator = 1 + (z * z) / total;
  const center = (probability + (z * z) / (2 * total)) / denominator;
  const margin =
    (z / denominator) *
    Math.sqrt((probability * (1 - probability)) / total + (z * z) / (4 * total * total));
  return [Math.max(0, center - margin), Math.min(1, center + margin)];
}

function deterministicUnit(seed: number, ...parts: Array<string | number>) {
  let hash = (seed ^ 0x811c9dc5) >>> 0;
  const input = parts.join('|');
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  hash += 0x6d2b79f5;
  hash = Math.imul(hash ^ (hash >>> 15), hash | 1);
  hash ^= hash + Math.imul(hash ^ (hash >>> 7), hash | 61);
  return ((hash ^ (hash >>> 14)) >>> 0) / 4294967296;
}

function sourceRound(player: SimulatedPlayerState, roundIndex: number, totalRounds: number) {
  return (roundIndex + player.trajectoryOffset) % Math.max(1, totalRounds);
}

function projectedPoints(player: SimulatedPlayerState, roundIndex: number, totalRounds: number) {
  const values = Array.from({ length: Math.min(3, totalRounds) }, (_, offset) => {
    const index = sourceRound(player, roundIndex + offset, totalRounds);
    return player.definition.roundPoints[index] || 0;
  });
  return average(values);
}

function playerUtility(
  player: SimulatedPlayerState,
  profile: AgentProfile,
  roundIndex: number,
  totalRounds: number,
  noise: number
) {
  const points = projectedPoints(player, roundIndex, totalRounds);
  const priceChange =
    player.definition.priceChanges[sourceRound(player, roundIndex, totalRounds)] || 0;
  const priceMillions = Math.max(0.15, player.price / 1_000_000);
  return (
    (points / priceMillions) * profile.pointsFocus +
    priceChange * 40 * profile.valueFocus +
    noise * profile.decisionNoise * 8
  );
}

function snapshot(
  dataset: SeasonSimulationDataset,
  round: number,
  roundIndex: number,
  users: SimulatedUserState[],
  players: Map<string, SimulatedPlayerState>
): SimulatedSeasonPoint {
  const rows: SimulatedUserSnapshot[] = users.map((user) => {
    const roster = Array.from(user.roster)
      .map((id) => players.get(id))
      .filter((player): player is SimulatedPlayerState => Boolean(player));
    const squadValue = roster.reduce((sum, player) => sum + player.price, 0);
    const potential = roster
      .map((player) => projectedPoints(player, roundIndex, dataset.rounds.length))
      .sort((left, right) => right - left)
      .slice(0, dataset.lineupSize)
      .reduce((sum, value) => sum + value, 0);
    return {
      userId: user.id,
      profileId: user.profile.id,
      cash: user.cash,
      squadValue,
      totalResources: user.cash + squadValue,
      squadPotential: potential,
      competitiveStrength: user.roundScores.length
        ? average(user.roundScores.slice(-3))
        : potential,
      rosterSize: user.roster.size,
      points: user.points,
      bonuses: user.bonuses,
    };
  });
  const leaderPoints = Math.max(0, ...rows.map((row) => row.points));
  return {
    round,
    users: rows,
    resourceGini: gini(rows.map((row) => row.totalResources)),
    squadGini: gini(rows.map((row) => row.squadValue)),
    titleContenders:
      leaderPoints === 0
        ? rows.length
        : rows.filter((row) => row.points >= leaderPoints * 0.9).length,
  };
}

function worstRosterPlayer(
  user: SimulatedUserState,
  players: Map<string, SimulatedPlayerState>,
  roundIndex: number,
  totalRounds: number,
  seed: number
) {
  let worst: SimulatedPlayerState | undefined;
  let worstUtility = Infinity;
  user.roster.forEach((id) => {
    const player = players.get(id);
    if (!player) return;
    const utility = playerUtility(
      player,
      user.profile,
      roundIndex,
      totalRounds,
      deterministicUnit(seed, 'sell', roundIndex, user.id, player.definition.id) - 0.5
    );
    if (utility < worstUtility) {
      worst = player;
      worstUtility = utility;
    }
  });
  return worst;
}

function shockDuration(kind: string, multiplier: number) {
  const base = kind === 'bad-streak' ? 4 : kind === 'inactivity' ? 5 : 6;
  return Math.max(1, Math.round(base * multiplier));
}

function isShockActive(roundNumber: number, appliedRound: number, duration: number): boolean {
  return roundNumber >= appliedRound && roundNumber < appliedRound + duration;
}

export function simulateSeason(request: SeasonSimulationRequest): SeasonSimulationOutcome {
  const { dataset, config, shock, seed } = request;
  if (dataset.userCount < 2) throw new Error('A season simulation needs at least two users');
  if (!dataset.rounds.length || !dataset.players.length)
    throw new Error('A season simulation needs rounds and players');

  const profiles = Array.from(
    { length: dataset.userCount },
    (_, index) => AGENT_PROFILES[index % AGENT_PROFILES.length]
  ).sort(
    (left, right) =>
      deterministicUnit(seed, 'profile', left.id) - deterministicUnit(seed, 'profile', right.id)
  );
  const users: SimulatedUserState[] = Array.from({ length: dataset.userCount }, (_, index) => ({
    id: `user-${index + 1}`,
    profile: profiles[index],
    cash: dataset.startingBudget,
    roster: new Set<string>(),
    points: 0,
    bonuses: 0,
    lastLineup: [],
    roundScores: [],
  }));
  const players = new Map<string, SimulatedPlayerState>(
    dataset.players.map((definition) => [
      definition.id,
      {
        definition,
        price: Math.max(100_000, definition.initialPrice),
        ownerId: null,
        trajectoryOffset: Math.floor(
          deterministicUnit(seed, 'trajectory', definition.id) * dataset.rounds.length
        ),
      },
    ])
  );

  const eligibleOpeningPlayers = Array.from(players.values()).filter(
    (player) => player.definition.initiallyEligible !== false
  );
  const openingPool = (
    eligibleOpeningPlayers.length ? eligibleOpeningPlayers : Array.from(players.values())
  )
    .sort(
      (left, right) =>
        deterministicUnit(seed, 'opening', left.definition.id) -
        deterministicUnit(seed, 'opening', right.definition.id)
    )
    .slice(0, Math.min(players.size, dataset.userCount * dataset.initialRosterSize));
  openingPool
    .sort((left, right) => right.price - left.price)
    .forEach((player, index) => {
      const eligible = users.filter((user) => user.roster.size < dataset.initialRosterSize);
      const user = eligible.sort((left, right) => {
        const leftValue = Array.from(left.roster).reduce(
          (sum, id) => sum + (players.get(id)?.price || 0),
          0
        );
        const rightValue = Array.from(right.roster).reduce(
          (sum, id) => sum + (players.get(id)?.price || 0),
          0
        );
        return leftValue - rightValue || ((index + Number(left.id.slice(5))) % users.length) - 1;
      })[0];
      if (!user) return;
      user.roster.add(player.definition.id);
      player.ownerId = user.id;
    });
  users.forEach((user) => {
    const squadValue = Array.from(user.roster).reduce(
      (sum, id) => sum + (players.get(id)?.price || 0),
      0
    );
    user.cash = dataset.startingBudget - squadValue;
    while (user.roster.size > config.rosterCap) {
      const released = worstRosterPlayer(user, players, 0, dataset.rounds.length, seed);
      if (!released) break;
      user.roster.delete(released.definition.id);
      released.ownerId = null;
      user.cash += released.price;
    }
  });

  const targetUser =
    users[Math.floor(deterministicUnit(seed, 'shock-target') * users.length) % users.length];
  const multiplier = severity[shock.severity];
  const duration = shockDuration(shock.kind, multiplier);
  const timeline = [snapshot(dataset, 0, 0, users, players)];
  const transactions: SimulatedTransaction[] = [];
  const marketOrder = Array.from(players.keys()).sort(
    (left, right) =>
      deterministicUnit(seed, 'market-order', left) - deterministicUnit(seed, 'market-order', right)
  );
  let badTransferApplied = false;

  dataset.rounds.forEach((_roundId, roundIndex) => {
    const roundNumber = roundIndex + 1;
    for (let marketDay = 0; marketDay < dataset.marketDaysPerRound; marketDay += 1) {
      const candidates: SimulatedPlayerState[] = [];
      const startIndex = Math.floor(
        deterministicUnit(seed, 'market-start', roundNumber, marketDay) * marketOrder.length
      );
      for (
        let offset = 0;
        offset < marketOrder.length && candidates.length < config.marketSlots;
        offset += 1
      ) {
        const player = players.get(marketOrder[(startIndex + offset) % marketOrder.length]);
        if (player && player.ownerId == null) candidates.push(player);
      }

      candidates.forEach((candidate) => {
        const bids: Array<{
          user: SimulatedUserState;
          amount: number;
          replacement: SimulatedPlayerState | undefined;
        }> = [];
        users.forEach((user) => {
          const inactive =
            user.id === targetUser.id &&
            shock.kind === 'inactivity' &&
            isShockActive(roundNumber, shock.appliedRound, duration);
          if (inactive) return;
          const forcedBadTransfer =
            !badTransferApplied &&
            user.id === targetUser.id &&
            shock.kind === 'bad-transfer' &&
            roundNumber === shock.appliedRound &&
            marketDay === 0;
          const entryChance = clamp(
            0.004 +
              user.profile.marketActivity * 0.02 +
              Math.max(
                0,
                Math.min(
                  0.008,
                  projectedPoints(candidate, roundIndex, dataset.rounds.length) / 3_500
                )
              ),
            0.005,
            0.075
          );
          if (
            !forcedBadTransfer &&
            deterministicUnit(
              seed,
              'participate',
              roundNumber,
              marketDay,
              user.id,
              candidate.definition.id
            ) > entryChance
          )
            return;
          const replacement =
            user.roster.size >= config.rosterCap
              ? worstRosterPlayer(user, players, roundIndex, dataset.rounds.length, seed)
              : undefined;
          const candidateNoise =
            deterministicUnit(
              seed,
              'evaluation',
              roundNumber,
              marketDay,
              user.id,
              candidate.definition.id
            ) - 0.5;
          const utility = playerUtility(
            candidate,
            user.profile,
            roundIndex,
            dataset.rounds.length,
            candidateNoise
          );
          const replacementUtility = replacement
            ? playerUtility(
                replacement,
                user.profile,
                roundIndex,
                dataset.rounds.length,
                deterministicUnit(seed, 'replacement', roundNumber, user.id) - 0.5
              )
            : -Infinity;
          if (!forcedBadTransfer && replacement && utility <= replacementUtility) return;
          let multiplierBid =
            0.97 +
            user.profile.bidAggression * 0.19 +
            Math.max(-0.08, Math.min(0.16, utility / 120));
          if (forcedBadTransfer) multiplierBid = 1.35 + 0.3 * multiplier;
          const amount = forcedBadTransfer
            ? Math.round(candidate.price + 8_000_000 * multiplier)
            : Math.round(candidate.price * multiplierBid);
          const available = user.cash + (replacement ? Math.round(replacement.price * 0.97) : 0);
          if (amount <= available) bids.push({ user, amount, replacement });
        });
        const winner = bids.sort(
          (left, right) => right.amount - left.amount || left.user.id.localeCompare(right.user.id)
        )[0];
        if (!winner) return;
        if (winner.replacement) {
          winner.user.roster.delete(winner.replacement.definition.id);
          winner.replacement.ownerId = null;
          const saleAmount = Math.round(winner.replacement.price * 0.97);
          winner.user.cash += saleAmount;
          transactions.push({
            round: roundNumber,
            marketDay,
            type: 'sell',
            userId: winner.user.id,
            playerId: winner.replacement.definition.id,
            amount: saleAmount,
            marketValue: winner.replacement.price,
          });
        }
        winner.user.cash -= winner.amount;
        winner.user.roster.add(candidate.definition.id);
        candidate.ownerId = winner.user.id;
        transactions.push({
          round: roundNumber,
          marketDay,
          type: 'buy',
          userId: winner.user.id,
          playerId: candidate.definition.id,
          amount: winner.amount,
          marketValue: candidate.price,
        });
        if (
          winner.user.id === targetUser.id &&
          shock.kind === 'bad-transfer' &&
          roundNumber === shock.appliedRound
        )
          badTransferApplied = true;
      });
    }

    let injuredPlayerId: string | null = null;
    if (shock.kind === 'star-injury' && isShockActive(roundNumber, shock.appliedRound, duration)) {
      injuredPlayerId = Array.from(targetUser.roster)
        .map((id) => players.get(id))
        .filter((player): player is SimulatedPlayerState => Boolean(player))
        .sort(
          (left, right) =>
            projectedPoints(right, roundIndex, dataset.rounds.length) -
            projectedPoints(left, roundIndex, dataset.rounds.length)
        )[0]?.definition.id;
      if (roundNumber === shock.appliedRound && injuredPlayerId) {
        const injured = players.get(injuredPlayerId);
        if (injured) injured.price = Math.round(injured.price * (1 - 0.12 * multiplier));
      }
    }

    const roundScores = users.map((user) => {
      const inactive =
        user.id === targetUser.id &&
        shock.kind === 'inactivity' &&
        isShockActive(roundNumber, shock.appliedRound, duration);
      const roster = Array.from(user.roster)
        .map((id) => players.get(id))
        .filter((player): player is SimulatedPlayerState => Boolean(player));
      const ranked = roster
        .filter((player) => player.definition.id !== injuredPlayerId)
        .map((player) => ({
          player,
          perceived:
            projectedPoints(player, roundIndex, dataset.rounds.length) *
              user.profile.lineupAccuracy +
            (deterministicUnit(seed, 'lineup', roundNumber, user.id, player.definition.id) - 0.5) *
              18 *
              (1 - user.profile.lineupAccuracy),
        }))
        .sort((left, right) => right.perceived - left.perceived);
      const lineup =
        inactive && user.lastLineup.length
          ? user.lastLineup
              .map((id) => players.get(id))
              .filter((player): player is SimulatedPlayerState => Boolean(player))
          : ranked.slice(0, dataset.lineupSize).map(({ player }) => player);
      user.lastLineup = lineup.map((player) => player.definition.id);
      let points = lineup.reduce((sum, player) => {
        const index = sourceRound(player, roundIndex, dataset.rounds.length);
        return sum + (player.definition.roundPoints[index] || 0);
      }, 0);
      if (
        user.id === targetUser.id &&
        shock.kind === 'bad-streak' &&
        isShockActive(roundNumber, shock.appliedRound, duration)
      )
        points *= clamp(1 - 0.38 * multiplier, 0.3, 0.8);
      if (
        user.id === targetUser.id &&
        shock.kind === 'inactivity' &&
        isShockActive(roundNumber, shock.appliedRound, duration)
      )
        points *= clamp(1 - 0.28 * multiplier, 0.45, 0.85);
      points = Math.max(0, Math.round(points));
      user.points += points;
      user.roundScores.push(points);
      return { userId: user.id, points };
    });

    const payouts = calculateRoundPayouts(
      roundScores,
      config.payoutDirection,
      config.eurosPerPoint
    );
    users.forEach((user) => {
      const payout = payouts.get(user.id) || 0;
      user.cash += payout;
      user.bonuses += payout;
    });

    players.forEach((player) => {
      const index = sourceRound(player, roundIndex, dataset.rounds.length);
      const observedChange = player.definition.priceChanges[index] || 0;
      const commonNoise =
        (deterministicUnit(seed, 'price', roundNumber, player.definition.id) - 0.5) * 0.025;
      player.price = Math.round(
        clamp(
          player.price * (1 + clamp(observedChange + commonNoise, -0.3, 0.3)),
          100_000,
          40_000_000
        )
      );
    });
    timeline.push(snapshot(dataset, roundNumber, roundIndex, users, players));
  });

  const preShockPoint =
    timeline.find((point) => point.round === Math.max(0, shock.appliedRound - 1)) || timeline[0];
  const preShockTarget = preShockPoint.users.find((user) => user.userId === targetUser.id);
  const preShockMedianResources = median(preShockPoint.users.map((user) => user.totalResources));
  const preShockMedianCompetitive = median(
    preShockPoint.users.map((user) => user.competitiveStrength)
  );
  const requiredEconomicRatio = Math.max(
    0.9,
    ((preShockTarget?.totalResources || preShockMedianResources) /
      Math.max(1, preShockMedianResources)) *
      0.9
  );
  const requiredCompetitiveRatio = Math.max(
    0.9,
    ((preShockTarget?.competitiveStrength || preShockMedianCompetitive) /
      Math.max(1, preShockMedianCompetitive)) *
      0.9
  );
  const afterShock = timeline.filter((point) => point.round > shock.appliedRound);
  let economicRecovered = false;
  let competitiveRecovered = false;
  let recoveredAtRound: number | null = null;
  afterShock.forEach((point) => {
    const target = point.users.find((user) => user.userId === targetUser.id);
    if (!target) return;
    const medianResources = median(point.users.map((user) => user.totalResources));
    const medianPotential = median(point.users.map((user) => user.competitiveStrength));
    const economic = target.totalResources >= medianResources * requiredEconomicRatio;
    const competitive = target.competitiveStrength >= medianPotential * requiredCompetitiveRatio;
    economicRecovered ||= economic;
    competitiveRecovered ||= competitive;
    if (economic && competitive && recoveredAtRound == null) recoveredAtRound = point.round;
  });
  const closing = timeline.at(-1)?.users || [];
  const targetClosing = closing.find((user) => user.userId === targetUser.id);
  const closingMedianResources = median(closing.map((user) => user.totalResources));
  const closingMedianPotential = median(closing.map((user) => user.competitiveStrength));

  return {
    seed,
    config,
    shock,
    timeline,
    transactions,
    recovery: {
      targetUserId: targetUser.id,
      economicRecovered,
      competitiveRecovered,
      recoveredAtRound,
      remainingEconomicGap: Math.max(
        0,
        closingMedianResources * requiredEconomicRatio - (targetClosing?.totalResources || 0)
      ),
      remainingCompetitiveGap: Math.max(
        0,
        closingMedianPotential * requiredCompetitiveRatio -
          (targetClosing?.competitiveStrength || 0)
      ),
    },
  };
}

export function runSeasonMonteCarlo(
  dataset: SeasonSimulationDataset,
  config: SeasonSimulationRequest['config'],
  shock: SeasonSimulationRequest['shock'],
  options: MonteCarloOptions
): SeasonMonteCarloResult {
  const runs = Math.max(1, Math.floor(options.runs));
  const baseSeed = options.baseSeed ?? 202526;
  const outcomes = Array.from({ length: runs }, (_, index) =>
    simulateSeason({ dataset, config, shock, seed: baseSeed + index * 7919 })
  );
  const dual = outcomes.filter((outcome) => outcome.recovery.recoveredAtRound != null);
  const economic = outcomes.filter((outcome) => outcome.recovery.economicRecovered);
  const competitive = outcomes.filter((outcome) => outcome.recovery.competitiveRecovered);
  const recoveryRounds = dual.map(
    (outcome) => (outcome.recovery.recoveredAtRound || shock.appliedRound) - shock.appliedRound
  );
  const finalPoints = outcomes.map((outcome) => outcome.timeline.at(-1));
  const midpointIndex = Math.floor(dataset.rounds.length / 2);
  return {
    modelVersion: 'agent-season-v3',
    simulationCount: runs,
    recoveryProbability: dual.length / runs,
    recoveryInterval95: wilsonInterval(dual.length, runs),
    economicRecoveryProbability: economic.length / runs,
    competitiveRecoveryProbability: competitive.length / runs,
    lockInProbability: 1 - dual.length / runs,
    medianRecoveryRounds: recoveryRounds.length
      ? percentile(recoveryRounds, 0.5)
      : Math.max(0, dataset.rounds.length - shock.appliedRound + 1),
    p90RecoveryRounds: recoveryRounds.length
      ? percentile(recoveryRounds, 0.9)
      : Math.max(0, dataset.rounds.length - shock.appliedRound + 1),
    medianRemainingEconomicGap: median(
      outcomes.map((outcome) => outcome.recovery.remainingEconomicGap)
    ),
    medianRemainingCompetitiveGap: median(
      outcomes.map((outcome) => outcome.recovery.remainingCompetitiveGap)
    ),
    medianFinalResourceGini: median(finalPoints.map((point) => point?.resourceGini || 0)),
    medianFinalSquadGini: median(finalPoints.map((point) => point?.squadGini || 0)),
    medianMidseasonContenders: median(
      outcomes.map((outcome) => outcome.timeline[midpointIndex]?.titleContenders || 0)
    ),
    medianTransactions: median(outcomes.map((outcome) => outcome.transactions.length)),
    medianPurchases: median(
      outcomes.map(
        (outcome) => outcome.transactions.filter((transaction) => transaction.type === 'buy').length
      )
    ),
    medianFinalResourceGap: median(
      finalPoints.map((point) => {
        const resources = point?.users.map((user) => user.totalResources) || [];
        return resources.length ? Math.max(...resources) - Math.min(...resources) : 0;
      })
    ),
    confidence: runs >= 2_000 ? 'high' : runs >= 250 ? 'medium' : 'low',
  };
}

export function runConfigurationExperiment(
  dataset: SeasonSimulationDataset,
  configurations: SeasonSimulationRequest['config'][],
  shock: SeasonSimulationRequest['shock'],
  options: MonteCarloOptions
) {
  const runs = Math.max(1, Math.floor(options.runs));
  const baseSeed = options.baseSeed ?? 202526;
  return {
    modelVersion: 'agent-season-v3' as const,
    runs,
    baseSeed,
    shock,
    configurations: configurations.map((config) => ({
      config,
      result: runSeasonMonteCarlo(dataset, config, shock, { runs, baseSeed }),
    })),
  };
}
