import { describe, expect, it, vi } from 'vitest';
import {
  mapTournament,
  mapTournamentFixture,
  mapTournamentStanding,
  mapManagerTournament,
} from './tournament.mapper';
import { mapManagerParticipation } from './manager-participation.mapper';
import { baselineParticipation } from './__tests__/participation-baseline';
import type {
  ManagerTournamentRecord,
  TournamentFixtureRecord,
  TournamentStandingRecord,
} from '../queries/tournament.records';

import type { TournamentJson } from '../../models/tournaments';

const participation = (data_json: TournamentJson): ManagerTournamentRecord => ({
  tournament_id: 1,
  tournament_name: 'Cup',
  tournament_type: 'playoff',
  tournament_status: 'active',
  data_json,
  position: 0,
  points: 0,
  won: 0,
  drawn: 0,
  lost: 0,
  phase_name: null,
  group_name: null,
});
const fixture = (
  id: string | number,
  score: string | number | null,
  opponent: string | number | null
) => ({ home: { id, score }, away: { id: 2, score: opponent } });

describe('Tournaments mapping compatibility', () => {
  it.each([
    'null',
    'false',
    '0',
    '"text"',
    '[]',
    '{"winner":{"id":7},"extra":[1,null,{"nested":true}]}',
  ])('retains the complete historical document %s', (data_json) => {
    const row = { id: 1, name: null, type: null, status: null, data_json, excluded: 'record-only' };
    expect(mapTournament(row)).toEqual({
      id: 1,
      name: null,
      type: null,
      status: null,
      data_json,
      data: JSON.parse(data_json),
    });
  });
  it('keeps empty documents null and throws for malformed list/detail JSON', () => {
    expect(
      mapTournament({ id: 1, name: 'A', type: null, status: null, data_json: '' }).data
    ).toBeNull();
    expect(() =>
      mapTournament({ id: 1, name: 'A', type: null, status: null, data_json: '{' })
    ).toThrow(SyntaxError);
  });
  it('allowlists every selected standing and fixture field, preserving nullable scalars', () => {
    const standing = {
      id: 1,
      season_id: '2026-27',
      tournament_id: 2,
      phase_name: null,
      group_name: null,
      user_id: '07',
      position: null,
      points: 0,
      won: 0,
      lost: 1,
      drawn: 0,
      scored: 2,
      against: 3,
      user_name: null,
      user_icon: null,
      user_color: '4x',
      extra: 'excluded',
    };
    const { extra: _ignored, ...expected } = standing;
    expect(mapTournamentStanding(standing)).toEqual({ ...expected, user_color: 4 });
    const game = {
      id: 1,
      tournament_id: 2,
      phase_id: null,
      round_name: null,
      round_id: null,
      group_name: null,
      home_user_id: '07',
      away_user_id: null,
      home_score: null,
      away_score: 0,
      date: 12345,
      status: null,
      phase_name: 'Final',
      phase_type: 'final',
      home_user_name: null,
      home_user_icon: null,
      home_user_color: undefined,
      away_user_name: null,
      away_user_icon: null,
      away_user_color: '2',
      extra: 'excluded',
    };
    const { extra: _ignoredGame, ...expectedGame } = game;
    expect(mapTournamentFixture(game)).toEqual({
      ...expectedGame,
      home_user_color: null,
      away_user_color: 2,
    });
    // Legacy code only parses color fields, not scores or standings totals.
    expect(
      mapTournamentStanding({ ...standing, points: '3' } as unknown as TournamentStandingRecord)
        .points
    ).toBe('3');
    expect(
      mapTournamentFixture({ ...game, home_score: '4' } as unknown as TournamentFixtureRecord)
        .home_score
    ).toBe('4');
  });
  it.each([0, '0', null, '12x', 'invalid'])(
    'retains participation truthiness and parseInt for %j',
    (value) => {
      const result = mapManagerTournament({
        ...participation(null),
        position: value,
        points: value,
        won: value,
      });
      expect(result.position).toBe(value ? parseInt(String(value)) : null);
      expect(result.points).toBe(value ? parseInt(String(value)) : null);
      expect(result.won).toBe(value ? parseInt(String(value)) : 0);
    }
  );
  it('matches the frozen legacy playoff algorithm across valid and malformed documents', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const documents: TournamentJson[] = [
      { winner: { id: 7 } },
      { rounds: [{ type: 'final', fixtures: [fixture(7, 5, 2)] }] },
      null,
      '',
      '{',
      'null',
      'false',
      '4',
      '[]',
      '{}',
      JSON.stringify({ winner: { id: 7 } }),
      JSON.stringify({ winner: { id: '7' } }),
      JSON.stringify({ rounds: [{ type: 'final', fixtures: [fixture(7, 5, 2)] }] }),
      JSON.stringify({ rounds: [{ type: 'final', fixtures: [fixture('7', 5, 2)] }] }),
      JSON.stringify({ rounds: [{ type: 'final', fixtures: [fixture(7, '10', '2')] }] }),
      JSON.stringify({
        rounds: [{ type: 'semiFinal', fixtures: [fixture(7, 5, 2)] }, null],
        winner: { id: 7 },
      }),
      JSON.stringify({ rounds: [{ type: 'final', fixtures: { not: 'array' } }] }),
      JSON.stringify({
        rounds: [{ type: 'final', fixtures: [{ home: { id: 7, score: 5 }, away: null }] }],
      }),
    ];
    for (const type of [
      'final',
      'semiFinal',
      'quarterFinal',
      'roundOf16',
      'roundOf32',
      'custom',
      'toString',
      '__proto__',
      'constructor',
    ]) {
      for (const score of [null, 0, 2, 5, '2'])
        documents.push(JSON.stringify({ rounds: [{ type, fixtures: [fixture(7, score, 2)] }] }));
    }
    for (const userId of [7, '07', '7abc'])
      for (const data_json of documents) {
        const row = mapManagerTournament(participation(data_json));
        expect(mapManagerParticipation([row], userId)).toEqual(
          baselineParticipation([row], userId)
        );
      }
    log.mockRestore();
  });
  it('removes only the document from league participation and preserves duplicate rows', () => {
    const row = mapManagerTournament({ ...participation('{'), tournament_type: 'league' });
    const { data_json: _ignored, ...expected } = row;
    expect(mapManagerParticipation([row, row], 7)).toEqual([expected, expected]);
  });
});
