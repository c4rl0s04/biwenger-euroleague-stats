import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ query: vi.fn(), season: vi.fn() }));
vi.mock('../../client', () => ({ db: { query: mocks.query } }));
vi.mock('../../season-context', () => ({ resolveReadSeasonId: mocks.season }));
import { readManagerDirectory } from './manager-directory';
beforeEach(() => {
  vi.clearAllMocks();
  mocks.season.mockResolvedValue('fixture-season');
  mocks.query.mockResolvedValue({ rows: [] });
});
describe('single shared fantasy manager directory query', () => {
  it('preserves season binding, active filter, name ordering and text IDs', async () => {
    const rows = [{ id: '007', name: null, icon: null, color_index: 0 }];
    mocks.query.mockResolvedValue({ rows });
    expect(await readManagerDirectory()).toBe(rows);
    expect(mocks.query).toHaveBeenCalledWith(
      expect.stringContaining("COALESCE(us.status, 'active') = 'active'"),
      ['fixture-season']
    );
    expect(mocks.query.mock.calls[0][0]).toContain(
      'ORDER BY COALESCE(us.name, u.name) ASC, u.id ASC'
    );
    expect(mocks.query.mock.calls[0][0]).not.toMatch(/password|token|credential|SELECT\s+\*/i);
    await readManagerDirectory();
    expect(mocks.season).toHaveBeenCalledTimes(2);
  });
  it('propagates query and season errors unchanged', async () => {
    const failure = new Error('fixture');
    mocks.season.mockRejectedValue(failure);
    await expect(readManagerDirectory()).rejects.toBe(failure);
    expect(mocks.query).not.toHaveBeenCalled();
    mocks.season.mockResolvedValue('fixture-season');
    mocks.query.mockRejectedValue(failure);
    await expect(readManagerDirectory()).rejects.toBe(failure);
  });
});
