import { createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import type { Tournament, TournamentJson } from '../../models/tournaments';
import { mapTournamentPhoneDetail } from './tournament-detail.mapper';

const row = (data: TournamentJson): Tournament => ({
  id: 7,
  name: null,
  type: 'league',
  status: 'finished',
  data_json: JSON.stringify(data),
  data,
});
const banner = (winner: unknown, name: unknown) =>
  renderToStaticMarkup(
    createElement(
      'div',
      null,
      (winner && createElement('strong', null, name as ReactNode)) as ReactNode
    )
  );

it.each([null, false, 0, '', true, 8, 'historical', [], {}])(
  'preserves winner presence and short-circuit rendering: %j',
  (winner) => {
    const result = mapTournamentPhoneDetail(row({ winner }));
    const name = result.winner ? result.winner.name : undefined;
    expect(banner(result.winner, name)).toBe(banner(winner, undefined));
  }
);

it.each([null, false, 0, '', 'Ana', true, 8, [], ['Ana', 12, null, [false, 'Luis']]])(
  'preserves React text rendering: %j',
  (name) => {
    const result = mapTournamentPhoneDetail(
      row({ winner: { name, icon: { unused: true } }, rounds: false })
    );
    expect(result.winner).toEqual({ name });
    expect(banner(result.winner, result.winner && result.winner.name)).toBe(banner(true, name));
    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
    expect(Object.keys(result)).toEqual(['id', 'name', 'type', 'status', 'winner']);
    expect(result).not.toHaveProperty('data');
    expect(result).not.toHaveProperty('data_json');
  }
);

it.each([{ invalid: 'object' }, ['valid', { invalid: true }]])(
  'keeps non-renderable consumed names on the error path: %j',
  (name) => {
    expect(() => banner(true, name)).toThrow();
    expect(() => mapTournamentPhoneDetail(row({ winner: { name } }))).toThrow(TypeError);
  }
);

it.each([null, false, 0, 'history', [], { unrelated: 'kept internally' }])(
  'ignores unused historical snapshot shapes: %j',
  (data) =>
    expect(mapTournamentPhoneDetail(row(data))).toEqual({
      id: 7,
      name: null,
      type: 'league',
      status: 'finished',
      winner: null,
    })
);
