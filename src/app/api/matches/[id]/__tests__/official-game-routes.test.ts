import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const queries = vi.hoisted(() => ({
  getOfficialPlayByPlay: vi.fn(),
  getOfficialShots: vi.fn(),
}));

vi.mock('@/lib/db/queries/competition/official-game-data', () => queries);

import { GET as getPlays } from '../play-by-play/route';
import { GET as getShots } from '../shots/route';

describe('official game detail routes', () => {
  beforeEach(() => vi.clearAllMocks());

  it('passes play filters and uses short live caching', async () => {
    queries.getOfficialPlayByPlay.mockResolvedValue({
      match: { id: 42, status: 'live' },
      finalizedAt: null,
      items: [],
    });
    const response = await getPlays(
      new NextRequest(
        'http://localhost/api/matches/42/play-by-play?period=2&teamCode=mad&playerId=7'
      ),
      { params: Promise.resolve({ id: '42' }) }
    );
    expect(queries.getOfficialPlayByPlay).toHaveBeenCalledWith(42, {
      period: 2,
      teamCode: 'MAD',
      playerId: 7,
    });
    expect(response.headers.get('Cache-Control')).toContain('max-age=15');
  });

  it('uses long caching for finalized shots and rejects invalid filters', async () => {
    queries.getOfficialShots.mockResolvedValue({
      match: { id: 42, status: 'finished' },
      finalizedAt: new Date().toISOString(),
      items: [],
    });
    const response = await getShots(
      new NextRequest('http://localhost/api/matches/42/shots?period=4'),
      { params: Promise.resolve({ id: '42' }) }
    );
    expect(response.headers.get('Cache-Control')).toContain('max-age=3600');

    const invalid = await getShots(
      new NextRequest('http://localhost/api/matches/42/shots?playerId=oops'),
      { params: Promise.resolve({ id: '42' }) }
    );
    expect(invalid.status).toBe(400);
    expect(queries.getOfficialShots).toHaveBeenCalledTimes(1);
  });
});
