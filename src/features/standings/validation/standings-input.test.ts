import { expect, it } from 'vitest';
import { parseStandingsSearchParams } from './standings-input';

it.each([
  ['', 'total_points', 'desc'],
  ['sort=name&dir=asc', 'name', 'asc'],
  ['sort=&dir=', '', 'desc'],
  ['sort=unknown&dir=ASC', 'unknown', 'desc'],
  ['sort=toString&dir=desc', 'toString', 'desc'],
  ['sort=position&sort=name&dir=asc&dir=desc', 'position', 'asc'],
  ['sort=%20name%20&dir=sideways', ' name ', 'desc'],
])('preserves query parsing for %s', (query, sortBy, direction) => {
  expect(parseStandingsSearchParams(new URLSearchParams(query))).toEqual({ sortBy, direction });
});
