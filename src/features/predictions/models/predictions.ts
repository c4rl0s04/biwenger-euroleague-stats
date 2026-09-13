export interface Achievement {
  aciertos: number;
  jornada: string;
  usuario: string;
  user_id: number;
  color_index: number;
  user_icon?: string;
}

export interface ParticipationStat {
  jornada: string;
  count: number;
}

export interface PorraResult {
  jornada: string;
  usuario: string;
  aciertos: number;
  user_id: number;
  color_index: number;
  user_icon?: string;
  is_partial: boolean;
}

export interface TableStat {
  user_id: number;
  usuario: string;
  user_icon?: string;
  color_index: number;
  jornadas_jugadas: number;
  total_aciertos: number;
  promedio: number;
  mejor_jornada: number;
  peor_jornada: number;
  exacts: number;
  perfects: number;
}

export interface ClutchStat {
  usuario: string;
  user_id: number;
  color_index: number;
  user_icon?: string;
  avg_last_3: number;
}

export interface VictoryStat {
  usuario: string;
  user_id: number;
  color_index: number;
  user_icon?: string;
  victorias: number;
}

export interface PredictableTeam {
  id: number;
  name: string;
  img: string;
  total: number;
  correct: number;
  predicted_wins: number;
  predicted_losses: number;
  correct_wins: number;
  correct_losses: number;
  percentage: number;
}

export interface BestRoundStat {
  usuario: string;
  user_id: number;
  color_index: number;
  user_icon?: string;
  aciertos: number;
  jornada: string;
}

export interface HistoryUser {
  id: number;
  name: string;
  color_index: number;
}

export interface HistoryPivotRow {
  id: number;
  name: string;
  scores: Record<string, { score: number | null; is_partial: boolean }>;
}

export interface NormalizedPrediction {
  user_id: string;
  usuario: string;
  user_icon?: string;
  color_index: number;
  jornada: string;
  base_round_id: number;
  aciertos: number;
  result: string;
  is_partial: boolean;
  total_matches: number;
  user_matches: number;
}

export interface HistoryPivot {
  users: HistoryUser[];
  jornadas: HistoryPivotRow[];
}

export interface PorrasStats {
  achievements: {
    perfect_10: Achievement[];
    blanked: Achievement[];
  };
  participation: ParticipationStat[];
  table_stats: TableStat[];
  performance: PorraResult[];
  history: HistoryPivot;
  clutch_stats: ClutchStat[];
  porra_stats: {
    victorias: VictoryStat[];
    predictable_teams: PredictableTeam[];
    promedios: TableStat[];
    mejor_jornada: BestRoundStat[];
  };
}
