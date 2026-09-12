import { describe, expect, it } from 'vitest';
import { mapTournamentPlayoffRules } from './tournament-playoff-rules.mapper';
import type { TournamentJson } from '../../models/tournaments';

describe('Tournament playoff rules projection', () => {
  it.each<TournamentJson>([
    null,
    false,
    0,
    'history',
    [],
    {},
    { config: null },
    { config: { playoff: [] } },
  ])('retains disabled defaults for heterogeneous snapshots: %j', (snapshot) => {
    expect(mapTournamentPlayoffRules(snapshot)).toEqual({
      twoLegged: false,
      twoLeggedFinal: false,
    });
  });
  it.each(['twoLegged', 'twolegged'])('recognizes literal true at %s', (key) => {
    expect(mapTournamentPlayoffRules({ config: { playoff: { [key]: true } } })).toEqual({
      twoLegged: true,
      twoLeggedFinal: false,
    });
  });
  it.each(['twoLeggedFinal', 'twoleggedfinal'])('recognizes literal true at %s', (key) => {
    expect(mapTournamentPlayoffRules({ config: { playoff: { [key]: true } } })).toEqual({
      twoLegged: false,
      twoLeggedFinal: true,
    });
  });
  it.each<TournamentJson>([false, 'true', 1, null, [], {}])(
    'does not coerce truthy or nonboolean flags: %j',
    (value) => {
      expect(
        mapTournamentPlayoffRules({
          config: { playoff: { twoLegged: value, twoLeggedFinal: value } },
        })
      ).toEqual({ twoLegged: false, twoLeggedFinal: false });
    }
  );
  it('preserves either-spelling OR and only emits the two boolean fields', () => {
    const snapshot = {
      secret: 'synthetic excluded',
      config: {
        playoff: { twoLegged: false, twolegged: true, twoLeggedFinal: true, unknown: 'excluded' },
      },
    };
    expect(mapTournamentPlayoffRules(snapshot)).toEqual({ twoLegged: true, twoLeggedFinal: true });
    expect(snapshot.config.playoff.unknown).toBe('excluded');
  });
});
