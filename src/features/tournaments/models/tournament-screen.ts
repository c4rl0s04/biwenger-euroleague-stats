import type { TournamentCatalogue, DesktopTournamentCatalogue } from './tournament-catalogue';
import type { TournamentPhoneDetail, TournamentDesktopDetail } from './tournament-detail';
import type { TournamentFixture, TournamentStanding } from './tournaments';
import type { TournamentBracketRound } from './tournament-bracket';
import type { GlobalTournamentStatistics } from './tournament-statistics';

export type TournamentCatalogueScreenModel =
  | { screen: 'phone'; props: TournamentCatalogue }
  | {
      screen: 'desktop';
      props: DesktopTournamentCatalogue & { statistics: GlobalTournamentStatistics };
    };

interface DetailFacts {
  standings: TournamentStanding[];
  fixtures: TournamentFixture[];
}
export type TournamentDetailScreenModel =
  | { screen: 'phone'; props: DetailFacts & { tournament: TournamentPhoneDetail } }
  | {
      screen: 'desktop';
      props: DetailFacts & {
        tournament: TournamentDesktopDetail;
        initialRoundId: number | null | undefined;
        bracketRounds: TournamentBracketRound[];
      };
    };
