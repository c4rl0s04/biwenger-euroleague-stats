import { z } from 'zod';
import type {
  EconomicLedger,
  EconomicLedgerInput,
  EconomicSnapshot,
  PayoutDirection,
  RecoveryEnvironment,
  RecoveryResult,
  RosterCapDiagnostic,
  ResilienceConfig,
  ShockConfig,
  ShockSeverity,
} from './types';

export const resilienceRequestSchema = z.object({
  config: z.object({
    rosterCap: z.number().int().min(10).max(25),
    payoutDirection: z.enum(['direct', 'inverse']),
    eurosPerPoint: z.number().int().min(0).max(20_000),
    marketSlots: z.number().int().min(1).max(20),
  }),
  shock: z.object({
    kind: z.enum(['bad-transfer', 'bad-streak', 'star-injury', 'inactivity']),
    severity: z.enum(['low', 'medium', 'high']),
    appliedRound: z.number().int().min(1).max(40),
  }),
});

interface OwnedPlayer {
  acquisitionPrice: number;
  source: 'initial' | 'market';
}

interface LedgerUserState {
  cash: number;
  roster: Map<number, OwnedPlayer>;
  cumulativeBonuses: number;
  cumulativePoints: number;
  realizedInitialPnl: number;
  realizedMarketPnl: number;
}

const severityMultiplier: Record<ShockSeverity, number> = {
  low: 0.6,
  medium: 1,
  high: 1.5,
};

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export function gini(values: number[]) {
  if (!values.length) return 0;
  const min = Math.min(...values);
  const normalized = min < 0 ? values.map((value) => value - min) : values;
  const sorted = [...normalized].sort((left, right) => left - right);
  const total = sorted.reduce((sum, value) => sum + value, 0);
  if (!total) return 0;
  const weighted = sorted.reduce((sum, value, index) => sum + (index + 1) * value, 0);
  return (2 * weighted) / (sorted.length * total) - (sorted.length + 1) / sorted.length;
}

function percentile(values: number[], fraction: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * fraction))];
}

function mulberry32(seed: number) {
  return () => {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildEconomicLedger(input: EconomicLedgerInput): EconomicLedger {
  const usersById = new Map(input.users.map((user) => [user.id, user]));
  const state = new Map<string, LedgerUserState>(
    input.users.map((user) => [
      user.id,
      {
        cash: input.startingBudget,
        roster: new Map<number, OwnedPlayer>(),
        cumulativeBonuses: 0,
        cumulativePoints: 0,
        realizedInitialPnl: 0,
        realizedMarketPnl: 0,
      },
    ])
  );
  const prices = new Map<number, number>();
  const marketValues = [...input.marketValues].sort(
    (left, right) => left.day.localeCompare(right.day) || left.playerId - right.playerId
  );
  const openingDay = Array.from(new Set(input.days)).sort()[0];
  const openingPrices = new Map<number, number>();

  if (openingDay) {
    marketValues.forEach((row) => {
      if (row.day <= openingDay) openingPrices.set(row.playerId, row.price);
    });
  }

  input.initialSquads.forEach((row) => {
    const user = state.get(row.userId);
    if (!user) return;
    const openingPrice = openingPrices.get(row.playerId) ?? row.price;
    user.cash -= openingPrice;
    user.roster.set(row.playerId, { acquisitionPrice: openingPrice, source: 'initial' });
    prices.set(row.playerId, openingPrice);
  });

  const transfers = [...input.transfers].sort(
    (left, right) => left.day.localeCompare(right.day) || left.timestamp - right.timestamp
  );
  const bonuses = [...input.bonuses].sort((left, right) => left.day.localeCompare(right.day));
  const roundPoints = [...input.roundPoints].sort((left, right) =>
    left.day.localeCompare(right.day)
  );
  let marketValueIndex = 0;
  let transferIndex = 0;
  let bonusIndex = 0;
  let pointsIndex = 0;
  const snapshots: EconomicSnapshot[] = [];

  Array.from(new Set(input.days))
    .sort()
    .forEach((day) => {
      while (marketValueIndex < marketValues.length && marketValues[marketValueIndex].day <= day) {
        const row = marketValues[marketValueIndex];
        prices.set(row.playerId, row.price);
        marketValueIndex += 1;
      }
      while (transferIndex < transfers.length && transfers[transferIndex].day <= day) {
        const transfer = transfers[transferIndex];
        if (transfer.sellerId) {
          const seller = state.get(transfer.sellerId);
          if (seller) {
            const holding = seller.roster.get(transfer.playerId);
            if (holding) {
              const realizedPnl = transfer.price - holding.acquisitionPrice;
              if (holding.source === 'initial') seller.realizedInitialPnl += realizedPnl;
              else seller.realizedMarketPnl += realizedPnl;
            }
            seller.cash += transfer.price;
            seller.roster.delete(transfer.playerId);
          }
        }
        if (transfer.buyerId) {
          const buyer = state.get(transfer.buyerId);
          if (buyer) {
            buyer.cash -= transfer.price;
            buyer.roster.set(transfer.playerId, {
              acquisitionPrice: transfer.price,
              source: 'market',
            });
          }
        }
        transferIndex += 1;
      }
      while (bonusIndex < bonuses.length && bonuses[bonusIndex].day <= day) {
        const bonus = bonuses[bonusIndex];
        const user = state.get(bonus.userId);
        if (user) {
          user.cash += bonus.amount;
          user.cumulativeBonuses += bonus.amount;
        }
        bonusIndex += 1;
      }
      while (pointsIndex < roundPoints.length && roundPoints[pointsIndex].day <= day) {
        const row = roundPoints[pointsIndex];
        const user = state.get(row.userId);
        if (user) user.cumulativePoints += row.points;
        pointsIndex += 1;
      }

      state.forEach((user, userId) => {
        const players = Array.from(user.roster.entries()).map(([playerId, holding]) => ({
          playerId,
          value: prices.get(playerId) ?? holding.acquisitionPrice,
          acquisitionPrice: holding.acquisitionPrice,
          source: holding.source,
        }));
        const squadValue = players.reduce((sum, player) => sum + player.value, 0);
        const unrealized = players.reduce(
          (result, player) => {
            result[player.source] += player.value - player.acquisitionPrice;
            return result;
          },
          { initial: 0, market: 0 }
        );
        snapshots.push({
          day,
          userId,
          userName: usersById.get(userId)?.name || userId,
          cash: user.cash,
          squadValue,
          totalResources: user.cash + squadValue,
          rosterSize: players.length,
          cumulativeBonuses: user.cumulativeBonuses,
          cumulativePoints: user.cumulativePoints,
          initialAssetPnl: user.realizedInitialPnl + unrealized.initial,
          marketAssetPnl: user.realizedMarketPnl + unrealized.market,
          players,
        });
      });
    });

  return { snapshots };
}

export function analyzeRosterCaps(ledger: EconomicLedger, caps: number[]): RosterCapDiagnostic[] {
  return caps.map((cap) => {
    const breached = ledger.snapshots.filter((snapshot) => snapshot.rosterSize > cap);
    const minimumReleaseValues: number[] = [];
    const maximumReleaseValues: number[] = [];
    let maxExcess = 0;

    breached.forEach((snapshot) => {
      const excess = snapshot.rosterSize - cap;
      maxExcess = Math.max(maxExcess, excess);
      const values = snapshot.players.map((player) => player.value).sort((a, b) => a - b);
      minimumReleaseValues.push(values.slice(0, excess).reduce((sum, value) => sum + value, 0));
      maximumReleaseValues.push(values.slice(-excess).reduce((sum, value) => sum + value, 0));
    });

    const average = (values: number[]) =>
      values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
    return {
      cap,
      breachRate: ledger.snapshots.length ? breached.length / ledger.snapshots.length : 0,
      affectedUsers: new Set(breached.map((snapshot) => snapshot.userId)).size,
      breachedUserDays: breached.length,
      maxExcess,
      averageMinimumReleaseValue: average(minimumReleaseValues),
      averageMaximumReleaseValue: average(maximumReleaseValues),
    };
  });
}

export function calculateRoundPayouts(
  entries: Array<{ userId: string; points: number }>,
  direction: PayoutDirection,
  eurosPerPoint: number
) {
  const ranked = [...entries].sort(
    (left, right) => right.points - left.points || left.userId.localeCompare(right.userId)
  );
  const reversedPoints = ranked.map((entry) => entry.points).reverse();
  const payouts = new Map<string, number>();

  ranked.forEach((entry) => {
    const tiedIndexes = ranked
      .map((candidate, index) => ({ candidate, index }))
      .filter(({ candidate }) => candidate.points === entry.points)
      .map(({ index }) => index);
    const payoutPoints =
      direction === 'direct'
        ? entry.points
        : tiedIndexes.reduce((sum, index) => sum + reversedPoints[index], 0) / tiedIndexes.length;
    payouts.set(entry.userId, Math.max(0, Math.round(payoutPoints * eurosPerPoint)));
  });

  return payouts;
}

function shockLoss(shock: ShockConfig) {
  const multiplier = severityMultiplier[shock.severity];
  const base = {
    'bad-transfer': { economic: 8_000_000, competitive: 3_000_000, duration: 12 },
    'bad-streak': { economic: 1_000_000, competitive: 4_000_000, duration: 5 },
    'star-injury': { economic: 4_000_000, competitive: 7_000_000, duration: 6 },
    inactivity: { economic: 3_000_000, competitive: 5_000_000, duration: 6 },
  }[shock.kind];
  return {
    economic: base.economic * multiplier,
    competitive: base.competitive * multiplier,
    duration: Math.max(1, Math.round(base.duration * multiplier)),
  };
}

export function simulateRecovery(
  environment: RecoveryEnvironment,
  config: ResilienceConfig,
  shock: ShockConfig,
  seed = 202526
): RecoveryResult {
  const random = mulberry32(seed);
  const loss = shockLoss(shock);
  const pathCount = 500;
  const recoveryRounds: number[] = [];
  const remainingEconomicGaps: number[] = [];
  const remainingCompetitiveGaps: number[] = [];
  let economicRecoveries = 0;
  let competitiveRecoveries = 0;

  for (let path = 0; path < pathCount; path += 1) {
    let economicGap = loss.economic;
    let competitiveGap = loss.competitive;
    let recoveredAt: number | null = null;
    const capLiquidity = environment.capLiquidityByLimit[config.rosterCap] || 0;
    const opportunityChance = clamp(
      0.1 + (config.marketSlots / 20) * 0.58 + ((25 - config.rosterCap) / 15) * 0.2,
      0.08,
      0.92
    );
    const inverseHelp =
      Math.max(0, environment.averageTopPoints - environment.averageMedianPoints) *
      config.eurosPerPoint;
    const directPenalty =
      Math.max(0, environment.averageMedianPoints - environment.averageBottomPoints) *
      config.eurosPerPoint;

    for (let round = 1; round <= environment.roundsRemaining; round += 1) {
      if (config.payoutDirection === 'inverse')
        economicGap = Math.max(0, economicGap - inverseHelp);
      else economicGap += directPenalty;

      if (random() < opportunityChance) {
        const samples = environment.observedReturnSamples;
        const sampledReturn = samples.length ? samples[Math.floor(random() * samples.length)] : 0;
        const releasedOpportunity =
          (capLiquidity / Math.max(1, environment.users)) * (0.75 + random() * 0.5);
        economicGap = Math.max(0, economicGap - sampledReturn);
        competitiveGap = Math.max(
          0,
          competitiveGap - Math.max(0, sampledReturn * 0.25 + releasedOpportunity * 0.35)
        );
      }

      if (round >= loss.duration && shock.kind !== 'bad-transfer') {
        competitiveGap = Math.max(0, competitiveGap - loss.competitive * 0.35);
      }
      if (economicGap <= 4_000_000 && competitiveGap <= 1_500_000 && recoveredAt == null) {
        recoveredAt = round;
      }
    }

    if (economicGap <= 4_000_000) economicRecoveries += 1;
    if (competitiveGap <= 1_500_000) competitiveRecoveries += 1;
    if (recoveredAt != null) recoveryRounds.push(recoveredAt);
    remainingEconomicGaps.push(economicGap);
    remainingCompetitiveGaps.push(competitiveGap);
  }

  const recoveryProbability = recoveryRounds.length / pathCount;
  return {
    config,
    shock,
    recoveryProbability,
    economicRecoveryProbability: economicRecoveries / pathCount,
    competitiveRecoveryProbability: competitiveRecoveries / pathCount,
    lockInProbability: 1 - recoveryProbability,
    medianRecoveryRounds: recoveryRounds.length
      ? percentile(recoveryRounds, 0.5)
      : environment.roundsRemaining + 1,
    p90RecoveryRounds: recoveryRounds.length
      ? percentile(recoveryRounds, 0.9)
      : environment.roundsRemaining + 1,
    medianRemainingEconomicGap: percentile(remainingEconomicGaps, 0.5),
    medianRemainingCompetitiveGap: percentile(remainingCompetitiveGaps, 0.5),
    confidence: environment.marketConfidence,
  };
}
