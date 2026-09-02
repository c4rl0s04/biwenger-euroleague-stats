import { describe, expect, it } from 'vitest';

import type { MatchListRow } from '../queries/match-list.query';
import { mapMatchRowsToRounds, mapMatchRowsToSchedule } from './match.mapper';

function row(overrides: Partial<MatchListRow> = {}): MatchListRow {
  return {
    id: 10,
    roundId: 2,
    roundName: 'Jornada 2',
    homeScore: 84,
    awayScore: 79,
    date: new Date('2026-10-01T18:30:00.000Z'),
    status: 'finished',
    homeId: 1,
    homeName: 'Home',
    homeCode: 'HOM',
    homeImageUrl: '/home.png',
    homeCity: 'Madrid',
    homeArena: 'Arena',
    homeLatitude: 40.4,
    homeLongitude: -3.7,
    awayId: 2,
    awayName: 'Away',
    awayCode: 'AWY',
    awayImageUrl: '/away.png',
    awayCity: 'Paris',
    awayArena: 'Hall',
    awayLatitude: 48.8,
    awayLongitude: 2.3,
    ...overrides,
  };
}

describe('match view-model mapper', () => {
  it('sorts rounds, drops unassigned rows and emits serializable normalized models', () => {
    const rounds = mapMatchRowsToRounds([
      row(),
      row({ id: 5, roundId: 1, roundName: null, date: new Date('2026-09-24T18:00:00.000Z') }),
      row({ id: 99, roundId: null }),
    ]);

    expect(rounds.map(({ roundId, roundIndex }) => ({ roundId, roundIndex }))).toEqual([
      { roundId: 1, roundIndex: 1 },
      { roundId: 2, roundIndex: 2 },
    ]);
    expect(rounds[0].roundName).toBe('Jornada 1');
    expect(rounds[0].matches[0]).toMatchObject({
      id: 5,
      date: '2026-09-24T18:00:00.000Z',
      home: { id: 1, name: 'Home', imageUrl: '/home.png', score: 84 },
      away: { id: 2, name: 'Away', imageUrl: '/away.png', score: 79 },
    });
    expect(JSON.parse(JSON.stringify(rounds))).toEqual(rounds);
  });

  it('keeps unassigned matches in the published season schedule contract', () => {
    const schedule = mapMatchRowsToSchedule([row({ id: 99, roundId: null, roundName: null })]);

    expect(schedule).toMatchObject([{ id: 99, roundName: '' }]);
    expect(JSON.parse(JSON.stringify(schedule))).toEqual(schedule);
  });
});
