import { describe, expect, it } from 'vitest';
import { parseSearchQuery } from './search-input';

describe('search input compatibility', () => {
  it.each([null, undefined, '', 'a', '  a  ', '\t\n'])('returns empty for %j', (value) => {
    expect(parseSearchQuery(value)).toBeNull();
  });

  it.each([' ab ', 'A B', '%_', "a' OR 1=1 --", '🏀', 'a'.repeat(10000)])(
    'preserves accepted text, wildcards and UTF-16 length: %s',
    (value) => {
      expect(parseSearchQuery(value)).toBe(value.trim());
    }
  );
});
