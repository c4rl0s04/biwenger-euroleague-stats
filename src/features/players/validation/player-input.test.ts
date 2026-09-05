import { describe, expect, it } from 'vitest';

import {
  parsePlayerCatalogueFilters,
  parsePlayerCatalogueSection,
  parsePlayerId,
  parsePlayerProfileSection,
} from './player-input';

describe('player input compatibility', () => {
  it('preserves the legacy Number-based player ID behavior', () => {
    expect(parsePlayerId('42')).toBe(42);
    expect(parsePlayerId('07')).toBe(7);
    expect(parsePlayerId('1e2')).toBe(100);
    expect(parsePlayerId('7.5')).toBe(7.5);
    expect(parsePlayerId('7abc')).toBeNull();
    expect(parsePlayerId('player')).toBeNull();
  });

  it('accepts only the existing catalogue and profile sections', () => {
    expect(parsePlayerCatalogueSection('insights')).toBe('insights');
    expect(parsePlayerCatalogueSection('squads')).toBe('squads');
    expect(parsePlayerCatalogueSection('market')).toBeNull();
    expect(parsePlayerProfileSection('performance')).toBe('performance');
    expect(parsePlayerProfileSection('market')).toBe('market');
    expect(parsePlayerProfileSection('history')).toBe('history');
    expect(parsePlayerProfileSection('stats')).toBeNull();
  });

  it('preserves trimming and string coercion for mobile catalogue filters', () => {
    expect(parsePlayerCatalogueFilters({ q: '  Mike James ', position: ' Base ' })).toEqual({
      query: 'Mike James',
      position: 'Base',
    });
    expect(parsePlayerCatalogueFilters(undefined)).toEqual({ query: '', position: '' });
  });
});
