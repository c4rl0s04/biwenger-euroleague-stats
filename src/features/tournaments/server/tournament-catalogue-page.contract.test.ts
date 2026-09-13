import { beforeEach, describe, expect, it, vi } from 'vitest';

const deps = vi.hoisted(() => ({
  list: vi.fn(),
  statistics: vi.fn(),
  phone: vi.fn(),
  desktopScreen: vi.fn(),
  mobileScreen: vi.fn(),
  presentation: vi.fn(),
}));
vi.mock('@/features/tournaments/server', () => ({
  getAllTournaments: deps.list,
  getGlobalTournamentStats: deps.statistics,
  getTournamentCataloguePresentation: deps.presentation,
}));
vi.mock('@/features/tournaments/public', () => ({
  DesktopTournamentsScreen: deps.desktopScreen,
  MobileTournamentsScreen: deps.mobileScreen,
}));
vi.mock('@/lib/mobile/presentation-server', () => ({ isPhonePresentation: deps.phone }));
import Page from '@/app/(app)/tournaments/page';

beforeEach(() => {
  vi.clearAllMocks();
  deps.list.mockResolvedValue({ active: [], finished: [], all: [] });
  deps.statistics.mockResolvedValue({
    hallOfFame: [],
    globalStats: [],
    leagueStats: [],
    records: {},
  });
  deps.phone.mockResolvedValue(false);
  deps.presentation.mockImplementation(({ active, finished }) => ({ active, finished }));
});

describe('Tournament catalogue page read contract', () => {
  it('projects phone lists and does not read desktop statistics', async () => {
    const active = [{ id: 1 }];
    const finished = [{ id: 2 }];
    deps.list.mockResolvedValue({ active, finished, all: [...active, ...finished] });
    deps.phone.mockResolvedValue(true);
    const element = await Page();
    expect(element.type).toBe(deps.mobileScreen);
    expect(element.props).toEqual({ active, finished });
    expect(deps.presentation).toHaveBeenCalledWith({
      active,
      finished,
      all: [...active, ...finished],
    });
    expect(deps.statistics).not.toHaveBeenCalled();
  });
  it('passes desktop statistics without introducing extra reads', async () => {
    const statistics = { hallOfFame: [], globalStats: [], leagueStats: [], records: {} };
    deps.statistics.mockResolvedValue(statistics);
    const element = await Page();
    expect(element.type).toBe(deps.desktopScreen);
    expect(element.props).toEqual({ active: [], finished: [], statistics });
    expect(deps.list).toHaveBeenCalledOnce();
    expect(deps.phone).toHaveBeenCalledOnce();
    expect(deps.statistics).toHaveBeenCalledOnce();
    expect(deps.presentation).not.toHaveBeenCalled();
  });
  it('starts list and presentation together, then waits for both before statistics', async () => {
    let release!: (value: boolean) => void;
    deps.phone.mockReturnValue(
      new Promise<boolean>((resolve) => {
        release = resolve;
      })
    );
    const pending = Page();
    expect(deps.list).toHaveBeenCalledOnce();
    expect(deps.phone).toHaveBeenCalledOnce();
    await Promise.resolve();
    expect(deps.statistics).not.toHaveBeenCalled();
    release(false);
    await pending;
    expect(deps.statistics).toHaveBeenCalledOnce();
  });
  it.each(['list', 'phone', 'statistics'] as const)(
    'preserves %s error propagation',
    async (key) => {
      const error = new Error('synthetic read failure');
      deps[key].mockRejectedValueOnce(error);
      await expect(Page()).rejects.toBe(error);
      if (key !== 'statistics') expect(deps.statistics).not.toHaveBeenCalled();
    }
  );
});
