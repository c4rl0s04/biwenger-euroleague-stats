import type { TournamentDisplayText } from './tournament-detail';

export interface DesktopTournamentCatalogueItem {
  id: number;
  name: string | null;
  type: string | null;
  status: string | null;
  statusLabel: TournamentDisplayText;
  winner: { name: TournamentDisplayText; iconUrl: string | null } | null;
}

export interface DesktopTournamentCatalogue {
  active: DesktopTournamentCatalogueItem[];
  finished: DesktopTournamentCatalogueItem[];
}

export interface TournamentCatalogueItem {
  id: number;
  name: string | null;
  type: string | null;
  winnerLabel: string;
}

export interface TournamentCatalogue {
  active: TournamentCatalogueItem[];
  finished: TournamentCatalogueItem[];
}
