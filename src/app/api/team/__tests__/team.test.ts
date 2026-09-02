import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const feature = vi.hoisted(() => ({
  getTeamProfileData: vi.fn(),
  toTeamProfileApiModel: vi.fn(),
  TEAM_PROFILE_HTTP_CACHE_SECONDS: 300,
}));

vi.mock('@/features/teams/server', () => feature);

describe('team route contracts', () => {
  beforeEach(() => vi.clearAllMocks());

  it('preserves the GET /api/team/[id] success envelope and cache contract', async () => {
    const model = { id: 1, name: 'Team' };
    const apiModel = { id: 1, name: 'Team', short_name: 'TEM' };
    feature.getTeamProfileData.mockResolvedValue(model);
    feature.toTeamProfileApiModel.mockReturnValue(apiModel);

    const { GET } = await import('@/app/api/team/[id]/route');
    const response = await GET(new NextRequest('http://localhost/api/team/1'), {
      params: Promise.resolve({ id: '1' }),
    });

    expect(feature.getTeamProfileData).toHaveBeenCalledWith('1');
    expect(feature.toTeamProfileApiModel).toHaveBeenCalledWith(model);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe(
      'public, max-age=300, stale-while-revalidate=60'
    );
    expect(await response.json()).toEqual({ success: true, data: { team: apiModel } });
  });

  it('preserves not-found and unexpected-error status contracts', async () => {
    const { GET } = await import('@/app/api/team/[id]/route');
    feature.getTeamProfileData.mockResolvedValueOnce(null);

    const notFound = await GET(new NextRequest('http://localhost/api/team/999'), {
      params: Promise.resolve({ id: '999' }),
    });
    expect(notFound.status).toBe(404);
    expect(await notFound.json()).toMatchObject({ success: false, error: 'Team not found' });

    feature.getTeamProfileData.mockRejectedValueOnce(new Error('database unavailable'));
    const failure = await GET(new NextRequest('http://localhost/api/team/1'), {
      params: Promise.resolve({ id: '1' }),
    });
    expect(failure.status).toBe(500);
    expect(await failure.json()).toMatchObject({
      success: false,
      error: 'Failed to fetch team data',
    });
  });
});
