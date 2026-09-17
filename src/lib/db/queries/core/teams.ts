import { pgClient } from '../../client';
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

export {
  getTeamMatchesCount,
  getAllTeamMatchesCount,
  getAllTeamsPlayoffProbabilities,
  getTeamPlayoffProbability,
} from '@/features/teams/server';
