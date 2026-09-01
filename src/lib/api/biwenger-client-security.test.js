import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const CANARY_PROVIDER_BODY = 'provider-body-with-bearer-canary-token';

describe('Biwenger client error redaction', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.stubEnv('BIWENGER_TOKEN', 'synthetic-server-token');
    vi.stubEnv('BIWENGER_LEAGUE_ID', '123');
    vi.stubEnv('BIWENGER_USER_ID', '456');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('does not read, throw, or log a provider error body', async () => {
    const readBody = vi.fn(async () => CANARY_PROVIDER_BODY);
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 500,
      statusText: 'Provider failure',
      text: readBody,
    }));
    vi.stubGlobal('fetch', fetchMock);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const { biwengerFetch } = await import('./biwenger-client.js');
    const request = biwengerFetch('/market', {
      method: 'POST',
      body: { type: 'sell', player: 1, price: 1000 },
      customToken: 'synthetic-user-token',
      customUserId: '42',
      skipVersionCheck: true,
      retries: 0,
    });
    const rejection = expect(request).rejects.toThrow('Biwenger API Error: 500 Provider failure');

    await vi.runAllTimersAsync();
    await rejection;

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(readBody).not.toHaveBeenCalled();
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(CANARY_PROVIDER_BODY);
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain('synthetic-user-token');
  });
});
