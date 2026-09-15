import { describe, expect, it, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  cookieGet: vi.fn(),
  getActiveSeasonId: vi.fn(),
  pgQuery: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: mocks.cookieGet,
  })),
}));

vi.mock('../client', () => ({
  db: {
    query: mocks.pgQuery,
  },
}));

vi.mock('../../seasons', () => ({
  getActiveSeasonId: mocks.getActiveSeasonId,
}));

vi.mock('../../config', () => ({
  CONFIG: {
    DB: { SKIP: false },
    SEASON: { ID: '2025-26' },
  },
}));

import { resolveReadSeasonId } from '../season-context';

describe('resolveReadSeasonId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.pgQuery.mockResolvedValue({ rows: [{ id: 'season-exists' }] });
  });

  it('uses explicit seasonId parameter if provided', async () => {
    mocks.cookieGet.mockReturnValue({ value: 'cookie-season' });
    mocks.getActiveSeasonId.mockResolvedValue('active-db-season');

    const result = await resolveReadSeasonId('2025-26');
    expect(result).toBe('2025-26');
    expect(mocks.cookieGet).not.toHaveBeenCalled();
    expect(mocks.getActiveSeasonId).not.toHaveBeenCalled();
  });

  it('uses NEXT_SEASON_ID cookie when no explicit seasonId is passed', async () => {
    mocks.cookieGet.mockReturnValue({ value: '2025-26' });
    mocks.getActiveSeasonId.mockResolvedValue('2026-27');

    const result = await resolveReadSeasonId();
    expect(result).toBe('2025-26');
    expect(mocks.cookieGet).toHaveBeenCalledWith('NEXT_SEASON_ID');
    expect(mocks.getActiveSeasonId).not.toHaveBeenCalled();
  });

  it('resolves active season from DB when no explicit param or cookie exists', async () => {
    mocks.cookieGet.mockReturnValue(undefined);
    mocks.getActiveSeasonId.mockResolvedValue('2026-27');

    const result = await resolveReadSeasonId();
    expect(result).toBe('2026-27');
    expect(mocks.getActiveSeasonId).toHaveBeenCalled();
  });
});
