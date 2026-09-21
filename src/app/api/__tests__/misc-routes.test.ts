import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/services', () => ({
  fetchLandingStats: vi.fn(),
}));

import * as services from '@/lib/services';

describe('miscellaneous API route contracts', () => {
  beforeEach(() => vi.clearAllMocks());

  it('covers landing stats success envelope', async () => {
    vi.mocked(services.fetchLandingStats).mockResolvedValue({ users: 4 } as any);

    const landing = await import('@/app/api/landing-stats/route');

    const landingResponse = await landing.GET();
    expect(landingResponse.status).toBe(200);
    expect(await landingResponse.json()).toEqual({ success: true, data: { users: 4 } });
  });
});
