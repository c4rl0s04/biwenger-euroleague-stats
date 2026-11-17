import { describe, expect, it } from 'vitest';
import { parseSeasonLifecycleArgs } from './season-lifecycle-options';

describe('explicit season lifecycle inputs', () => {
  it('creates a season without an existing active season or ingestion credential', () => {
    expect(
      parseSeasonLifecycleArgs([
        'create-next',
        '--season=2027-28',
        '--league=123',
        '--start-date=2027-09-01',
      ])
    ).toMatchObject({
      season: '2027-28',
      name: 'EuroLeague Fantasy 2027-28',
      euroleagueCode: 'E2027',
      league: '123',
    });
  });
  it('requires an explicit freeze target', () => {
    expect(() => parseSeasonLifecycleArgs(['freeze'])).toThrow();
    expect(parseSeasonLifecycleArgs(['freeze', '--season=2025-26'])).toMatchObject({
      season: '2025-26',
    });
  });
  it.each([
    ['--start-date=2027-02-30'],
    ['--league=0'],
    ['--euroleague-code=E2026'],
    ['--season=2027-29'],
  ])('rejects invalid metadata %s', ([invalid]) => {
    const input = ['create-next', '--season=2027-28', '--league=123', '--start-date=2027-09-01'];
    const key = invalid.split('=')[0];
    expect(() =>
      parseSeasonLifecycleArgs([...input.filter((arg) => !arg.startsWith(key + '=')), invalid])
    ).toThrow();
  });
});
