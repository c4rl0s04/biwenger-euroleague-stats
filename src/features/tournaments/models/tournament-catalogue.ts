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
