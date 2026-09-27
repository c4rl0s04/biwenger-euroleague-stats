import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

vi.mock('@/lib/credentials/server', () => ({
  biwengerCredentials: {
    withCredential: vi.fn(),
  },
}));

vi.mock('@/features/provider/server/client', () => ({
  biwengerProviderClient: { command: vi.fn(), query: vi.fn() },
}));

vi.mock('@/lib/db', () => ({
  db: {
    update: vi.fn(),
  },
}));

import { biwengerCredentials } from '@/lib/credentials/server';
import { biwengerProviderClient } from '../client';
import { marketCommandService } from '@/features/market/server';
import { lineupCommandService, lineupReadService } from '@/features/lineup/server';

describe('market and lineup credential adoption', () => {
  const credential = 'synthetic-service-gateway-token';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(biwengerCredentials.withCredential).mockImplementation(
      async (_userId, _operation, callback) => callback(credential)
    );
    vi.mocked(biwengerProviderClient.command).mockResolvedValue({
      status: 'completed',
      httpStatus: 200,
    });
    vi.mocked(biwengerProviderClient.query).mockResolvedValue({ lineup: {} });
  });

  it('uses the authenticated actor boundary for market commands', async () => {
    await marketCommandService.sellPlayer('authenticated-actor', {
      playerId: 7,
      price: 1_000,
    });

    expect(biwengerCredentials.withCredential).toHaveBeenCalledWith(
      'authenticated-actor',
      'market.place',
      expect.any(Function)
    );
    expect(biwengerProviderClient.command).toHaveBeenCalledWith(
      '/market',
      expect.objectContaining({
        context: { token: credential, userId: 'authenticated-actor' },
      })
    );
  });

  it('uses the authenticated actor boundary for lineup reads and writes', async () => {
    await lineupCommandService.updateLineup('actor', { playersID: [7] });
    await lineupReadService.getLineup('actor');

    expect(biwengerCredentials.withCredential).toHaveBeenNthCalledWith(
      1,
      'actor',
      'lineup.update',
      expect.any(Function)
    );
    expect(biwengerCredentials.withCredential).toHaveBeenNthCalledWith(
      2,
      'actor',
      'lineup.read',
      expect.any(Function)
    );
    expect(
      [
        ...vi.mocked(biwengerProviderClient.command).mock.calls,
        ...vi.mocked(biwengerProviderClient.query).mock.calls,
      ].every(([, options]) => {
        const requestOptions = options as { context?: { userId?: string } } | undefined;
        return requestOptions?.context?.userId === 'actor';
      })
    ).toBe(true);
  });
});
