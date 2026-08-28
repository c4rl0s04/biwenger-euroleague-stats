import { describe, expect, it } from 'vitest';
import {
  validateAdvancedProviderSnapshot,
  validateBiwengerRoundSeason,
  validateProviderSnapshot,
} from '../preflight';

const validSnapshot = {
  seasonId: '2026-27',
  biwengerLeagueId: '123',
  biwengerUserId: '456',
  euroleagueCode: 'E2026',
  league: { data: { id: 123, standings: [{ id: 456 }] } },
  competition: { data: { players: { 1: {} }, teams: { 2: {} } } },
  schedule: { schedule: { item: [{ game: 1 }] } },
};

describe('sync provider preflight', () => {
  it('accepts a coherent provider snapshot', () => {
    expect(validateProviderSnapshot(validSnapshot)).toEqual({
      players: 1,
      teams: 1,
      standings: 1,
      games: 1,
    });
  });

  it('rejects a response from another Biwenger league', () => {
    expect(() =>
      validateProviderSnapshot({
        ...validSnapshot,
        league: { data: { id: 999, standings: [{ id: 456 }] } },
      })
    ).toThrow(/returned league 999/);
  });

  it('rejects a sync account that is not a member of the configured league', () => {
    expect(() =>
      validateProviderSnapshot({
        ...validSnapshot,
        league: { data: { id: 123, standings: [{ id: 999 }] } },
      })
    ).toThrow(/user 456 is not present/);
  });
});

describe('advanced official provider preflight', () => {
  const schedule = [
    {
      seasonYear: 2026,
      gameCode: 1,
      homeTeamCode: 'MAD',
      awayTeamCode: 'BAR',
    },
  ];

  it('requires a coherent non-empty schedule and standings snapshot', () => {
    expect(
      validateAdvancedProviderSnapshot({
        seasonYear: 2026,
        expectedSeasonId: '2026-27',
        schedule,
        standings: [{ teamCode: 'MAD' }],
      })
    ).toEqual({ games: 1, teams: 2, standings: 1 });
  });

  it('rejects duplicate game codes and cross-season payloads', () => {
    expect(() =>
      validateAdvancedProviderSnapshot({
        seasonYear: 2026,
        expectedSeasonId: '2026-27',
        schedule: [...schedule, { ...schedule[0], awayTeamCode: 'OLY' }],
        standings: [{ teamCode: 'MAD' }],
      })
    ).toThrow(/Duplicate/);
    expect(() =>
      validateAdvancedProviderSnapshot({
        seasonYear: 2026,
        expectedSeasonId: '2025-26',
        schedule,
        standings: [{ teamCode: 'MAD' }],
      })
    ).toThrow(/does not match/);
  });
});

describe('Biwenger season readiness', () => {
  it('accepts first-round games from the configured season start year', () => {
    expect(
      validateBiwengerRoundSeason({
        seasonId: '2026-27',
        games: [{ id: 1, date: Date.parse('2026-09-30T18:00:00Z') / 1000 }],
      })
    ).toMatchObject({ games: 1, seasonYear: 2026 });
  });

  it('rejects the previous Biwenger season before any sync writes occur', () => {
    expect(() =>
      validateBiwengerRoundSeason({
        seasonId: '2026-27',
        games: [{ id: 49683, date: Date.parse('2025-09-30T18:00:00Z') / 1000 }],
      })
    ).toThrow(/still belongs to 2025.*expected 2026/);
  });

  it('rejects an unavailable or undated first round', () => {
    expect(() => validateBiwengerRoundSeason({ seasonId: '2026-27', games: [] })).toThrow(
      /no first-round games/
    );
    expect(() => validateBiwengerRoundSeason({ seasonId: '2026-27', games: [{ id: 1 }] })).toThrow(
      /no dated first-round games/
    );
  });
});
