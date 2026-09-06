import { describe, it, expect } from 'vitest';
import { assertFixtureTarget } from './safety.mjs';
const env = { BIWENGER_E2E_DISPOSABLE: 'true' };
describe('fixture database safety', () => {
  it('accepts only explicit disposable loopback targets', () => {
    expect(
      assertFixtureTarget('postgres://fixture@127.0.0.1:15432/biwenger_e2e_123', env).hostname
    ).toBe('127.0.0.1');
  });
  it.each([
    'postgres://fixture@production.example:5432/biwenger_e2e_123',
    'postgres://fixture@127.0.0.1:5432/biwenger',
    'postgres://fixture@127.0.0.1/biwenger_e2e_123',
    'postgres://fixture@127.0.0.1:5432/biwenger_e2e_123?host=production.example',
    'https://fixture@127.0.0.1:5432/biwenger_e2e_123',
  ])('rejects unsafe target %s', (url) => expect(() => assertFixtureTarget(url, env)).toThrow());
  it('requires explicit disposable marker', () => {
    expect(() =>
      assertFixtureTarget('postgres://fixture@127.0.0.1:15432/biwenger_e2e_123', {})
    ).toThrow();
  });
});
