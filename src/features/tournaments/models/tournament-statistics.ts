import type { TournamentFixture } from './tournaments';

export interface TournamentStatisticsManager {
  id: string | number | null;
  name: string | null | undefined;
  icon: string | null | undefined;
  colorIndex: number | null;
}
export interface HallOfFameEntry extends TournamentStatisticsManager {
  titles: number;
  tournaments: (string | null)[];
}
export interface GlobalUserStats extends TournamentStatisticsManager {
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  points: number;
  form: string[];
  currentStreak: number;
  longestStreak: number;
  signedStreak: number;
  scored?: number;
  against?: number;
}
export interface GlobalTournamentStatistics {
  hallOfFame: HallOfFameEntry[];
  globalStats: GlobalUserStats[];
  leagueStats: GlobalUserStats[];
  records: {
    biggestWin: {
      diff: number;
      match: TournamentFixture;
      winner: TournamentStatisticsManager;
      loser: TournamentStatisticsManager;
      score: string;
    } | null;
    highestScoring: {
      total: number;
      match: TournamentFixture & {
        home_user: TournamentStatisticsManager;
        away_user: TournamentStatisticsManager;
      };
      score: string;
    } | null;
    longestStreak: { count: number; user: TournamentStatisticsManager | null } | null;
  };
}
