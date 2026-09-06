import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
const queries = vi.hoisted(() => ({ getOfficialPlayByPlay: vi.fn(), getOfficialShots: vi.fn() }));
vi.mock('../queries/official-game.query', () => queries);
vi.mock('@/features/matches/server', () => import('./official-game.service'));

import { GET as plays } from '../../../../app/api/matches/[id]/play-by-play/route';
import { GET as shots } from '../../../../app/api/matches/[id]/shots/route';
import type { OfficialPlayRow, OfficialShotRow } from '../queries/official-game.records';

const play: OfficialPlayRow = {
  sequence: 1,
  provider_play_number: 3,
  period: 1,
  minute: 2,
  marker_time: '08:00',
  play_type: '2FG',
  team_code: 'MAD',
  provider_player_code: 'P7',
  player_id: 7,
  player_name: 'Fixture Player',
  team_name: 'Fixture Team',
  dorsal: '07',
  home_score: 0,
  away_score: 2,
  comment: null,
  play_info: '',
};
const shot: OfficialShotRow = {
  annotation_number: 2,
  team_code: 'MAD',
  provider_player_code: 'P7',
  player_id: null,
  player_name: 'Fixture Player',
  action_id: '2FG',
  action: 'Made',
  points: 2,
  coordinate_x: -4,
  coordinate_y: 0,
  zone: null,
  is_fastbreak: false,
  is_second_chance: null,
  is_points_off_turnover: true,
  minute: 2,
  marker_time: '08:00',
  home_score: 0,
  away_score: 2,
  occurred_at: new Date('2026-09-01T18:02:00Z'),
};
const noStore = 'private, no-store, max-age=0, must-revalidate';

describe.each([
  { name: 'play-by-play', handler: plays, query: queries.getOfficialPlayByPlay, item: play },
  { name: 'shots', handler: shots, query: queries.getOfficialShots, item: shot },
])('official $name real HTTP/service/mapper contract', ({ name, handler, query, item }) => {
  beforeEach(() => vi.resetAllMocks());
  const request = (id = '42', filter = '') =>
    handler(new NextRequest(`http://localhost/api/matches/${id}/${name}${filter}`), {
      params: Promise.resolve({ id }),
    });

  it.each([null, new Date('2026-09-01T20:00:00Z')])(
    'preserves JSON and cache policy for finalization %s',
    async (finalizedAt) => {
      const legacy = {
        match: { id: 42, status: finalizedAt ? 'finished' : 'live' },
        scheduledAt: new Date('2026-09-01T18:00:00Z'),
        finalizedAt,
        items: [item],
      };
      query.mockResolvedValue({
        ...legacy,
        token: 'synthetic-secret-canary',
        match: { ...legacy.match, password: 'synthetic-secret-canary' },
        items: [{ ...item, raw_payload: { token: 'synthetic-secret-canary' } }],
      });
      const response = await request('42', '?period=2&teamCode=mad&playerId=7');
      expect(response.status).toBe(200);
      expect(response.headers.get('Cache-Control')).toBe(
        `public, max-age=${finalizedAt ? 3600 : 15}, stale-while-revalidate=60`
      );
      expect(await response.json()).toEqual({
        success: true,
        data: JSON.parse(JSON.stringify(legacy)),
      });
      expect(query).toHaveBeenCalledExactlyOnceWith(42, {
        period: 2,
        teamCode: 'MAD',
        playerId: 7,
      });
    }
  );

  it('preserves empty collections and nullable schedule', async () => {
    const data = {
      match: { id: 42, status: null },
      scheduledAt: null,
      finalizedAt: null,
      items: [],
    };
    query.mockResolvedValue(data);
    expect(await (await request()).json()).toEqual({ success: true, data });
  });

  it('preserves not-found behavior and private error caching', async () => {
    query.mockResolvedValue(null);
    const response = await request();
    expect(response.status).toBe(404);
    expect(response.headers.get('Cache-Control')).toBe(noStore);
    expect(await response.json()).toEqual({
      success: false,
      error: `Match or official ${name} not found.`,
    });
  });

  it('rejects malformed IDs without querying', async () => {
    const response = await request('7abc');
    expect(response.status).toBe(400);
    expect(response.headers.get('Cache-Control')).toBe(noStore);
    expect(query).not.toHaveBeenCalled();
  });

  it('preserves unexpected-error behavior', async () => {
    query.mockRejectedValue(new Error('synthetic read failure'));
    const response = await request();
    expect(response.status).toBe(500);
    expect(response.headers.get('Cache-Control')).toBe(noStore);
    expect(await response.json()).toEqual({ success: false, error: 'synthetic read failure' });
  });
});
