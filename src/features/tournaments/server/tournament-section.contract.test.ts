import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const deps = vi.hoisted(() => ({
  detail: vi.fn(),
  standings: vi.fn(),
  fixtures: vi.fn(),
  route: vi.fn(),
  screen: vi.fn(),
}));
vi.mock('./services/tournament-read.service', () => ({
  getTournamentDetails: deps.detail,
  getStandings: deps.standings,
  getFixtures: deps.fixtures,
}));
vi.mock('@/features/tournaments/server', async () => {
  const { getTournamentSection } = await import('./services/tournament-section.service');
  return { getTournamentSection };
});
vi.mock('@/features/tournaments/public', () => ({ TournamentSectionScreen: deps.screen }));
vi.mock('@/lib/mobile/route-server', () => ({ requireMobileRoute: deps.route }));
import Page from '@/app/(app)/tournaments/[id]/[section]/page';

const request = (section = 'standings') => ({ params: Promise.resolve({ id: '0x1', section }) });
beforeEach(() => {
  vi.clearAllMocks();
  deps.detail.mockResolvedValue({ name: null, data_json: 'not forwarded' });
  deps.standings.mockResolvedValue([{ id: 1 }]);
  deps.fixtures.mockResolvedValue([{ id: 2 }]);
  deps.route.mockResolvedValue({ definition: { title: 'Section title' } });
});
describe('Tournament section route through its real service', () => {
  it('preserves original ID/title and only forwards the selected projection', async () => {
    const element = await Page(request());
    expect(deps.route).toHaveBeenCalledWith('/tournaments/0x1/standings');
    for (const read of [deps.detail, deps.standings, deps.fixtures])
      expect(read).toHaveBeenCalledWith('0x1');
    expect(element?.type).toBe(deps.screen);
    expect(element?.props).toEqual({
      id: '0x1',
      section: 'standings',
      title: 'Section title',
      model: { name: null, data: [{ id: 1 }] },
    });
  });
  it.each(['bracket', 'results'])('retains fixture records for %s', async (section) => {
    expect((await Page(request(section)))?.props.model.data).toEqual([{ id: 2 }]);
  });
  it('returns null for missing detail after still running all reads', async () => {
    deps.detail.mockResolvedValue(null);
    expect(await Page(request())).toBeNull();
    for (const read of [deps.detail, deps.standings, deps.fixtures])
      expect(read).toHaveBeenCalledOnce();
  });
  it('does not read when mobile route validation/desktop redirect interrupts', async () => {
    const error = new Error('fixture route boundary');
    deps.route.mockRejectedValue(error);
    await expect(Page(request())).rejects.toBe(error);
    for (const read of [deps.detail, deps.standings, deps.fixtures])
      expect(read).not.toHaveBeenCalled();
  });
  it('starts all three reads concurrently after the route gate', async () => {
    let release!: (value: null) => void;
    deps.detail.mockReturnValue(
      new Promise<null>((resolve) => {
        release = resolve;
      })
    );
    const pending = Page(request());
    await Promise.resolve();
    await Promise.resolve();
    expect(deps.standings).toHaveBeenCalledOnce();
    expect(deps.fixtures).toHaveBeenCalledOnce();
    release(null);
    expect(await pending).toBeNull();
  });
  it.each(['detail', 'standings', 'fixtures'] as const)(
    'propagates %s read errors',
    async (key) => {
      const error = new Error('fixture read failure');
      deps[key].mockRejectedValue(error);
      await expect(Page(request())).rejects.toBe(error);
    }
  );
});
