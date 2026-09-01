import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

vi.mock('@/lib/credentials/service', () => ({
  biwengerCredentials: {
    withCredential: vi.fn(),
  },
}));

vi.mock('@/lib/api/biwenger-client.js', () => ({
  biwengerFetch: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    update: vi.fn(),
  },
}));

import { biwengerCredentials } from '@/lib/credentials/service';
import { biwengerFetch } from '@/lib/api/biwenger-client.js';
import { marketActionsService } from './marketActionsService';
import { lineupService } from './lineupService';

describe('market and lineup credential adoption', () => {
  const credential = 'synthetic-service-gateway-token';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(biwengerCredentials.withCredential).mockImplementation(
      async (_userId, _operation, callback) => callback(credential)
    );
    vi.mocked(biwengerFetch).mockResolvedValue({ status: 200, data: { lineup: {} } });
  });

  it('uses the authenticated actor boundary for market commands', async () => {
    await marketActionsService.placeOnMarket({
      playerId: 7,
      price: 1_000,
      userId: 'authenticated-actor',
    });

    expect(biwengerCredentials.withCredential).toHaveBeenCalledWith(
      'authenticated-actor',
      'market.place',
      expect.any(Function)
    );
    expect(biwengerFetch).toHaveBeenCalledWith(
      '/market',
      expect.objectContaining({
        customToken: credential,
        customUserId: 'authenticated-actor',
      })
    );
  });

  it('uses the authenticated actor boundary for lineup reads and writes', async () => {
    await lineupService.updateLineup({ lineup: { playersID: [7] }, userId: 'actor' });
    await lineupService.getLineup('actor');

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
      vi.mocked(biwengerFetch).mock.calls.every(([, options]) => {
        const requestOptions = options as { customUserId?: string } | undefined;
        return requestOptions?.customUserId === 'actor';
      })
    ).toBe(true);
  });
});
