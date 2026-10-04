import { beforeEach, expect, it, vi } from 'vitest';
import { auth } from '@/auth';
import { POST as place } from './place/route';
import { GET as market } from './market/route';
import { GET as count } from './count/route';
import { privateJsonResponse } from '@/lib/utils/response';

const mocks = vi.hoisted(() => ({ workspace: vi.fn(), count: vi.fn(), place: vi.fn() }));
vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/features/market/server', () => ({
  readPersonalBidWorkspace: mocks.workspace,
  readPersonalBidCount: mocks.count,
  placePersonalBidNow: mocks.place,
  readPersonalJson: async (request: Request) => request.json(),
  personalBidErrorResponse: () => privateJsonResponse({ message: 'Error' }, 500),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(auth).mockResolvedValue({ user: { id: '7' } } as never);
});

it('denies anonymous market reads, counts, and immediate bids with private responses', async () => {
  vi.mocked(auth).mockResolvedValue(null as never);
  const readResponse = await market();
  const countResponse = await count(
    new Request('https://example.com/api/personal/bids/count?playerId=21')
  );
  const bidResponse = await place(
    new Request('https://example.com/api/personal/bids/place', { method: 'POST', body: '{}' })
  );
  for (const response of [readResponse, countResponse, bidResponse]) {
    expect(response.status).toBe(401);
    expect(response.headers.get('Cache-Control')).toContain('no-store');
  }
  expect(mocks.workspace).not.toHaveBeenCalled();
  expect(mocks.count).not.toHaveBeenCalled();
  expect(mocks.place).not.toHaveBeenCalled();
});

it('passes the authenticated identity to the immediate bid service', async () => {
  mocks.place.mockResolvedValue({ status: 'completed', playerId: 21, amount: 120 });
  const payload = { playerId: 21, amount: 120 };
  const response = await place(
    new Request('https://example.com/api/personal/bids/place', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  );
  expect(response.status).toBe(200);
  expect(mocks.place).toHaveBeenCalledWith('7', payload);
  expect(response.headers.get('Cache-Control')).toContain('no-store');
});

it('passes the authenticated identity to live market and count reads', async () => {
  mocks.workspace.mockResolvedValue({ market: { listings: [] } });
  mocks.count.mockResolvedValue({ playerId: 21, totalBids: 2 });
  const readResponse = await market();
  const countResponse = await count(
    new Request('https://example.com/api/personal/bids/count?playerId=21')
  );
  expect(readResponse.status).toBe(200);
  expect(countResponse.status).toBe(200);
  expect(readResponse.headers.get('Cache-Control')).toContain('no-store');
  expect(countResponse.headers.get('Cache-Control')).toContain('no-store');
  expect(mocks.workspace).toHaveBeenCalledWith('7');
  expect(mocks.count).toHaveBeenCalledWith('7', 21);
});

it('rejects invalid player IDs before querying the provider', async () => {
  const response = await count(
    new Request('https://example.com/api/personal/bids/count?playerId=oops')
  );
  expect(response.status).toBe(400);
  expect(mocks.count).not.toHaveBeenCalled();
});
