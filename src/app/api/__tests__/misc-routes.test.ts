import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/services', () => ({
  fetchLandingStats: vi.fn(),
  fetchNewsFeed: vi.fn(),
}));

import * as services from '@/lib/services';

describe('miscellaneous API route contracts', () => {
  beforeEach(() => vi.clearAllMocks());

  it('covers landing stats and news success envelopes', async () => {
    vi.mocked(services.fetchLandingStats).mockResolvedValue({ users: 4 } as any);
    vi.mocked(services.fetchNewsFeed).mockResolvedValue([{ id: 'news-1' }] as any);

    const landing = await import('@/app/api/landing-stats/route');
    const news = await import('@/app/api/news/route');

    const landingResponse = await landing.GET();
    expect(landingResponse.status).toBe(200);
    expect(await landingResponse.json()).toEqual({ success: true, data: { users: 4 } });

    const newsResponse = await news.GET();
    expect(newsResponse.status).toBe(200);
    expect(await newsResponse.json()).toEqual({ success: true, data: [{ id: 'news-1' }] });
  });
});
