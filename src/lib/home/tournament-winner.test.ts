import { describe, expect, it } from 'vitest';

import { parseTournamentWinner } from './tournament-winner';

describe('tournament winner parsing', () => {
  it('reads a winner without exposing the rest of the tournament payload', () => {
    expect(
      parseTournamentWinner(
        JSON.stringify({ winner: { id: 7, name: 'All Stars', icon: 'bear.png' }, rounds: [{}] })
      )
    ).toEqual({ id: '7', name: 'All Stars', icon: 'bear.png' });
  });

  it.each([null, '', '{invalid', '{}', '{"winner":null}'])(
    'returns no winner for absent or invalid data: %s',
    (value) => {
      expect(parseTournamentWinner(value)).toBeNull();
    }
  );
});
