/**
 * Pure helper to calculate form scores from a recent_scores string.
 */
export function computePlayerFormScores(recentScoresStr: string): {
  scores: string[];
  avg_recent_points: number | null;
  avg_form_score: number | null;
} {
  const rawScores = (recentScoresStr ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const knownGames = rawScores.filter((s) => s !== '?');
  const totalPoints = knownGames.reduce((sum, s) => {
    if (s === 'X') return sum;
    const n = parseFloat(s);
    return sum + (Number.isFinite(n) ? n : 0);
  }, 0);

  const avgFormScore = knownGames.length > 0 ? totalPoints / knownGames.length : null;
  const playedGames = knownGames.filter((s) => s !== 'X');
  const avgRecentPoints = playedGames.length > 0 ? totalPoints / playedGames.length : null;

  return {
    scores: rawScores,
    avg_recent_points: avgRecentPoints != null ? parseFloat(avgRecentPoints.toFixed(2)) : null,
    avg_form_score: avgFormScore != null ? parseFloat(avgFormScore.toFixed(2)) : null,
  };
}
