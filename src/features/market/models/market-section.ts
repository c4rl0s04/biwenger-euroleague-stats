/** Explicit phone row projection; no database-shaped records reach this presentation. */
export interface MarketSectionRow {
  key: string;
  title: string;
  subtitle: string | null;
  value: number | null;
  href: string | null;
}

export interface MarketSectionModel {
  rows: MarketSectionRow[];
}
