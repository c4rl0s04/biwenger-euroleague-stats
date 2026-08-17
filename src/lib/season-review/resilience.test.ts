import { describe, expect, it } from 'vitest';
import {
  analyzeRosterCaps,
  buildEconomicLedger,
  calculateRoundPayouts,
  gini,
  resilienceRequestSchema,
  simulateRecovery,
} from './resilience';
import type { EconomicLedgerInput, RecoveryEnvironment } from './types';

const ledgerInput: EconomicLedgerInput = {
  startingBudget: 40_000_000,
  users: [
    { id: 'a', name: 'A' },
    { id: 'b', name: 'B' },
  ],
  initialSquads: [
    { userId: 'a', playerId: 1, price: 10_000_000 },
    { userId: 'b', playerId: 2, price: 20_000_000 },
  ],
  days: ['2025-09-25', '2025-09-26'],
  marketValues: [
    { day: '2025-09-25', playerId: 1, price: 10_000_000 },
    { day: '2025-09-25', playerId: 2, price: 20_000_000 },
    { day: '2025-09-26', playerId: 1, price: 12_000_000 },
    { day: '2025-09-26', playerId: 2, price: 19_000_000 },
    { day: '2025-09-26', playerId: 3, price: 6_000_000 },
  ],
  transfers: [
    {
      day: '2025-09-26',
      timestamp: 1,
      playerId: 3,
      price: 5_000_000,
      sellerId: null,
      buyerId: 'a',
    },
  ],
  bonuses: [{ day: '2025-09-26', userId: 'b', amount: 1_000_000 }],
  roundPoints: [],
};

describe('season resilience ledger', () => {
  it('reports no relative inequality when every manager starts equally', () => {
    expect(gini([40_000_000, 40_000_000, 40_000_000])).toBeCloseTo(0);
  });

  it('starts every manager at exactly forty million euros', () => {
    const ledger = buildEconomicLedger(ledgerInput);
    const opening = ledger.snapshots.filter((snapshot) => snapshot.day === '2025-09-25');

    expect(opening).toHaveLength(2);
    expect(opening.map((snapshot) => snapshot.totalResources)).toEqual([40_000_000, 40_000_000]);
    expect(opening.map((snapshot) => snapshot.cash)).toEqual([30_000_000, 20_000_000]);
  });

  it('keeps cash plus squad value equal to resources after market activity and bonuses', () => {
    const ledger = buildEconomicLedger(ledgerInput);
    const closing = ledger.snapshots.filter((snapshot) => snapshot.day === '2025-09-26');

    expect(closing.find((snapshot) => snapshot.userId === 'a')).toMatchObject({
      cash: 25_000_000,
      squadValue: 18_000_000,
      totalResources: 43_000_000,
      rosterSize: 2,
    });
    expect(closing.find((snapshot) => snapshot.userId === 'b')).toMatchObject({
      cash: 21_000_000,
      squadValue: 19_000_000,
      totalResources: 40_000_000,
    });
    expect(
      closing.every((snapshot) => snapshot.cash + snapshot.squadValue === snapshot.totalResources)
    ).toBe(true);
    expect(closing.find((snapshot) => snapshot.userId === 'a')).toMatchObject({
      initialAssetPnl: 2_000_000,
      marketAssetPnl: 1_000_000,
    });
    expect(closing.find((snapshot) => snapshot.userId === 'b')).toMatchObject({
      initialAssetPnl: -1_000_000,
      marketAssetPnl: 0,
    });
  });

  it('measures the value released by every roster limit as a range', () => {
    const ledger = buildEconomicLedger(ledgerInput);
    const diagnostics = analyzeRosterCaps(ledger, [1, 2]);

    expect(diagnostics[0]).toMatchObject({
      cap: 1,
      breachRate: 0.25,
      affectedUsers: 1,
      maxExcess: 1,
      averageMinimumReleaseValue: 6_000_000,
      averageMaximumReleaseValue: 12_000_000,
    });
    expect(diagnostics[1]).toMatchObject({ cap: 2, breachRate: 0, affectedUsers: 0 });
  });
});

describe('valid Biwenger payout directions', () => {
  const points = [
    { userId: 'a', points: 200 },
    { userId: 'b', points: 150 },
    { userId: 'c', points: 100 },
  ];

  it('direct and inverse modes preserve the same total budget', () => {
    const direct = calculateRoundPayouts(points, 'direct', 10_000);
    const inverse = calculateRoundPayouts(points, 'inverse', 10_000);

    expect(Object.fromEntries(direct)).toEqual({ a: 2_000_000, b: 1_500_000, c: 1_000_000 });
    expect(Object.fromEntries(inverse)).toEqual({ a: 1_000_000, b: 1_500_000, c: 2_000_000 });
    expect(Array.from(direct.values()).reduce((sum, value) => sum + value, 0)).toBe(4_500_000);
    expect(Array.from(inverse.values()).reduce((sum, value) => sum + value, 0)).toBe(4_500_000);
  });

  it('rejects hybrid payouts and markets above twenty players', () => {
    const valid = {
      config: { rosterCap: 15, payoutDirection: 'inverse', eurosPerPoint: 10_000, marketSlots: 20 },
      shock: { kind: 'bad-transfer', severity: 'medium', appliedRound: 5 },
    } as const;
    expect(resilienceRequestSchema.parse(valid)).toEqual(valid);
    expect(() =>
      resilienceRequestSchema.parse({
        config: {
          rosterCap: 15,
          payoutDirection: 'hybrid',
          eurosPerPoint: 10_000,
          marketSlots: 20,
        },
        shock: { kind: 'bad-transfer', severity: 'medium', appliedRound: 5 },
      })
    ).toThrow();
    expect(() =>
      resilienceRequestSchema.parse({
        config: {
          rosterCap: 15,
          payoutDirection: 'inverse',
          eurosPerPoint: 10_000,
          marketSlots: 30,
        },
        shock: { kind: 'bad-transfer', severity: 'medium', appliedRound: 5 },
      })
    ).toThrow();
  });
});

describe('recovery stress tests', () => {
  const environment: RecoveryEnvironment = {
    roundsRemaining: 12,
    users: 7,
    averageTopPoints: 200,
    averageMedianPoints: 150,
    averageBottomPoints: 100,
    observedReturnSamples: [200_000, 500_000, 1_000_000],
    capLiquidityByLimit: Object.fromEntries(
      Array.from({ length: 16 }, (_, index) => [10 + index, (25 - (10 + index)) * 300_000])
    ),
    marketConfidence: 'medium',
  };

  it('makes the same bad signing more recoverable with inverse payouts and a liquid market', () => {
    const inverse = simulateRecovery(
      environment,
      { rosterCap: 15, payoutDirection: 'inverse', eurosPerPoint: 10_000, marketSlots: 20 },
      { kind: 'bad-transfer', severity: 'medium', appliedRound: 5 },
      202526
    );
    const direct = simulateRecovery(
      environment,
      { rosterCap: 25, payoutDirection: 'direct', eurosPerPoint: 10_000, marketSlots: 5 },
      { kind: 'bad-transfer', severity: 'medium', appliedRound: 5 },
      202526
    );

    expect(inverse.recoveryProbability).toBeGreaterThan(direct.recoveryProbability);
    expect(inverse.lockInProbability).toBeLessThan(direct.lockInProbability);
    expect(inverse.medianRecoveryRounds).toBeLessThan(direct.medianRecoveryRounds);
  });
});
