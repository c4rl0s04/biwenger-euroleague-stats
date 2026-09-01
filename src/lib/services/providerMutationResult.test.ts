import { describe, expect, it } from 'vitest';

import { assertProviderMutationSucceeded } from './providerMutationResult';

const CANARY_TOKEN = 'provider-canary-token-never-expose';

describe('provider mutation result boundary', () => {
  it('accepts successful provider results without returning them', () => {
    expect(
      assertProviderMutationSucceeded({
        status: 200,
        token: CANARY_TOKEN,
        privateProviderPayload: { authorization: CANARY_TOKEN },
      })
    ).toBeUndefined();
  });

  it('replaces provider errors with a fixed application error', () => {
    expect(() =>
      assertProviderMutationSucceeded({ status: 401, error: `Bearer ${CANARY_TOKEN}` })
    ).toThrow('Biwenger no pudo completar la operación solicitada.');

    try {
      assertProviderMutationSucceeded({ error: CANARY_TOKEN });
    } catch (error) {
      expect(String(error)).not.toContain(CANARY_TOKEN);
    }
  });
});
