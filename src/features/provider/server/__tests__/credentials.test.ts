import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

vi.mock('@/lib/credentials/service', () => ({
  biwengerCredentials: {
    withCredential: vi.fn(),
  },
}));

import { biwengerCredentials } from '@/lib/credentials/service';
import { executeUserProviderCommand, executeUserProviderQuery } from '../credentials';
import { createBiwengerProviderClient } from '../client';

describe('Provider credential integration', () => {
  const fakeToken = 'decrypted-personal-token-999';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(biwengerCredentials.withCredential).mockImplementation(
      async (_userId, _operation, callback) => callback(fakeToken)
    );
  });

  it('executeUserProviderQuery executes with credential and user context', async () => {
    const mockClient = createBiwengerProviderClient();
    const querySpy = vi.spyOn(mockClient, 'query').mockResolvedValue({ squad: [] });

    const result = await executeUserProviderQuery(
      'user-123',
      'squad.read',
      (client, context) => client.query('/squad', { delayMs: 0 }, context),
      mockClient
    );

    expect(result).toEqual({ squad: [] });
    expect(biwengerCredentials.withCredential).toHaveBeenCalledWith(
      'user-123',
      'squad.read',
      expect.any(Function)
    );
    expect(querySpy).toHaveBeenCalledWith(
      '/squad',
      { delayMs: 0 },
      { token: fakeToken, userId: 'user-123' }
    );
  });

  it('executeUserProviderCommand executes with credential and user context', async () => {
    const mockClient = createBiwengerProviderClient();
    const commandSpy = vi.spyOn(mockClient, 'command').mockResolvedValue({
      status: 'completed',
      httpStatus: 200,
    });

    const result = await executeUserProviderCommand(
      'user-456',
      'market.place',
      (client, context) =>
        client.command('/market', { method: 'POST', body: { player: 10 }, delayMs: 0 }, context),
      mockClient
    );

    expect(result.status).toBe('completed');
    expect(biwengerCredentials.withCredential).toHaveBeenCalledWith(
      'user-456',
      'market.place',
      expect.any(Function)
    );
    expect(commandSpy).toHaveBeenCalledWith(
      '/market',
      { method: 'POST', body: { player: 10 }, delayMs: 0 },
      { token: fakeToken, userId: 'user-456' }
    );
  });
});
