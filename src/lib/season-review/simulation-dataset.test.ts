import { describe, expect, it } from 'vitest';
import { buildSeasonSimulationDataset, calibrateSeasonSimulator } from './simulation-dataset';

describe('historical simulation dataset', () => {
  it('aligns real player points and price changes to season rounds', () => {
    const dataset = buildSeasonSimulationDataset({
      users: [
        { id: 'u1', name: 'Uno' },
        { id: 'u2', name: 'Dos' },
      ],
      userRounds: [
        { user_id: 'u1', round_id: 1, participated: true, round_date: '2025-09-10' },
        { user_id: 'u2', round_id: 1, participated: true, round_date: '2025-09-10' },
        { user_id: 'u1', round_id: 2, participated: true, round_date: '2025-09-17' },
      ],
      lineups: [
        { user_id: 'u1', round_id: 1, player_id: 1 },
        { user_id: 'u1', round_id: 1, player_id: 2 },
      ],
      playerStats: [
        { round_id: 1, player_id: 1, fantasy_points: 20, position: 'base' },
        { round_id: 2, player_id: 1, fantasy_points: 30, position: 'base' },
        { round_id: 1, player_id: 2, fantasy_points: 10, position: 'pivot' },
        { round_id: 2, player_id: 2, fantasy_points: 12, position: 'pivot' },
      ],
      initialSquads: [
        { user_id: 'u1', player_id: 1, price: 1_000_000 },
        { user_id: 'u2', player_id: 2, price: 2_000_000 },
      ],
      marketValues: [
        { date: '2025-09-10', player_id: 1, price: 1_000_000 },
        { date: '2025-09-17', player_id: 1, price: 1_100_000 },
        { date: '2025-09-10', player_id: 2, price: 2_000_000 },
        { date: '2025-09-17', player_id: 2, price: 1_800_000 },
      ],
    });

    expect(dataset.rounds).toEqual([1, 2]);
    expect(dataset.userCount).toBe(2);
    expect(dataset.lineupSize).toBe(2);
    expect(dataset.players.find((player) => player.id === '1')).toMatchObject({
      initialPrice: 1_000_000,
      roundPoints: [20, 30],
      priceChanges: [0, 0.1],
    });
  });

  it('rates calibration from movements and closing inequality', () => {
    expect(
      calibrateSeasonSimulator(
        {
          transfers: 839,
          finalResourceGini: 0.055,
          finalSquadGini: 0.124,
        },
        {
          medianTransactions: 887,
          medianFinalResourceGini: 0.047,
          medianFinalSquadGini: 0.11,
        }
      )
    ).toMatchObject({
      status: 'strong',
      transferRelativeError: 0.057211,
      resourceGiniAbsoluteError: 0.008,
      squadGiniAbsoluteError: 0.014,
    });

    expect(
      calibrateSeasonSimulator(
        { transfers: 100, finalResourceGini: 0.05, finalSquadGini: 0.1 },
        { medianTransactions: 200, medianFinalResourceGini: 0.2, medianFinalSquadGini: 0.25 }
      ).status
    ).toBe('weak');
  });
});
