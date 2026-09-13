import { pgClient } from '../../connection';
import { resolveReadSeasonId } from '../../season-context';

export interface Team {
  id: number;
  name: string;
  short_name: string;
  logo: string;
}

/**
 * Get team details by ID
 */
export async function getTeamById(id: number | string): Promise<Team | undefined> {
  const seasonId = await resolveReadSeasonId();
  const query = `
    SELECT 
      t.id,
      t.name,
      t.short_name,
      COALESCE(otm.crest_url, t.img) as logo
    FROM teams t
    LEFT JOIN official_team_mappings otm
      ON otm.team_id=t.id AND otm.season_id=$2 AND otm.provider='euroleague_advanced'
    WHERE t.id = $1
  `;
  return (await pgClient.query(query, [id, seasonId])).rows[0];
}

/**
 * Get total matches played by a team in the current season
 * Uses the player_round_stats table as the source of truth for valid rounds
 */
export { getTeamMatchesCount } from '@/features/teams/server';

/**
 * Get total matches played by all teams in the current season
 * Returns a Record mapping teamId -> matchesCount
 */
export { getAllTeamMatchesCount } from '@/features/teams/server';

/**
 * Calculate the probability (1-99%) of all teams making the Playoffs/Play-in
 * Returns a Record mapping teamId -> probability
 */
export { getAllTeamsPlayoffProbabilities } from '@/features/teams/server';

/**
 * Calculate the probability (1-99%) of a team making the Playoffs/Play-in
 */
export { getTeamPlayoffProbability } from '@/features/teams/server';
