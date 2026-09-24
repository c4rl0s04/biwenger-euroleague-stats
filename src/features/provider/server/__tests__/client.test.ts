import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createBiwengerProviderClient } from '../client';
import {
  BiwengerAuthError,
  BiwengerMutationError,
  BiwengerNetworkError,
  BiwengerProviderError,
  BiwengerRateLimitError,
} from '../errors';

describe('BiwengerProviderClient', () => {
  const defaultToken = 'test-global-token';
  const defaultLeagueId = '100';
  const defaultUserId = '200';
  let sleepMock: ReturnType<typeof vi.fn<(ms: number) => Promise<void>>>;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    sleepMock = vi.fn(async (_ms: number) => undefined);
    fetchMock = vi.fn();
  });

  function createClient(overrides = {}) {
    return createBiwengerProviderClient({
      baseUrl: 'https://biwenger.as.com/api/v2',
      defaultToken,
      defaultLeagueId,
      defaultUserId,
      sleepFn: sleepMock,
      fetchFn: fetchMock as any,
      defaultDelayRange: [0, 0],
      ...overrides,
    });
  }

  describe('query() operations', () => {
    it('executes successful GET query with headers and version injection', async () => {
      // 1st call: version check on /account
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ version: '567' }),
      });
      // 2nd call: actual endpoint
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ data: [{ id: 1, name: 'Sample' }] }),
      });

      const client = createClient();
      const result = await client.query('/players', { delayMs: 0 });

      expect(result).toEqual({ data: [{ id: 1, name: 'Sample' }] });
      expect(fetchMock).toHaveBeenCalledTimes(2);

      // Verify /account call
      expect(fetchMock.mock.calls[0][0]).toBe('https://biwenger.as.com/api/v2/account');

      // Verify target endpoint call with version param
      expect(fetchMock.mock.calls[1][0]).toBe('https://biwenger.as.com/api/v2/players?v=567');
      const headers = fetchMock.mock.calls[1][1].headers;
      expect(headers['Authorization']).toBe('Bearer test-global-token');
      expect(headers['X-League']).toBe('100');
      expect(headers['X-User']).toBe('200');
    });

    it('retries on HTTP 429 up to maxRetries for read queries', async () => {
      const client = createClient({
        versionFallback: 'fallback-v1',
      });

      // 1st attempt: 429
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      });
      // 2nd attempt: 200
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ status: 'recovered' }),
      });

      const result = await client.query('/standings', {
        skipVersionCheck: true,
        delayMs: 0,
        retryDelay: 50,
      });

      expect(result).toEqual({ status: 'recovered' });
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(sleepMock).toHaveBeenCalledWith(50);
    });

    it('fails after exceeding maxRetries on HTTP 429', async () => {
      const client = createClient();

      fetchMock.mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      });

      await expect(
        client.query('/standings', {
          skipVersionCheck: true,
          delayMs: 0,
          retries: 2,
          retryDelay: 10,
        })
      ).rejects.toThrow(BiwengerRateLimitError);

      expect(fetchMock).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
    });

    it('does not retry 500 error on query and never reads response body', async () => {
      const client = createClient();
      const readBodySpy = vi.fn(async () => 'CANARY_BODY');

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Error',
        text: readBodySpy,
      });

      await expect(
        client.query('/players', { skipVersionCheck: true, delayMs: 0 })
      ).rejects.toThrow(BiwengerProviderError);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(readBodySpy).not.toHaveBeenCalled();
    });

    it('wraps fetch network exceptions into BiwengerNetworkError', async () => {
      const client = createClient();
      fetchMock.mockRejectedValueOnce(new Error('Connection reset'));

      await expect(
        client.query('/players', { skipVersionCheck: true, delayMs: 0 })
      ).rejects.toThrow(BiwengerNetworkError);
    });

    it('throws BiwengerAuthError when token is missing', async () => {
      const client = createBiwengerProviderClient({
        baseUrl: 'https://biwenger.as.com/api/v2',
        defaultToken: undefined,
        defaultLeagueId,
        defaultUserId,
      });

      await expect(
        client.query('/players', { skipVersionCheck: true, delayMs: 0 })
      ).rejects.toThrow(BiwengerAuthError);
    });
  });

  describe('command() operations', () => {
    it('executes successful POST command and returns sanitized completed result', async () => {
      const client = createClient();

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ status: 200, message: 'Player listed' }),
      });

      const result = await client.command(
        '/market',
        {
          method: 'POST',
          body: { player: 42, price: 1000 },
          skipVersionCheck: true,
          delayMs: 0,
        },
        { token: 'custom-user-token', userId: 'user-42' }
      );

      expect(result.status).toBe('completed');
      expect(result.httpStatus).toBe(200);
      expect(fetchMock).toHaveBeenCalledTimes(1);

      const [calledUrl, fetchOptions] = fetchMock.mock.calls[0];
      expect(calledUrl).toBe('https://biwenger.as.com/api/v2/market');
      expect(fetchOptions.method).toBe('POST');
      expect(fetchOptions.headers['Authorization']).toBe('Bearer custom-user-token');
      expect(fetchOptions.headers['X-User']).toBe('user-42');
      expect(fetchOptions.body).toBe(JSON.stringify({ player: 42, price: 1000 }));
    });

    it('FAILS CLOSED immediately on HTTP 429 for commands (0 retries)', async () => {
      const client = createClient();

      fetchMock.mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      });

      await expect(
        client.command('/market', {
          method: 'POST',
          body: { player: 42 },
          skipVersionCheck: true,
          delayMs: 0,
        })
      ).rejects.toThrow(BiwengerRateLimitError);

      // Verify that NO retries occurred!
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(sleepMock).not.toHaveBeenCalled();
    });

    it('rejects unsupported command methods like GET', async () => {
      const client = createClient();

      await expect(
        client.command('/market', {
          method: 'GET' as any,
          skipVersionCheck: true,
          delayMs: 0,
        })
      ).rejects.toThrow(BiwengerMutationError);

      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('detects soft failure objects inside 200 response and throws BiwengerMutationError', async () => {
      const client = createClient();

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ status: 400, error: 'Insufficient funds' }),
      });

      await expect(
        client.command('/offers/1', {
          method: 'PUT',
          body: { status: 'accepted' },
          skipVersionCheck: true,
          delayMs: 0,
        })
      ).rejects.toThrow(BiwengerMutationError);
    });

    it('fails closed on non-2xx status and never reads response body', async () => {
      const client = createClient();
      const readBodySpy = vi.fn(async () => 'CANARY_MUTATION_BODY');

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 502,
        statusText: 'Bad Gateway',
        text: readBodySpy,
      });

      await expect(
        client.command('/market', {
          method: 'DELETE',
          skipVersionCheck: true,
          delayMs: 0,
        })
      ).rejects.toThrow(BiwengerMutationError);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(readBodySpy).not.toHaveBeenCalled();
    });
  });
});
