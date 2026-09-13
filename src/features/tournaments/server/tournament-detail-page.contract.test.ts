import { beforeEach, describe, expect, it, vi } from 'vitest';
const deps = vi.hoisted(() => ({
  rules: vi.fn(),
  presentation: vi.fn(),
  detail: vi.fn(),
  standings: vi.fn(),
  fixtures: vi.fn(),
  round: vi.fn(),
  phone: vi.fn(),
  desktop: vi.fn(),
  mobile: vi.fn(),
  missing: vi.fn(),
}));
vi.mock('@/features/tournaments/server', () => ({
  getTournamentPlayoffRules: deps.rules,
  getTournamentPhoneDetailPresentation: deps.presentation,
  getTournamentDetails: deps.detail,
  getStandings: deps.standings,
  getFixtures: deps.fixtures,
  getTournamentInitialRoundId: deps.round,
}));
vi.mock('@/features/tournaments/public', () => ({
  DesktopTournamentDetailScreen: deps.desktop,
  MobileTournamentDetailScreen: deps.mobile,
}));
vi.mock('@/lib/mobile/presentation-server', () => ({ isPhonePresentation: deps.phone }));
vi.mock('next/navigation', () => ({ notFound: deps.missing }));
import Page, { dynamic } from '@/app/(app)/tournaments/[id]/page';

const tournament = { id: 1, name: 'Synthetic', status: 'active' };
const standings = [{ user_id: '01' }];
const fixtures = [{ round_id: 2 }];
const request = () => ({ params: Promise.resolve({ id: '0x1' }) });
beforeEach(() => {
  vi.clearAllMocks();
  deps.detail.mockResolvedValue(tournament);
  deps.standings.mockResolvedValue(standings);
  deps.fixtures.mockResolvedValue(fixtures);
  deps.round.mockResolvedValue(2);
  deps.rules.mockReturnValue({ twoLegged: false, twoLeggedFinal: false });
  deps.presentation.mockImplementation((value) => value);
  deps.phone.mockResolvedValue(false);
  deps.missing.mockImplementation(() => {
    throw new Error('fixture notFound');
  });
});
describe('Tournament detail page contract', () => {
  it('retains force-dynamic and passes the original ID to each read', async () => {
    const screen = await Page(request());
    expect(dynamic).toBe('force-dynamic');
    for (const read of [deps.detail, deps.standings, deps.fixtures])
      expect(read).toHaveBeenCalledWith('0x1');
    expect(screen.type).toBe(deps.desktop);
    expect(screen.props).toEqual({
      tournament,
      standings,
      fixtures,
      initialRoundId: 2,
      playoffRules: { twoLegged: false, twoLeggedFinal: false },
    });
    expect(deps.round).toHaveBeenCalledWith(tournament, fixtures);
    expect(deps.presentation).not.toHaveBeenCalled();
  });
  it('does not resolve a round for phone presentation', async () => {
    deps.phone.mockResolvedValue(true);
    const screen = await Page(request());
    expect(screen.type).toBe(deps.mobile);
    expect(screen.props).toEqual({ tournament, standings, fixtures });
    expect(deps.round).not.toHaveBeenCalled();
    expect(deps.rules).not.toHaveBeenCalled();
    expect(deps.presentation).toHaveBeenCalledWith(tournament);
  });
  it('preserves notFound before child reads for an absent tournament', async () => {
    deps.detail.mockResolvedValue(null);
    await expect(Page(request())).rejects.toThrow('fixture notFound');
    expect(deps.missing).toHaveBeenCalledOnce();
    for (const read of [deps.standings, deps.fixtures, deps.round])
      expect(read).not.toHaveBeenCalled();
  });
  it('awaits detail/presentation before starting standings and fixtures', async () => {
    let release!: (value: typeof tournament) => void;
    deps.detail.mockReturnValue(
      new Promise<typeof tournament>((resolve) => {
        release = resolve;
      })
    );
    const pending = Page(request());
    await Promise.resolve();
    expect(deps.phone).toHaveBeenCalledOnce();
    expect(deps.standings).not.toHaveBeenCalled();
    expect(deps.fixtures).not.toHaveBeenCalled();
    release(tournament);
    await pending;
    expect(deps.standings).toHaveBeenCalledOnce();
    expect(deps.fixtures).toHaveBeenCalledOnce();
  });
  it.each(['detail', 'phone', 'standings', 'fixtures', 'round'] as const)(
    'propagates %s failure',
    async (key) => {
      const error = new Error('synthetic failure');
      deps[key].mockRejectedValueOnce(error);
      await expect(Page(request())).rejects.toBe(error);
    }
  );
});
