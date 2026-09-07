import { describe, expect, it } from 'vitest';
import { mapManagerProfileRows, mapManagerProfileTournaments } from './manager-profile.mapper';
import type { ManagerTournamentParticipation } from '@/features/tournaments/public';

describe('Manager Profile mobile compatibility projection', () => {
  it('uses first array even when empty, never falling through to players', () => {
    expect(mapManagerProfileRows({ top_rising: [], players: [{ name: 'Hidden' }] })).toEqual([]);
    expect(
      mapManagerProfileRows({
        name: 'Manager',
        last_transfers: [{ player_name: 'Transfer' }],
        other: [{ name: 'Other' }],
      })[0].title
    ).toBe('Transfer');
  });
  it('filters nonobjects before applying first20 and preserves order', () => {
    const rows = mapManagerProfileRows([
      null,
      false,
      'discard',
      ...Array.from({ length: 25 }, (_, id) => ({ id, name: `P${id}` })),
    ]);
    expect(rows).toHaveLength(20);
    expect(rows.map((row) => row.title)).toEqual(Array.from({ length: 20 }, (_, id) => `P${id}`));
    expect(rows[19].index).toBe(20);
  });
  it('preserves key precedence, zero/empty values, formatting, links and excludes extra fields', () => {
    const result = mapManagerProfileRows(
      [
        {
          name: '',
          player_name: 'ignored',
          team: '',
          description: 'ignored',
          points: 0,
          price: 999,
          player_id: 0,
          user_id: 2,
          id: 3,
          token: 'synthetic-only',
        },
      ],
      '/player'
    );
    expect(result).toEqual([
      { key: '0', index: 1, title: '', subtitle: '', value: '0', href: '/player/0' },
    ]);
    expect(JSON.stringify(result)).not.toContain('synthetic-only');
  });
  it('retains fallback labels, NaN display and absent links', () => {
    expect(mapManagerProfileRows([{ points: 'invalid' }])).toEqual([
      { key: '0', index: 1, title: 'Registro 1', value: Number.NaN.toLocaleString('es-ES') },
    ]);
    expect(
      mapManagerProfileRows([{ name: 'P', price: '1234.5', user_id: '007' }], '/player')[0]
    ).toEqual({
      key: '007',
      index: 1,
      title: 'P',
      value: Number('1234.5').toLocaleString('es-ES'),
      href: '/player/007',
    });
  });
  it.each([null, undefined, 0, 'text', false])('returns no rows for primitive %s', (input) => {
    expect(mapManagerProfileRows(input)).toEqual([]);
  });
});

describe('Manager Profile tournament allowlist', () => {
  const base = {
    tournament_id: 1,
    tournament_name: 'Cup',
    tournament_type: 'playoff',
    tournament_status: 'active',
    position: null,
    points: null,
    won: 0,
    drawn: 0,
    lost: 0,
    group_name: null,
  };
  it.each([null, undefined, 'Final', 0, false, ['Final'], { label: 'Final' }])(
    'preserves valid phase %j and drops unrelated fields',
    (phase_name) => {
      const result = mapManagerProfileTournaments([
        {
          ...base,
          phase_name,
          token: 'synthetic-only',
          data_json: 'unused',
        } as ManagerTournamentParticipation,
      ]);
      expect(result).toEqual([{ ...base, phase_name }]);
      expect(JSON.stringify(result)).not.toContain('synthetic-only');
    }
  );
  it.each([() => 'synthetic-secret', Symbol('synthetic-secret'), BigInt(1), Object.prototype])(
    'rejects nonserializable phase without payload exposure',
    (phase_name) => {
      expect(() =>
        mapManagerProfileTournaments([
          { ...base, phase_name } as unknown as ManagerTournamentParticipation,
        ])
      ).toThrow('Manager tournament phase is not serializable');
    }
  );
});
