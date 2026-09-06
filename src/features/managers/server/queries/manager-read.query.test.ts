import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const fake = vi.hoisted(() => ({ query: vi.fn(), season: vi.fn() }));
vi.mock('@/lib/db/client', () => ({ db: { query: fake.query } }));
vi.mock('@/lib/db/season-context', () => ({ resolveReadSeasonId: fake.season }));
import { readManagerSeasonStats } from './manager-stats.query';
import { readManagerSquad, readManagerPoints } from './manager-squad.query';

beforeEach(() => {
  vi.clearAllMocks();
  fake.season.mockResolvedValue('2026-27');
});
describe('Manager SQL contracts', () => {
  it('preserves the five-query known-manager sequence and bound name/season arguments', async () => {
    fake.query
      .mockResolvedValueOnce({ rows: [{ name: 'Manager A', icon: null, color_index: 0 }] })
      .mockResolvedValueOnce({ rows: [{ total_points: '8' }] })
      .mockResolvedValueOnce({ rows: [{ best_position: '1' }] })
      .mockResolvedValueOnce({ rows: [{ purchases: '1' }] })
      .mockResolvedValueOnce({ rows: [{ player_id: 3, price: '10' }] });
    const data = await readManagerSeasonStats('7abc');
    expect(fake.query.mock.calls.map((call) => call[1])).toEqual([
      ['7abc', '2026-27'],
      ['7abc', '2026-27'],
      ['7abc', '2026-27'],
      ['Manager A', 'Manager A', '2026-27'],
      ['Manager A', '2026-27'],
    ]);
    expect(fake.query.mock.calls[4][0]).toContain('ORDER BY f.fecha DESC, f.id DESC');
    expect(fake.query.mock.calls[4][0]).toContain('LIMIT 3');
    expect(data.transfers.last_transfers).toEqual([{ player_id: 3, price: '10' }]);
    expect(fake.season).toHaveBeenCalledWith();
  });
  it('skips transfers when the manager does not exist', async () => {
    fake.query.mockResolvedValue({ rows: [] });
    expect((await readManagerSeasonStats('missing')).user).toBeUndefined();
    expect(fake.query).toHaveBeenCalledTimes(3);
  });
  it('preserves squad ordering, projection, season scope and raw points aggregate', async () => {
    fake.query
      .mockResolvedValueOnce({ rows: [{ id: 1, average: '3.5' }] })
      .mockResolvedValueOnce({ rows: [{ total_points: '0' }] });
    const result = await readManagerSquad('7');
    expect(result).toEqual({ seasonId: '2026-27', rows: [{ id: 1, average: '3.5' }] });
    expect(fake.query.mock.calls[0][0]).toContain('ORDER BY COALESCE(ps.puntos, p.puntos) DESC');
    expect(fake.query.mock.calls[0][1]).toEqual(['2026-27', '7']);
    expect(await readManagerPoints('7', result.seasonId)).toBe('0');
    expect(fake.season).toHaveBeenCalledTimes(1);
  });
  it('propagates season failures before database reads', async () => {
    const failure = new Error('unknown season');
    fake.season.mockRejectedValueOnce(failure);
    await expect(readManagerSquad('7')).rejects.toBe(failure);
    expect(fake.query).not.toHaveBeenCalled();
  });
});
