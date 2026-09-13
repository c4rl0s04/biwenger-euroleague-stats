import { expect, it } from 'vitest';
import type { Tournament, TournamentJson } from '../../models/tournaments';
import { mapTournamentDesktopDetail } from './tournament-detail.mapper';

function row(data: TournamentJson, status = 'finished'): Tournament {
  return { id: 7, name: null, type: 'playoff', status, data_json: JSON.stringify(data), data };
}

it.each([null, false, 0, '', true, 7, 'winner', [], {}])(
  'preserves conditional winner output for %j',
  (winner) => {
    const result = mapTournamentDesktopDetail(row({ winner }));
    expect(result.winner).toEqual(
      winner ? { href: '/user/undefined', name: null, iconUrl: null } : winner
    );
  }
);

it.each([
  [7, 'Ana', '/user/7'],
  [0, 'Ana', '/user/Ana'],
  ['', 'Ana', '/user/Ana'],
  [false, 'Ana', '/user/Ana'],
  [null, null, '/user/null'],
  ['07', 'Ana', '/user/07'],
  [[], 'Ana', '/user/'],
  [{ preserved: true }, 'Ana', '/user/[object Object]'],
])('preserves winner link fallback: %j', (id, name, href) => {
  expect(
    mapTournamentDesktopDetail(row({ winner: { id, name, icon: 'icons/7.png' } })).winner
  ).toEqual({ name, href, iconUrl: 'https://cdn.biwenger.com/icons/7.png' });
});

it('does not inspect active winner, rounds or configuration fields', () => {
  expect(
    mapTournamentDesktopDetail(
      row(
        {
          winner: { name: {}, icon: 12, id: { toString: null } },
          rounds: false,
        },
        'active'
      )
    )
  ).toEqual({ id: 7, name: null, type: 'playoff', status: 'active', winner: null });
});

it('projects only displayed fields and serializes without snapshot data', () => {
  const result = mapTournamentDesktopDetail(
    row({ winner: { id: 7, name: ['Ana', 2], icon: null }, rounds: { unused: true }, config: {} })
  );
  expect(Object.keys(result)).toEqual(['id', 'name', 'type', 'status', 'winner']);
  expect(JSON.parse(JSON.stringify(result))).toEqual(result);
  expect(result.winner).toEqual({ name: ['Ana', 2], iconUrl: null, href: '/user/7' });
});

it.each<TournamentJson>([{ name: {} }, { icon: 8 }, { id: { toString: null } }])(
  'preserves previously failing consumed fields: %j',
  (winner) => expect(() => mapTournamentDesktopDetail(row({ winner }))).toThrow(TypeError)
);
