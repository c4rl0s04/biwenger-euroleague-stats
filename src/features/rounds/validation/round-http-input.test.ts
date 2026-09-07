import { describe, expect, it } from 'vitest';
import { readRoundHttpInput } from './round-http-input';
describe('existing Round input policy', () => {
  it('distinguishes absent and empty values and preserves first duplicates', () => {
    expect(readRoundHttpInput(new URLSearchParams())).toEqual({
      roundId: null,
      userId: null,
      mode: null,
    });
    expect(
      readRoundHttpInput(new URLSearchParams('roundId=&roundId=2&userId=007abc&mode=QUICK'))
    ).toEqual({ roundId: '', userId: '007abc', mode: 'QUICK' });
  });
  it.each(['0', '-1', '7abc', 'null', 'undefined', ' '])(
    'does not invent stricter ID semantics for %j',
    (value) => {
      const query = new URLSearchParams({ userId: value, roundId: value });
      expect(readRoundHttpInput(query)).toMatchObject({ userId: value, roundId: value });
    }
  );
});
