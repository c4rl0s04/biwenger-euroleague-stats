import { expect, it } from 'vitest';
import { HOME_ACTIVITY_FILTERS } from '../models/contracts';
import { normalizeHomeActivityFilter } from './activity-filter';
it('preserves all filter values and the bonuses alias without trimming or coercion', () => {
  for (const value of HOME_ACTIVITY_FILTERS) expect(normalizeHomeActivityFilter(value)).toBe(value);
  expect(normalizeHomeActivityFilter('bonuses')).toBe('rounds');
  for (const value of [undefined, null, '', 'ALL', ' all ', ['all'], 1])
    expect(normalizeHomeActivityFilter(value)).toBeNull();
});
