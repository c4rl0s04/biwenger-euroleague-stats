vi.mock('@/lib/seasons/server', () => ({
  getRequestSeason: vi.fn(async () => ({ id: '2026-27', status: 'active', sourceLeagueId: '9' })),
}));
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

vi.mock('@/lib/credentials/server', () => ({
  biwengerCredentials: {
    withCredential: vi.fn(),
  },
}));

import { biwengerCredentials } from '@/lib/credentials/server';
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
      { token: fakeToken, leagueId: '9', userId: 'user-123' }
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
      { token: fakeToken, leagueId: '9', userId: 'user-456' }
    );
  });
});

it('rejects historical provider operations before reading personal credentials', async () => {
  const { getRequestSeason } = await import('@/lib/seasons/server');
  vi.mocked(getRequestSeason).mockResolvedValueOnce({
    ...(await getRequestSeason()),
    status: 'frozen',
  });
  vi.mocked(biwengerCredentials.withCredential).mockClear();
  await expect(executeUserProviderCommand('user-123', 'market.place', vi.fn())).rejects.toThrow(
    'active season'
  );
  expect(biwengerCredentials.withCredential).not.toHaveBeenCalled();
});

it('rejects an unbound season before reading personal credentials', async () => {
  const { getRequestSeason } = await import('@/lib/seasons/server');
  vi.mocked(getRequestSeason).mockResolvedValueOnce({
    ...(await getRequestSeason()),
    sourceLeagueId: null,
  });
  vi.mocked(biwengerCredentials.withCredential).mockClear();
  await expect(executeUserProviderQuery('user-123', 'squad.read', vi.fn())).rejects.toThrow(
    'league binding'
  );
  expect(biwengerCredentials.withCredential).not.toHaveBeenCalled();
});
