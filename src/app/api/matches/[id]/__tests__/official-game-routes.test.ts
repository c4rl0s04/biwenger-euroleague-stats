import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const feature = vi.hoisted(() => {
  class MatchesInputError extends Error {}
  return {
    MatchesInputError,
    getOfficialPlayByPlayData: vi.fn(),
    getOfficialShotData: vi.fn(),
  };
});

vi.mock('@/features/matches/server', () => feature);

import { GET as getPlays } from '../play-by-play/route';
import { GET as getShots } from '../shots/route';

describe('official game detail routes', () => {
  beforeEach(() => vi.clearAllMocks());

  it('passes play filters and uses short live caching', async () => {
    feature.getOfficialPlayByPlayData.mockResolvedValue({
      data: { match: { id: 42, status: 'live' }, finalizedAt: null, items: [] },
      cacheSeconds: 15,
    });
    const response = await getPlays(
      new NextRequest(
        'http://localhost/api/matches/42/play-by-play?period=2&teamCode=mad&playerId=7'
      ),
      { params: Promise.resolve({ id: '42' }) }
    );
    expect(feature.getOfficialPlayByPlayData).toHaveBeenCalledWith({
      matchId: '42',
      filters: { period: '2', teamCode: 'mad', playerId: '7' },
    });
    expect(response.headers.get('Cache-Control')).toContain('max-age=15');
  });

  it('uses long caching for finalized shots and rejects invalid filters', async () => {
    feature.getOfficialShotData.mockResolvedValueOnce({
      data: {
        match: { id: 42, status: 'finished' },
        finalizedAt: new Date().toISOString(),
        items: [],
      },
      cacheSeconds: 3600,
    });
    const response = await getShots(
      new NextRequest('http://localhost/api/matches/42/shots?period=4'),
      { params: Promise.resolve({ id: '42' }) }
    );
    expect(response.headers.get('Cache-Control')).toContain('max-age=3600');

    feature.getOfficialShotData.mockRejectedValueOnce(
      new feature.MatchesInputError('playerId must be a positive integer.')
    );
    const invalid = await getShots(
      new NextRequest('http://localhost/api/matches/42/shots?playerId=oops'),
      { params: Promise.resolve({ id: '42' }) }
    );
    expect(invalid.status).toBe(400);
    expect(feature.getOfficialShotData).toHaveBeenCalledTimes(2);
  });
});
