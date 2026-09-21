import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { createRoundDetailsService } from './round-details.service';
import { mapRoundDetails } from '../mappers/round-details.mapper';

const fixture = {
  home_id: 1,
  away_id: 2,
  home_team: 'Home',
  away_team: null,
  date: new Date('2026-01-01Z'),
  status: 'upcoming',
  home_score: null,
  away_score: null,
  home_logo: null,
  home_short: null,
  away_logo: null,
  away_short: null,
};
const info = { round_id: 1, round_name: null, start_date: new Date('2026-01-01Z'), end_date: null };
function dependencies() {
  return {
    season: vi.fn().mockResolvedValue('season-A'),
    info: vi.fn().mockResolvedValue([info]),
    finished: vi.fn().mockResolvedValue([]),
    fixtures: vi.fn().mockResolvedValue([fixture]),
    positions: vi.fn().mockReturnValue(new Map([[1, 3]])),
    warn: vi.fn(),
  };
}
describe('Matches round-detail projection', () => {
  it('preserves the ordered queries and one season snapshot, mapping Dates and positions', async () => {
    const deps = dependencies();
    const service = createRoundDetailsService(deps);
    const result = await service('007');
    expect(deps.info).toHaveBeenCalledWith('007', 'season-A');
    expect(deps.finished).toHaveBeenCalledWith('season-A');
    expect(deps.fixtures).toHaveBeenCalledWith('007', 'season-A');
    expect(deps.info.mock.invocationCallOrder[0]).toBeLessThan(
      deps.finished.mock.invocationCallOrder[0]
    );
    expect(deps.finished.mock.invocationCallOrder[0]).toBeLessThan(
      deps.fixtures.mock.invocationCallOrder[0]
    );
    expect(result?.matches[0]).toMatchObject({
      date: '2026-01-01T00:00:00.000Z',
      home_position: 3,
      away_position: null,
    });
    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
    await service('007');
    expect(deps.season).toHaveBeenCalledTimes(2);
  });
  it.each([0, ''])('preserves falsy selector %s without reading', async (input) => {
    const deps = dependencies();
    expect(await createRoundDetailsService(deps)(input)).toBeNull();
    expect(deps.season).not.toHaveBeenCalled();
  });
  it('does not query fixtures for a missing round', async () => {
    const deps = dependencies();
    deps.info.mockResolvedValue([]);
    expect(await createRoundDetailsService(deps)(9)).toBeNull();
    expect(deps.finished).not.toHaveBeenCalled();
    expect(deps.fixtures).not.toHaveBeenCalled();
  });
  it('preserves partial-position failure while propagating fixture failures', async () => {
    const deps = dependencies();
    const error = new Error('positions');
    deps.finished.mockRejectedValue(error);
    const service = createRoundDetailsService(deps);
    expect((await service(1))?.matches[0].home_position).toBeNull();
    expect(deps.warn).toHaveBeenCalledWith('Could not calculate standings:', error);
    deps.fixtures.mockRejectedValueOnce(new Error('fixtures'));
    await expect(service(1)).rejects.toThrow('fixtures');
  });
  it('allowlists both levels and retains null and zero-position fallback', () => {
    const infoWithExtra = { ...info, token: 'excluded' };
    const fixtureWithExtra = { ...fixture, token: 'excluded' };
    const result = mapRoundDetails(infoWithExtra, [fixtureWithExtra], new Map([[1, 0]]));
    expect(JSON.stringify(result)).not.toContain('token');
    expect(result.matches[0].home_position).toBeNull();
  });
});
