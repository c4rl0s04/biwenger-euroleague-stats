import { expect, it } from 'vitest';
import type { TournamentFixture, TournamentJson } from '../../models/tournaments';
import { mapTournamentBracket } from './tournament-bracket.mapper';
import { legacyBracket } from './__tests__/bracket-baseline';

function fixture(patch: Partial<TournamentFixture> = {}): TournamentFixture {
  return {
    id: 1,
    tournament_id: 7,
    phase_id: 1,
    phase_type: 'semifinal',
    phase_name: 'Semi',
    round_name: 'R1',
    round_id: 2,
    group_name: null,
    date: null,
    status: 'finished',
    home_user_id: '01',
    away_user_id: '02',
    home_user_name: 'A',
    away_user_name: 'B',
    home_user_icon: null,
    away_user_icon: null,
    home_user_color: null,
    away_user_color: null,
    home_score: 8,
    away_score: 7,
    ...patch,
  };
}
const matchKeys = [
  'id',
  'isTwoLegged',
  'isFinished',
  'winner',
  'home_user_id',
  'home_user_name',
  'home_user_icon',
  'home_user_color',
  'away_user_id',
  'away_user_name',
  'away_user_icon',
  'away_user_color',
  'home_leg1',
  'away_leg1',
  'home_leg2',
  'away_leg2',
  'home_total',
  'away_total',
] as const;
function compare(
  snapshot: TournamentJson,
  fixtures: TournamentFixture[],
  twoLegged: boolean,
  twoLeggedFinal: boolean
) {
  const rules = { twoLegged, twoLeggedFinal };
  const original = legacyBracket({ data: snapshot }, fixtures, rules).map((phase) => ({
    type: phase.type ?? null,
    name: phase.name,
    matches: phase.matches.map((match: Record<string, unknown>) =>
      Object.fromEntries(matchKeys.filter((key) => key in match).map((key) => [key, match[key]]))
    ),
  }));
  const before = JSON.stringify({ snapshot, fixtures });
  const result = mapTournamentBracket(snapshot, fixtures, rules);
  expect(result).toEqual(original);
  expect(JSON.parse(JSON.stringify(result))).toEqual(result);
  expect(JSON.stringify({ snapshot, fixtures })).toBe(before);
  for (const round of result) {
    expect(Object.keys(round)).toEqual(['type', 'name', 'matches']);
    for (const match of round.matches)
      expect(
        Object.keys(match).every((key) => matchKeys.includes(key as (typeof matchKeys)[number]))
      ).toBe(true);
  }
}

it('matches the frozen original across deterministic score, pairing, phase and completion combinations', () => {
  let seed = 41;
  const next = (max: number) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed % max;
  };
  const scores = [null, 0, 7, 8, -1];
  const users = [null, '01', '02', '03'];
  const types = ['semifinal', 'final', 'quarterfinal'];
  for (let sample = 0; sample < 100; sample++) {
    const fixtures = Array.from({ length: 6 }, (_, i) => {
      const phase = next(3);
      return fixture({
        id: i + 1,
        phase_id: phase + 1,
        phase_type: types[phase],
        home_user_id: users[next(users.length)],
        away_user_id: users[next(users.length)],
        home_score: scores[next(scores.length)],
        away_score: scores[next(scores.length)],
      });
    });
    for (const twoLegged of [false, true])
      for (const twoLeggedFinal of [false, true])
        compare(null, fixtures, twoLegged, twoLeggedFinal);
  }
});

it('preserves first matching round fallback, missing phases and lexical match ordering', () => {
  const snapshot = {
    rounds: [
      { round: { name: 'R1' }, type: 'semifinal' },
      { round: { name: 'R1' }, type: 'final' },
    ],
  };
  compare(
    snapshot,
    [
      fixture({ id: 2, phase_id: null, phase_type: null }),
      fixture({ id: 10, phase_id: null, phase_type: null }),
    ],
    false,
    false
  );
  const result = mapTournamentBracket(snapshot, [fixture({ phase_id: null, phase_type: null })], {
    twoLegged: false,
    twoLeggedFinal: false,
  });
  expect(result[0].type).toBe('semifinal');
});

it.each([null, false, 0, 'history', [], { rounds: null }])(
  'preserves absent snapshot rounds: %j',
  (snapshot) => {
    compare(snapshot, [fixture({ phase_id: null, phase_type: null })], true, false);
  }
);

it.each([
  { rounds: false },
  { rounds: {} },
  { rounds: [null] },
  { rounds: [{ round: { name: 'R1' }, type: 7 }] },
])('only inspects malformed fallback when needed: %j', (snapshot) => {
  compare(snapshot, [fixture()], false, false);
  compare(snapshot, [], true, true);
  const fixtures = [fixture({ phase_id: null, phase_type: null })];
  const rules = { twoLegged: false, twoLeggedFinal: false };
  expect(() => legacyBracket({ data: snapshot }, fixtures, rules)).toThrow();
  expect(() => mapTournamentBracket(snapshot, fixtures, rules)).toThrow(TypeError);
});

it('retains the historical prototype-key grouping error instead of changing grouping policy', () => {
  const snapshot = { rounds: [{ round: { name: 'R1' }, type: '__proto__' }] };
  const fixtures = [fixture({ phase_id: null, phase_type: null })];
  const rules = { twoLegged: false, twoLeggedFinal: false };
  expect(() => legacyBracket({ data: snapshot }, fixtures, rules)).toThrow();
  expect(() => mapTournamentBracket(snapshot, fixtures, rules)).toThrow();
});
