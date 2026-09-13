/** Existing phone section rendering, projected without generic database-shaped records. */
export interface PredictionSectionRow {
  key: string;
  title: string;
  href?: string;
}

export interface PredictionSectionModel {
  rows: PredictionSectionRow[];
}
