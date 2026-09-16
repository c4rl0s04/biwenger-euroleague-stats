import { pgClient } from '../../client';
import { resolveReadSeasonId } from '../../season-context';

/**
 * Represents the recent form data for a single player.
 * - `recent_scores`: comma-separated string of last 5 results, e.g. "12,X,7,0,?,15"
 *   where:
 *     - positive/zero number: observed fantasy points (e.g. "12" or "0")
 *     - 'X': known DNP (is_dnp is true)
 *     - '?': unknown / unavailable (missing row or unobserved stat)
 * - `avg_recent_points`: average calculated ONLY over rounds where the player actually played
 *   (excluding 'X' and '?').
 * - `avg_form_score`: average over known team matches in window (DNPs count as 0, but '?'
 *   unknowns are not treated as 0 or DNP).
 */
export interface PlayerFormEntry {
  player_id: number;
  recent_scores: string;
  avg_recent_points: number | null; // Average only over rounds played
  avg_form_score: number | null; // Average over known team rounds in window (DNPs = 0, '?' excluded)
}

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

/**
 * Fetches the last N finished team matches for every player and returns a lookup map.
 *
 * Logic:
 *  - Finds the last `limit` FINISHED matches for each player's team (team-relative).
 *  - Categorizes player appearance:
 *      - prs.is_dnp IS TRUE -> 'X' (known DNP)
 *      - prs.fantasy_points IS NOT NULL -> numeric score (including '0')
 *      - else -> '?' (unknown/missing row)
 *  - Live/upcoming matches are excluded (status = 'finished' only).
 *
 * @param limit - Number of recent team matches to consider (default: 5)
 * @returns Map keyed by player_id
 */
export async function getPlayerFormMap(limit: number = 5): Promise<Map<number, PlayerFormEntry>> {
  const seasonId = await resolveReadSeasonId();
  const query = `
    WITH RecentMatchInfo AS (
      SELECT
        t.id AS team_id,
        m.round_id,
        m.date AS match_date,
        ROW_NUMBER() OVER (PARTITION BY t.id ORDER BY m.date DESC) AS team_rn
      FROM teams t
      JOIN matches m ON (m.home_id = t.id OR m.away_id = t.id)
      WHERE m.season_id = $2 AND m.status = 'finished'
    )
    SELECT
      p.id AS player_id,
      STRING_AGG(
        CASE
          WHEN prs.is_dnp IS TRUE THEN 'X'
          WHEN prs.fantasy_points IS NOT NULL THEN CAST(prs.fantasy_points AS TEXT)
          ELSE '?'
        END,
        ',' ORDER BY rmi.match_date DESC
      ) AS recent_scores
    FROM players p
    JOIN player_seasons ps ON ps.player_id = p.id AND ps.season_id = $2
    JOIN RecentMatchInfo rmi ON ps.team_id = rmi.team_id
    LEFT JOIN player_round_stats prs ON p.id = prs.player_id AND rmi.round_id = prs.round_id AND prs.season_id = $2
    WHERE rmi.team_rn <= $1
    GROUP BY p.id
  `;

  const rows = (await pgClient.query(query, [limit, seasonId])).rows;

  const map = new Map<number, PlayerFormEntry>();
  for (const row of rows) {
    const computed = computePlayerFormScores(row.recent_scores ?? '');
    map.set(Number(row.player_id), {
      player_id: Number(row.player_id),
      recent_scores: row.recent_scores ?? '',
      avg_recent_points: computed.avg_recent_points,
      avg_form_score: computed.avg_form_score,
    });
  }
  return map;
}
