import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/lib/db/client', () => ({ pool: {} }));
import type { Pool } from 'pg';
import { getPreseasonOutcomes } from './outcomes.query';

type Rows = Record<string, unknown>[];

function fakeConnection(data: {
  status?: string;
  rsComplete?: boolean | null;
  managers?: Rows;
  teams?: Rows;
  leaders?: Rows;
}) {
  const query = vi.fn(async (text: string, params: unknown[]) => {
    expect(params).toEqual(['2026-27']);
    if (text.startsWith('SELECT status FROM seasons'))
      return { rows: data.status ? [{ status: data.status }] : [] };
    if (text.includes("phase_code = 'RS'"))
      return { rows: [{ complete: data.rsComplete ?? null }] };
    if (text.includes('FROM user_seasons us')) return { rows: data.managers ?? [] };
    if (text.includes('official_team_standings')) return { rows: data.teams ?? [] };
    return { rows: data.leaders ?? [] };
  });
  return { connection: { query } as unknown as Pool, query };
}

describe('getPreseasonOutcomes', () => {
  it('reports provisional results for an active season and leaves the champion pending', async () => {
    const { connection } = fakeConnection({
      status: 'active',
      rsComplete: false,
      managers: [
        { id: 'u1', position: 1, rounds: 5 },
        { id: 'u2', position: 1, rounds: 5 },
      ],
      teams: [{ id: '10', position: 1 }],
      leaders: [{ id: '7' }, { id: '9' }],
    });
    const outcomes = await getPreseasonOutcomes('2026-27', connection);
    expect(outcomes['player-total-points']).toEqual({
      kind: 'single',
      status: 'provisional',
      leaderIds: ['7', '9'],
    });
    expect(outcomes['manager-ranking']).toEqual({
      kind: 'ranking',
      status: 'provisional',
      standings: [
        { id: 'u1', position: 1 },
        { id: 'u2', position: 1 },
      ],
    });
    expect(outcomes['team-ranking'].status).toBe('provisional');
    expect(outcomes['team-champion']).toEqual({ kind: 'single', status: 'pending', leaderIds: [] });
  });

  it('finalises the team ranking once every regular-season game is played', async () => {
    const { connection } = fakeConnection({
      status: 'active',
      rsComplete: true,
      teams: [{ id: '10', position: 1 }],
    });
    const outcomes = await getPreseasonOutcomes('2026-27', connection);
    expect(outcomes['team-ranking'].status).toBe('final');
    expect(outcomes['player-best-round'].status).toBe('pending');
  });

  it('marks everything with data final once the season is no longer active', async () => {
    const { connection } = fakeConnection({
      status: 'archived',
      managers: [{ id: 'u1', position: 1, rounds: 34 }],
      leaders: [{ id: '7' }],
    });
    const outcomes = await getPreseasonOutcomes('2026-27', connection);
    expect(outcomes['manager-round-wins'].status).toBe('final');
    expect(outcomes['manager-ranking'].status).toBe('final');
    expect(outcomes['team-ranking'].status).toBe('pending');
  });

  it('keeps the manager ranking pending before any round is played', async () => {
    const { connection } = fakeConnection({
      status: 'active',
      managers: [{ id: 'u1', position: 1, rounds: 0 }],
    });
    expect((await getPreseasonOutcomes('2026-27', connection))['manager-ranking'].status).toBe(
      'pending'
    );
  });
});
