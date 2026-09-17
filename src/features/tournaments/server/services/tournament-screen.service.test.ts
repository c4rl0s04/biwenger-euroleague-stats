import { expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import {
  createTournamentScreenService,
  TOURNAMENT_SCREEN_POLICY,
} from './tournament-screen.service';
import type { Tournament } from '../../models/tournaments';

const row: Tournament = {
  id: 7,
  name: 'Cup',
  type: 'playoff',
  status: 'finished',
  data_json: '{"unused":"snapshot-only-marker"}',
  data: { winner: { id: '01', name: 'Ana' }, unused: 'snapshot-only-marker' },
};
const statistics = {
  hallOfFame: [],
  globalStats: [],
  leagueStats: [],
  records: { biggestWin: null, highestScoring: null, longestStreak: null },
};

it.each([true, false])(
  'returns only finished catalogue/detail screen models (phone=%s)',
  async (phone) => {
    const reads = {
      list: vi.fn().mockResolvedValue({ active: [], finished: [row], all: [row] }),
      detail: vi.fn().mockResolvedValue(row),
      standings: vi.fn().mockResolvedValue([]),
      fixtures: vi.fn().mockResolvedValue([]),
      statistics: vi.fn().mockResolvedValue(statistics),
      round: vi.fn().mockResolvedValue(null),
    };
    const services = createTournamentScreenService(reads);
    const presentation = vi.fn().mockResolvedValue(phone);
    const catalogue = await services.getTournamentCatalogueScreen(presentation);
    const detail = await services.getTournamentDetailScreen('0x7', presentation);
    expect(catalogue.screen).toBe(phone ? 'phone' : 'desktop');
    expect(detail?.screen).toBe(phone ? 'phone' : 'desktop');
    expect(detail?.props.tournament.name).toBe('Cup');
    expect(detail?.props.tournament.winner).toMatchObject({ name: 'Ana' });
    const serialized = JSON.stringify({ catalogue, detail });
    expect(serialized).not.toContain('snapshot-only-marker');
    expect(serialized).not.toContain('data_json');
    expect(detail?.props.tournament).not.toHaveProperty('data');
    for (const read of [reads.detail, reads.standings, reads.fixtures])
      expect(read).toHaveBeenCalledWith('0x7');
    expect(reads.round).toHaveBeenCalledTimes(phone ? 0 : 1);
    expect(reads.statistics).toHaveBeenCalledTimes(phone ? 0 : 1);
    await services.getTournamentCatalogueScreen(presentation);
    await services.getTournamentDetailScreen('0x7', presentation);
    expect(reads.list).toHaveBeenCalledTimes(2);
    expect(reads.detail).toHaveBeenCalledTimes(2);
    expect(TOURNAMENT_SCREEN_POLICY.serverCache).toContain('none');
  }
);

it('returns null for not-found before dependent reads or projections', async () => {
  const detail = vi.fn().mockResolvedValue(null);
  const standings = vi.fn();
  const fixtures = vi.fn();
  const services = createTournamentScreenService({ detail, standings, fixtures });
  expect(await services.getTournamentDetailScreen('7', async () => false)).toBeNull();
  expect(standings).not.toHaveBeenCalled();
  expect(fixtures).not.toHaveBeenCalled();
});
