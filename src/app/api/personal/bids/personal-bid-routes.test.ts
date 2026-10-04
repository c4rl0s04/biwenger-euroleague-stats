import { beforeEach, expect, it, vi } from 'vitest';
import { auth } from '@/auth';
import { POST as place } from './place/route';
import { POST as execute } from './execute/route';
import { GET as market } from './market/route';
import { privateJsonResponse } from '@/lib/utils/response';

const mocks = vi.hoisted(() => ({
  workspace: vi.fn(),
  place: vi.fn(),
  verify: vi.fn(),
  execute: vi.fn(),
}));
vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/features/market/server', () => ({
  readPersonalBidWorkspace: mocks.workspace,
  placePersonalBidNow: mocks.place,
  verifyPersonalBidWebhook: mocks.verify,
  executeScheduledPersonalBid: mocks.execute,
  readPersonalJson: async (request: Request) => request.json(),
  personalBidErrorResponse: () => privateJsonResponse({ message: 'Error' }, 500),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(auth).mockResolvedValue({ user: { id: '7' } } as never);
});

it('denies anonymous market reads and immediate bids with private responses', async () => {
  vi.mocked(auth).mockResolvedValue(null as never);
  const readResponse = await market();
  const bidResponse = await place(
    new Request('https://example.com/api/personal/bids/place', { method: 'POST', body: '{}' })
  );
  expect(readResponse.status).toBe(401);
  expect(bidResponse.status).toBe(401);
  expect(readResponse.headers.get('Cache-Control')).toContain('no-store');
  expect(bidResponse.headers.get('Cache-Control')).toContain('no-store');
  expect(mocks.workspace).not.toHaveBeenCalled();
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

it('rejects unsigned worker requests before claiming any rule', async () => {
  mocks.verify.mockResolvedValue(false);
  const response = await execute(
    new Request('https://example.com/api/personal/bids/execute', {
      method: 'POST',
      body: JSON.stringify({ ruleId: 'abc' }),
    })
  );
  expect(response.status).toBe(401);
  expect(mocks.execute).not.toHaveBeenCalled();
});

it('acknowledges an authenticated worker delivery', async () => {
  mocks.verify.mockResolvedValue(true);
  mocks.execute.mockResolvedValue('ignored');
  const response = await execute(
    new Request('https://example.com/api/personal/bids/execute', {
      method: 'POST',
      headers: { 'Upstash-Signature': 'signed' },
      body: JSON.stringify({ ruleId: '2a594ceb-2c3b-423e-9c55-70cdb1db9328' }),
    })
  );
  expect(response.status).toBe(200);
  expect(mocks.execute).toHaveBeenCalledOnce();
  expect(response.headers.get('Cache-Control')).toContain('no-store');
});
