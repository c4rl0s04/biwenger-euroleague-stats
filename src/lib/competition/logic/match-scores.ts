/**
 * Match Score Utilities
 * Helper functions for calculating regular time scores (excluding overtime)
 */

export interface EuroleagueHeader {
  ScoreA?: number | string;
  ScoreB?: number | string;
  TeamA?: number | string;
  TeamB?: number | string;
  [key: string]: any; // Allow dynamic quarter keys like Q1ScoreA, OT1ScoreA
}

export interface MatchScoreSource {
  home_score_regtime?: number | null;
  away_score_regtime?: number | null;
  home_score?: number | null;
  away_score?: number | null;
}

/**
 * Calculate regular time score from quarter scores
 * Regular time = sum of Q1, Q2, Q3, Q4 (excludes overtime)
 * @param header - Euroleague Header API response
 * @returns Regular time scores
 */
export function calculateRegularTimeScores(header?: EuroleagueHeader | null): {
  homeScore: number | null;
  awayScore: number | null;
} {
  if (!header) return { homeScore: null, awayScore: null };

  // Euroleague Header API structure typically has:
  // - ScoreA, ScoreB: Final scores (including OT)
  // - Q1ScoreA, Q1ScoreB, Q2ScoreA, Q2ScoreB, Q3ScoreA, Q3ScoreB, Q4ScoreA, Q4ScoreB: Quarter scores
  // - OT1ScoreA, OT1ScoreB, etc.: Overtime scores (if any)

  try {
    let homeScore = 0;
    let awayScore = 0;

    // Sum quarters 1-4 (regular time)
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    for (const quarter of quarters) {
      const homeQuarter = header[`${quarter}ScoreA`] || header[`${quarter}ScoreA`] || 0;
      const awayQuarter = header[`${quarter}ScoreB`] || header[`${quarter}ScoreB`] || 0;

      // Handle both possible field names (ScoreA/ScoreB vs TeamA/TeamB)
      const homeQ = header[`${quarter}ScoreA`] ?? header[`${quarter}TeamA`] ?? 0;
      const awayQ = header[`${quarter}ScoreB`] ?? header[`${quarter}TeamB`] ?? 0;

      homeScore += Number(homeQ) || 0;
      awayScore += Number(awayQ) || 0;
    }

    // If we couldn't get quarter scores, return null to indicate we should use final score
    if (homeScore === 0 && awayScore === 0) {
      return { homeScore: null, awayScore: null };
    }

    return { homeScore, awayScore };
  } catch (error) {
    console.warn('Error calculating regular time scores from header:', error);
    return { homeScore: null, awayScore: null };
  }
}

/**
 * Get regular time scores from match data
 * Falls back to final scores if regular time scores are not available
 * @param match - Match object with scores
 * @returns Scores to use for standings
 */
export function getStandingsScores(match: MatchScoreSource): {
  homeScore: number;
  awayScore: number;
} {
  // Prefer regular time scores (excluding OT) if available
  if (match.home_score_regtime != null && match.away_score_regtime != null) {
    return {
      homeScore: Number(match.home_score_regtime),
      awayScore: Number(match.away_score_regtime),
    };
  }

  // Fallback to final scores if regular time not available
  return {
    homeScore: Number(match.home_score) || 0,
    awayScore: Number(match.away_score) || 0,
  };
}
