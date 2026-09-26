/** Values already enriched with Player form; this pure calculation never reads persistence. */
type NumericInput = number | string | null | undefined;
export interface MarketRecommendationInput {
  min_points: NumericInput;
  max_points: NumericInput;
  games_played: NumericInput;
  team_id: NumericInput;
  season_avg: NumericInput;
  avg_recent_points: NumericInput;
  value_score: NumericInput;
  price_trend: NumericInput;
  price: NumericInput;
  total_points: NumericInput;
}

export interface MarketRecommendation {
  price: number;
  price_trend: number;
  avg_recent_points: number;
  value_score: number;
  total_points: number;
  season_avg: number;
  recommendation_score: number;
  recommendation_label: string;
  recommendation_color: string;
  recommendation_dot: string;
  recommendation_icon: string;
}

/** Preserve the existing eight-factor algorithm, including its truthy fallback semantics. */
export function scoreMarketListing(
  row: MarketRecommendationInput,
  teamMatchCounts: Readonly<Record<number, number>>,
  teamPlayoffProbs: Readonly<Record<number, number>>
): MarketRecommendation {
  // 1. Raw Stats
  const min_points = parseInt(String(row.min_points)) || 0;
  const max_points = parseInt(String(row.max_points)) || 0;
  const games_played = parseInt(String(row.games_played)) || 0;
  const team_games_played = teamMatchCounts[parseInt(String(row.team_id))] || 1;
  const season_avg = parseFloat(String(row.season_avg)) || 0;
  const avg_recent_points = parseFloat(String(row.avg_recent_points)) || 0;
  const value_score = parseFloat(String(row.value_score)) || 0;
  const price_trend = parseInt(String(row.price_trend)) || 0;
  const team_prob = teamPlayoffProbs[parseInt(String(row.team_id))] || 50;

  let totalScore = 0;

  // 2. Algorithm Weights
  // - Suelo (10%)
  let sueloScore = 0;
  if (min_points >= 10) sueloScore = 10;
  else if (min_points > 0) sueloScore = min_points;
  else if (min_points < 0) sueloScore = 0;
  totalScore += sueloScore;

  // - Techo (15%) -> High ceilings (30+) get full points
  let techoScore = Math.min((max_points / 30) * 15, 15);
  totalScore += techoScore;

  // - Promedio Absoluto (25%) -> Very important for high tier players like Vezenkov
  let avgScore = Math.min((season_avg / 16) * 25, 25); // 16+ avg = 25 pts
  totalScore += avgScore;

  // - Asistencia / Disponibilidad (10%)
  let attendanceScore = Math.min(games_played / Math.max(1, team_games_played), 1) * 10;
  totalScore += Math.max(0, attendanceScore);

  // - Rentabilidad / Value (10%)
  let profitabilityScore = Math.min(value_score / 100, 1) * 10;
  totalScore += Math.max(0, profitabilityScore);

  // - Flujo Diario (5%)
  let trendScore = 2; // neutral
  if (price_trend > 50000) trendScore = 5;
  else if (price_trend > 0) trendScore = 4;
  else if (price_trend < -50000) trendScore = 0;
  else if (price_trend < 0) trendScore = 1;
  totalScore += trendScore;

  // - Momento de Forma (15%)
  let formScore = 7.5; // neutral
  const formDiff = avg_recent_points - season_avg;
  if (games_played < 3) formScore = 5;
  else if (avg_recent_points >= 18 || formDiff >= 6) formScore = 15;
  else if (avg_recent_points >= 14 || formDiff >= 3) formScore = 12;
  else if (formDiff >= 0) formScore = 9;
  else if (formDiff > -3) formScore = 6;
  else if (formDiff > -6) formScore = 3;
  else formScore = 0;
  totalScore += formScore;

  // - Contexto Equipo (10%), implicitly includes playoff prob and calendar
  let teamContextScore = (team_prob / 100) * 10;
  totalScore += teamContextScore;

  // 3. Final Score
  const finalScore = Math.round(Math.max(0, Math.min(100, totalScore)));

  let rec_label = 'Evitar';
  let rec_color = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
  let rec_dot = 'bg-rose-400';
  let rec_icon = 'TrendingDown';

  if (finalScore >= 85) {
    rec_label = 'Fichaje Obligatorio';
    rec_color = 'bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30';
    rec_dot = 'bg-fuchsia-400';
    rec_icon = 'Star';
  } else if (finalScore >= 75) {
    rec_label = 'Compra Excelente';
    rec_color = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    rec_dot = 'bg-emerald-400';
    rec_icon = 'TrendingUp';
  } else if (finalScore >= 50) {
    rec_label = 'Compra Normal';
    rec_color = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    rec_dot = 'bg-amber-400';
    rec_icon = 'Activity';
  } else if (finalScore >= 30) {
    rec_label = 'Compra Arriesgada';
    rec_color = 'bg-orange-500/15 text-orange-400 border-orange-500/30';
    rec_dot = 'bg-orange-400';
    rec_icon = 'TrendingDown';
  }

  return {
    price: parseInt(String(row.price)),
    price_trend,
    avg_recent_points,
    value_score,
    total_points: parseFloat(String(row.total_points)) || 0,
    season_avg,
    recommendation_score: finalScore,
    recommendation_label: rec_label,
    recommendation_color: rec_color,
    recommendation_dot: rec_dot,
    recommendation_icon: rec_icon,
  };
}
