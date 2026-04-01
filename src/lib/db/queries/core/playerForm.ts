import { pgClient } from '../../index';

/**
 * Represents the recent form data for a single player.
 * - `recent_scores`: comma-separated string of last 5 results, e.g. "12,X,7,0,15"
 *   where 'X' means the player's team played but the player did NOT (DNP/injury).
 * - `avg_recent_points`: average calculated ONLY over rounds where the player appeared.
 *   DNP ('X') rounds are excluded from the average.
 */
export interface PlayerFormEntry {
  player_id: number;
  recent_scores: string;
  avg_recent_points: number; // Average only over rounds played
  avg_form_score: number; // Average over all team rounds in window (DNPs = 0)
}

/**
 * Fetches the last N finished team matches for every player and returns a lookup map.
 *
 * Logic:
 *  - Finds the last `limit` FINISHED matches for each player's team (team-relative).
 *  - LEFT JOINs player stats: if a player has no row for a finished team match → 'X' (DNP).
 *  - If a player played and scored 0, it shows as '0' and counts toward the average.
 *  - Live/upcoming matches are excluded (status = 'finished' only).
 *
 * @param limit - Number of recent team matches to consider (default: 5)
 * @returns Map keyed by player_id
 */
export async function getPlayerFormMap(limit: number = 5): Promise<Map<number, PlayerFormEntry>> {
  const query = `
    WITH RecentMatchInfo AS (
      SELECT
        t.id AS team_id,
        m.round_id,
        m.date AS match_date,
        ROW_NUMBER() OVER (PARTITION BY t.id ORDER BY m.date DESC) AS team_rn
      FROM teams t
      JOIN matches m ON (m.home_id = t.id OR m.away_id = t.id)
      WHERE m.status = 'finished'
    )
    SELECT
      p.id AS player_id,
      STRING_AGG(
        COALESCE(CAST(prs.fantasy_points AS TEXT), 'X'),
        ',' ORDER BY rmi.match_date DESC
      ) AS recent_scores,
      AVG(prs.fantasy_points) AS avg_recent_points
    FROM players p
    JOIN RecentMatchInfo rmi ON p.team_id = rmi.team_id
    LEFT JOIN player_round_stats prs ON p.id = prs.player_id AND rmi.round_id = prs.round_id
    WHERE rmi.team_rn <= $1
    GROUP BY p.id
  `;

  const rows = (await pgClient.query(query, [limit])).rows;

  const map = new Map<number, PlayerFormEntry>();
  for (const row of rows) {
    const scores = (row.recent_scores ?? '').split(',');
    // Calculate form score by treating 'X' as 0 and dividing by the limit
    const totalPoints = scores.reduce((sum: number, s: string) => {
      if (s === 'X') return sum;
      return sum + (parseFloat(s) || 0);
    }, 0);

    // Divide by the requested 'limit' to penalize missing games
    const avgFormScore = totalPoints / limit;

    map.set(Number(row.player_id), {
      player_id: Number(row.player_id),
      recent_scores: row.recent_scores ?? '',
      avg_recent_points: parseFloat(row.avg_recent_points) || 0,
      avg_form_score: parseFloat(avgFormScore.toFixed(2)),
    });
  }
  return map;
}
