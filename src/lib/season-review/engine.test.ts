import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SCENARIO,
  gini,
  rankRound,
  simulateScenario,
  splitPositionBonuses,
} from './engine';
import type { ReviewRound, SeasonReviewDataset } from './types';

const round: ReviewRound = {
  id: 1,
  name: 'Jornada 1',
  users: [
    {
      userId: 'a',
      points: 200,
      participated: true,
      recordedBonus: 1000000,
      porraResidual: 0,
      idealHits: 2,
      mvpHits: 1,
    },
    {
      userId: 'b',
      points: 150,
      participated: true,
      recordedBonus: 1600000,
      porraResidual: 100000,
      idealHits: 1,
      mvpHits: 0,
    },
    {
      userId: 'c',
      points: 100,
      participated: true,
      recordedBonus: 2000000,
      porraResidual: 0,
      idealHits: 0,
      mvpHits: 0,
    },
  ],
};

const dataset: SeasonReviewDataset = {
  seasonId: '2025-26',
  users: [
    {
      id: 'a',
      name: 'A',
      color: '#f00',
      initialSquadValue: 10,
      finalSquadValue: 20_000_000,
      finalRosterSize: 20,
      marketNet: 0,
    },
    {
      id: 'b',
      name: 'B',
      color: '#0f0',
      initialSquadValue: 10,
      finalSquadValue: 20_000_000,
      finalRosterSize: 20,
      marketNet: 0,
    },
    {
      id: 'c',
      name: 'C',
      color: '#00f',
      initialSquadValue: 10,
      finalSquadValue: 20_000_000,
      finalRosterSize: 20,
      marketNet: 0,
    },
  ],
  rounds: [round],
  structural: {
    rosterSizes: [18, 20, 25],
    squadValues: [70_000_000, 90_000_000, 110_000_000],
    automaticMarketSlots: [20],
    totalPlayers: 360,
    marketDays: 1,
  },
  baselineRecordedPayout: 4_600_000,
  baselinePorraResidual: 100_000,
};

describe('season review engine', () => {
  it('calculates zero Gini for an equal distribution', () => {
    expect(gini([10, 10, 10])).toBeCloseTo(0);
  });

  it('assigns the lowest score to the winner in inverse mode', () => {
    const ranked = rankRound(round);
    expect(ranked.find((entry) => entry.userId === 'a')?.inversePoints).toBe(100);
    expect(ranked.find((entry) => entry.userId === 'c')?.inversePoints).toBe(200);
  });

  it('splits occupied position prizes across tied users', () => {
    const tiedRound: ReviewRound = {
      ...round,
      users: round.users.map((user, index) => ({ ...user, points: index < 2 ? 200 : 100 })),
    };
    const ranked = rankRound(tiedRound);
    const payouts = splitPositionBonuses(ranked, [300000, 200000, 100000]);
    expect(payouts.get('a')).toBe(250000);
    expect(payouts.get('b')).toBe(250000);
    expect(payouts.get('c')).toBe(100000);
  });

  it('reproduces the inverse base and retains the estimated porra component', () => {
    const result = simulateScenario(dataset, DEFAULT_SCENARIO);
    expect(result.users.find((user) => user.userId === 'a')?.basePayout).toBe(1_000_000);
    expect(result.users.find((user) => user.userId === 'b')?.porraPayout).toBe(100_000);
    expect(result.totalPayout).toBe(4_600_000);
  });

  it('keeps the configurable prize pool stable in neutral mode', () => {
    const result = simulateScenario(dataset, {
      ...DEFAULT_SCENARIO,
      payoutMode: 'direct',
      positionPreset: 'winner',
      budgetMode: 'neutral',
    });
    expect(result.totalPayout).toBe(dataset.baselineRecordedPayout);
  });

  it('does not pay the ideal bonus twice for a non-stackable MVP', () => {
    const result = simulateScenario(dataset, {
      ...DEFAULT_SCENARIO,
      idealPlayerBonus: 50000,
      mvpBonus: 60000,
      stackMvpAndIdeal: false,
    });
    const user = result.users.find((entry) => entry.userId === 'a');
    expect(user?.idealPayout).toBe(50000);
    expect(user?.mvpPayout).toBe(60000);
  });

  it('reports structural breaches without negative payouts', () => {
    const result = simulateScenario(dataset, {
      ...DEFAULT_SCENARIO,
      rosterCap: 18,
      squadValueCap: 80_000_000,
    });
    expect(result.rosterBreachRate).toBeCloseTo(2 / 3);
    expect(result.valueCapBreachRate).toBeCloseTo(2 / 3);
    expect(result.users.every((user) => user.totalPayout >= 0)).toBe(true);
  });
});
