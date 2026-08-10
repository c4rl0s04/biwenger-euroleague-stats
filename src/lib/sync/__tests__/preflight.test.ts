import { describe, expect, it } from 'vitest';
import { validateProviderSnapshot } from '../preflight';

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
