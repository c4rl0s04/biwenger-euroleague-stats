import { describe, expect, it } from 'vitest';

import {
  MatchesInputError,
  parseOfficialGameFilters,
  parseRoundId,
} from './match-input';

describe('match input validation', () => {
  it('normalizes valid HTTP filters at the boundary', () => {
    expect(parseOfficialGameFilters({ period: '2', playerId: '7', teamCode: ' mad ' })).toEqual({
      period: 2,
      playerId: 7,
      teamCode: 'MAD',
    });
  });

  it('rejects invalid HTTP filters and treats invalid page selection as absent', () => {
    expect(() => parseOfficialGameFilters({ playerId: 'oops' })).toThrow(MatchesInputError);
    expect(() => parseOfficialGameFilters({ teamCode: '<script>' })).toThrow(MatchesInputError);
    expect(parseRoundId('oops')).toBeNull();
  });
});
