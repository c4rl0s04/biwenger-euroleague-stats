import 'server-only';

import {
  getAllTournaments,
  getTournamentDetails,
  getStandings,
  getFixtures,
  getTournamentCataloguePresentation,
  getDesktopTournamentCataloguePresentation,
  getTournamentPhoneDetailPresentation,
  getTournamentDesktopDetailPresentation,
  getTournamentBracketPresentation,
} from './tournament-read.service';
import { getGlobalTournamentStats } from './tournament-statistics.service';
import { getTournamentInitialRoundId } from './tournament-round.service';
import type {
  TournamentCatalogueScreenModel,
  TournamentDetailScreenModel,
} from '../../models/tournament-screen';

export const TOURNAMENT_SCREEN_POLICY = Object.freeze({
  access: 'existing protected page/layout policy; no owned HTTP endpoint or session fallback',
  serverCache: 'none; underlying reads retain independent season resolution',
  presentation: 'framework supplies phone detection; no framework dependency in service',
  mutations: 'none',
});

const defaults = {
  list: getAllTournaments,
  detail: getTournamentDetails,
  standings: getStandings,
  fixtures: getFixtures,
  statistics: getGlobalTournamentStats,
  round: getTournamentInitialRoundId,
  phoneCatalogue: getTournamentCataloguePresentation,
  desktopCatalogue: getDesktopTournamentCataloguePresentation,
  phoneDetail: getTournamentPhoneDetailPresentation,
  desktopDetail: getTournamentDesktopDetailPresentation,
  bracket: getTournamentBracketPresentation,
};

export function createTournamentScreenService(overrides: Partial<typeof defaults> = {}) {
  const deps = { ...defaults, ...overrides };
  async function getTournamentCatalogueScreen(
    presentation: () => Promise<boolean>
  ): Promise<TournamentCatalogueScreenModel> {
    const [lists, phone] = await Promise.all([deps.list(), presentation()]);
    if (phone) return { screen: 'phone', props: deps.phoneCatalogue(lists) };
    const statistics = await deps.statistics();
    return {
      screen: 'desktop',
      props: {
        ...deps.desktopCatalogue({ active: lists.active, finished: lists.finished }),
        statistics,
      },
    };
  }
  async function getTournamentDetailScreen(
    id: string,
    presentation: () => Promise<boolean>
  ): Promise<TournamentDetailScreenModel | null> {
    const [tournament, phone] = await Promise.all([deps.detail(id), presentation()]);
    if (!tournament) return null;
    const [standings, fixtures] = await Promise.all([deps.standings(id), deps.fixtures(id)]);
    if (phone)
      return {
        screen: 'phone',
        props: {
          tournament: deps.phoneDetail(tournament),
          standings,
          fixtures,
        },
      };
    const initialRoundId = await deps.round(tournament, fixtures);
    return {
      screen: 'desktop',
      props: {
        tournament: deps.desktopDetail(tournament),
        standings,
        fixtures,
        initialRoundId,
        bracketRounds: deps.bracket(tournament, fixtures),
      },
    };
  }
  return { getTournamentCatalogueScreen, getTournamentDetailScreen };
}

export const { getTournamentCatalogueScreen, getTournamentDetailScreen } =
  createTournamentScreenService();
