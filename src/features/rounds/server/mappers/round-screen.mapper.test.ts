import { describe, expect, it } from 'vitest';
import { mapRoundOverview, mapRoundRows } from './round-screen.mapper';
import type { RoundCompleteViewModel } from '../../models/round-read';

describe('Rounds phone compatibility projection', () => {
  it('keeps first-array selection, first20, field precedence, zero IDs and formatting', () => {
    const rows = mapRoundRows(
      {
        first: Array.from({ length: 22 }, (_, i) => ({
          player_id: i,
          name: '',
          player_name: 'ignored',
          points: i,
          total_points: 99,
          team: '',
          position: 'ignored',
          password: 'fixture-private',
        })),
        second: [{ name: 'ignored' }],
      },
      '/player'
    );
    expect(rows).toHaveLength(20);
    expect(rows[0]).toEqual({
      key: '0',
      index: 1,
      title: '',
      subtitle: '',
      value: '0',
      href: '/player/0',
    });
    expect(JSON.stringify(rows)).not.toContain('fixture-private');
  });
  it('keeps null filtering, fallback numbering and legacy nonfinite display', () => {
    expect(
      mapRoundRows([
        null,
        false,
        0,
        { points: 'bad' },
        { round_name: 'Jornada 2', actual_points: 31 },
      ])
    ).toEqual([
      { key: '0', index: 1, title: 'Registro 1', value: 'NaN' },
      { key: '1', index: 2, title: 'Jornada 2' },
    ]);
    expect(mapRoundRows(null)).toEqual([]);
    expect(mapRoundRows({ first: [], second: [{ name: 'ignored' }] })).toEqual([]);
  });
  it('overview selects requested manager, not first standing, and retains missing defaults', () => {
    const lists = {
      rounds: [{ round_id: 7, round_name: 'Jornada 7' }],
      users: [],
      defaultRoundId: 7,
    };
    const data = {
      users: [
        { id: '1', points: 99 },
        {
          id: '2',
          points: 24,
          ideal_points: 30,
          coachRating: { efficiency: 80 },
          lineup: { players: [{ player_id: 4, name: 'Guard', points: 4 }] },
        },
      ],
    } as unknown as RoundCompleteViewModel;
    expect(mapRoundOverview(lists, '7', data, '2')).toMatchObject({
      description: 'Jornada 7',
      points: '24',
      ideal: '30',
      efficiency: '80%',
      playerCount: 1,
    });
    expect(mapRoundOverview(lists, 0, null)).toMatchObject({
      activeRoundId: 0,
      description: 'Jornada activa',
      points: '0',
      efficiency: '0%',
      rows: [],
    });
  });
});
