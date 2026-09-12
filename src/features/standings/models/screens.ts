import type { FullStandingsEntry, LeagueOverview } from './base-standings';

export interface StandingsOverviewModel {
  standings: FullStandingsEntry[];
  leagueTotals: LeagueOverview;
}

export interface StandingsSectionRow {
  key: string;
  title: string;
  value: string | null;
  href: string | null;
}

export interface StandingsSectionModel {
  rows: StandingsSectionRow[];
}
