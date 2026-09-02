import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({ resolveRoundIdByPolicy: vi.fn() }));
vi.mock('../queries/match-list.query', () => ({ listMatchRows: vi.fn() }));

import type { MatchListRow } from '../queries/match-list.query';
import { createMatchesService, MATCHES_ACCESS_POLICY } from './matches.service';

const rows = [
  {
    id: 1,
    roundId: 3,
    roundName: 'Jornada 3',
    homeScore: null,
    awayScore: null,
    date: new Date('2026-10-08T18:00:00.000Z'),
    status: 'scheduled',
    homeId: 1,
    homeName: 'Home',
    homeCode: 'HOM',
    homeImageUrl: '/home.png',
    homeCity: null,
    homeArena: null,
    homeLatitude: null,
    homeLongitude: null,
    awayId: 2,
    awayName: 'Away',
    awayCode: 'AWY',
    awayImageUrl: '/away.png',
    awayCity: null,
    awayArena: null,
    awayLatitude: null,
    awayLongitude: null,
  },
] satisfies MatchListRow[];

describe('matches service', () => {
  const listRows = vi.fn();
  const resolveCurrentRoundId = vi.fn();
  const service = createMatchesService({ listRows, resolveCurrentRoundId });

  beforeEach(() => {
    vi.clearAllMocks();
    listRows.mockResolvedValue(rows);
    resolveCurrentRoundId.mockResolvedValue(3);
  });

  it('declares a public read-only authorization boundary', () => {
    expect(MATCHES_ACCESS_POLICY).toEqual({ read: 'public', mutations: 'none' });
  });

  it('orchestrates query and round policy into the selected screen model', async () => {
    await expect(service.getMatchesScreenData('3')).resolves.toMatchObject({
      currentRoundId: 3,
      selectedRoundId: 3,
      rounds: [{ roundId: 3, roundName: 'Jornada 3' }],
    });
    expect(listRows).toHaveBeenCalledOnce();
    expect(resolveCurrentRoundId).toHaveBeenCalledOnce();
  });

  it('falls back safely for invalid or missing rounds', async () => {
    await expect(service.getMatchesScreenData('not-a-round')).resolves.toMatchObject({
      selectedRoundId: 3,
    });
    await expect(service.getMatchRoundScreenData('99')).resolves.toEqual({
      selectedRoundId: 99,
      round: null,
    });
  });
});
