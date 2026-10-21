import { expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
vi.mock('@/components/shell/mobile/MobileHeaderActions', () => ({ default: () => null }));
import MobileRecordList from './MobileRecordList';
import LegacyMobileRecordList from '@/tests/fixtures/LegacyMobileRecordList';
import {
  mapCatalogueRows,
  mapRecentMatchRows,
  mapPlayerTransferRows,
  catalogueInsightRows,
} from '@/features/players/models/mobile-rows';
import { mapTeamSectionRows } from '@/features/teams/models/mobile-rows';
import { mapTournamentRows } from '@/features/tournaments/models/mobile-rows';
import { mapCompareHistoryRows } from '@/features/compare/models/mobile-rows';
import { mapLineupSection } from '@/features/lineup/server/mappers/lineup-section.mapper';
import type { PlayerCatalogueItemViewModel } from '@/features/players/models/player-catalogue';
import type {
  PlayerProfileMatchViewModel,
  PlayerTransferViewModel,
} from '@/features/players/models/player-profile';
import type { TeamProfileViewModel } from '@/features/teams/models/team-profile';
import type {
  TournamentStanding,
  TournamentFixture,
} from '@/features/tournaments/models/tournaments';
import type { CompareOpponentModel } from '@/features/compare/models/compare';
import type { ManagerSquadViewModel } from '@/features/managers/public';

function compare(
  rows: Parameters<typeof MobileRecordList>[0]['rows'],
  data: unknown,
  linkPrefix?: string
) {
  expect(renderToStaticMarkup(<MobileRecordList rows={rows} />)).toBe(
    renderToStaticMarkup(<LegacyMobileRecordList data={data} linkPrefix={linkPrefix} />)
  );
}

it.each([0, 1, 25])(
  'preserves catalogue and squad labels, nullish values and the 20-row limit (%i)',
  (count) => {
    const players = Array.from({ length: count }, (_, i) => ({
      id: i,
      name: i % 2 ? '' : null,
      position: 'Base',
      team: i % 2 ? '' : null,
      total_points: i % 2 ? 0 : null,
      points: null,
      price: -1234.5,
    }));
    compare(
      mapCatalogueRows(players as unknown as PlayerCatalogueItemViewModel[]),
      players,
      '/player'
    );
    const squadPlayers = players.map(({ total_points: _, ...player }) => player);
    const squad = {
      player_count: count,
      total_value: 25,
      players: squadPlayers,
      top_rising: [],
      top_falling: [],
    } as unknown as ManagerSquadViewModel;
    compare(mapLineupSection(squad).rows, squadPlayers, '/player');
  }
);

it('preserves the existing Insights and unavailable-squad projections', () => {
  compare(catalogueInsightRows, [[], { hot: [], cold: [] }], '/player');
  compare(mapLineupSection(null).rows, {}, '/player');
});

it('preserves Player match titles and ordinal-only transfer rows', () => {
  const matches = [
    { round_name: 'Jornada 3', round_id: 3, fantasy_points: 22 },
  ] as PlayerProfileMatchViewModel[];
  const transfers = [
    { date: '2026-10-01', from_name: 'A', to_name: 'B', amount: 25 },
  ] as PlayerTransferViewModel[];
  compare(mapRecentMatchRows(matches), matches);
  compare(mapPlayerTransferRows(transfers), transfers);
});

it('preserves Team roster identities and schedule titles', () => {
  const roster = [{ id: 0, name: '', position: 'Base', points: 0, price: 50 }];
  const model = {
    roster,
    upcomingMatches: [{ roundName: 'Jornada 1' }],
    recentMatches: [],
  } as unknown as TeamProfileViewModel;
  compare(mapTeamSectionRows(model, 'roster'), roster, '/player');
  compare(mapTeamSectionRows(model, 'matches'), [{ round_name: 'Jornada 1' }]);
});

it('preserves tournament position subtitles, IDs, scores and fixture titles', () => {
  const standings = [
    { id: 4, user_id: null, user_name: '', position: 0, points: 0 },
    { id: 5, user_id: '7', user_name: null, position: null, points: null },
  ] as TournamentStanding[];
  const fixtures = [
    { id: 1, round_name: null },
    { id: 2, round_name: 'Final' },
  ] as TournamentFixture[];
  compare(mapTournamentRows(standings, true), standings, '/user');
  compare(mapTournamentRows(fixtures, false), fixtures);
});

it('preserves comparison round names without inventing values from actual_points', () => {
  const history = [
    { round_name: 'J1', round_id: 7, actual_points: 150 },
  ] as CompareOpponentModel['recentHistory'];
  compare(mapCompareHistoryRows(history), history);
});
