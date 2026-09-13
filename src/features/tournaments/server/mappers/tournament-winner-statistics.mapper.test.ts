import { expect, it } from 'vitest';
import type { Tournament, TournamentJson } from '../../models/tournaments';
import { mapGlobalTournamentStatistics } from './tournament-statistics.mapper';

function tournament(winner: TournamentJson, id = 1): Tournament {
  return {
    id,
    name: 'Cup',
    status: 'finished',
    type: 'playoff',
    data: { winner },
    data_json: null,
  };
}
const winners = (...entries: Tournament[]) =>
  mapGlobalTournamentStatistics(entries, [], []).hallOfFame;

it.each<TournamentJson>(['01', 7, true, [], ['01'], { historical: true }])(
  'normalizes identity without changing its original link or grouping key: %j',
  (id) => {
    const result = winners(tournament({ id, name: 'Ana', icon: null }));
    expect(result).toHaveLength(1);
    expect(result[0].href).toBe(`/user/${id}`);
    expect(String(result[0].id)).toBe(String(id));
    expect(['string', 'number']).toContain(typeof result[0].id);
    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
  }
);

it.each<TournamentJson>([null, false, 0, ''])('still ignores falsy winner IDs: %j', (id) =>
  expect(winners(tournament({ id, name: {} }))).toEqual([])
);

it.each<TournamentJson>([3, '3', '03', true, [3], false, null])(
  'retains the palette numeric coercion: %j',
  (colorIndex) => {
    const result = winners(tournament({ id: '01', name: 'Ana', colorIndex }));
    expect(result[0].colorIndex).toBe(Number(colorIndex || 0));
  }
);

it('never validates duplicate-winner fields that the old calculation ignored', () => {
  const result = winners(
    tournament({ id: '01', name: 'First', color_index: 4 }),
    tournament({ id: '01', name: {}, icon: 5, colorIndex: {} }, 2)
  );
  expect(result).toEqual([
    {
      id: '01',
      href: '/user/01',
      name: 'First',
      icon: undefined,
      colorIndex: 4,
      titles: 2,
      tournaments: ['Cup', 'Cup'],
    },
  ]);
});

it('retains supported text children and excludes unused snapshot keys', () => {
  const result = winners(
    tournament({ id: '01', name: ['Ana', 2], icon: false, other: { nested: true } })
  );
  expect(result[0]).toEqual({
    id: '01',
    href: '/user/01',
    name: ['Ana', 2],
    icon: null,
    colorIndex: 0,
    titles: 1,
    tournaments: ['Cup'],
  });
});

it.each<TournamentJson>([
  { id: '01', name: {} },
  { id: '01', icon: 7 },
  { id: '01', colorIndex: {} },
])('keeps consumed non-renderable values on the error path: %j', (winner) =>
  expect(() => winners(tournament(winner))).toThrow(TypeError)
);

it('preserves the finished-only legacy winner fallback without unsafe assertions', () => {
  const entry = { ...tournament(null), winner: { id: '01', name: 'Legacy' } };
  expect(winners(entry)[0].name).toBe('Legacy');
  expect(winners({ ...entry, status: 'active' })).toEqual([]);
});
