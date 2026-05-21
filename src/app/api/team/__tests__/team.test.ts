import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/services', () => ({
  fetchTeamProfile: vi.fn(),
}));

import * as services from '@/lib/services';

describe('team route contracts', () => {
  beforeEach(() => vi.clearAllMocks());

  it('covers GET /api/team/[id] success and not found envelopes', async () => {
    vi.mocked(services.fetchTeamProfile).mockResolvedValue({ id: '1', name: 'Team' } as any);

    const { GET } = await import('@/app/api/team/[id]/route');
    const response = await GET(new NextRequest('http://localhost/api/team/1'), {
      params: Promise.resolve({ id: '1' }),
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      data: { team: { id: '1', name: 'Team' } },
    });

    vi.mocked(services.fetchTeamProfile).mockResolvedValue(null as any);
    const notFound = await GET(new NextRequest('http://localhost/api/team/999'), {
      params: Promise.resolve({ id: '999' }),
    });
    expect(notFound.status).toBe(404);
    expect((await notFound.json()).success).toBe(false);
  });
});
