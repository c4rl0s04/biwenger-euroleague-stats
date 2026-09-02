import { describe, expect, it } from 'vitest';

import { parseTeamId, parseTeamProfileSection } from './team-profile-input';

describe('team profile input validation', () => {
  it('accepts positive integer identifiers and rejects ambiguous input', () => {
    expect(parseTeamId('42')).toBe(42);
    expect(parseTeamId(7)).toBe(7);
    expect(parseTeamId(' 42 ')).toBe(42);
    expect(parseTeamId('4.2')).toBeNull();
    expect(parseTeamId('0')).toBeNull();
    expect(parseTeamId('-1')).toBeNull();
    expect(parseTeamId('team')).toBeNull();
  });

  it('allows only the existing mobile Team Profile sections', () => {
    expect(parseTeamProfileSection('roster')).toBe('roster');
    expect(parseTeamProfileSection('matches')).toBe('matches');
    expect(parseTeamProfileSection('players')).toBeNull();
  });
});
