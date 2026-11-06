import { describe, expect, it } from 'vitest';
import { CONFIG } from '../config';

describe('browser-safe basketball constants', () => {
  it('contains no deployment credentials or season selection', () => {
    expect(Object.keys(CONFIG).sort()).toEqual(['ENDPOINTS', 'POSITIONS']);
    expect(CONFIG.POSITIONS[1]).toBe('Base');
    expect(CONFIG.ENDPOINTS.BIWENGER.LEAGUE_STANDINGS('123')).toBe('/league/123?fields=standings');
  });
});
