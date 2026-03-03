import { db } from '../../client';

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
  const query = `
    SELECT 
      id,
      name,
      short_name,
      img as logo
    FROM teams
    WHERE id = $1
  `;
  return (await db.query(query, [id])).rows[0];
}

/**
 * Get total matches played by a team in the current season
 * Uses the player_round_stats table as the source of truth for valid rounds
 */
export async function getTeamMatchesCount(teamId: number | string): Promise<number> {
  const numericTeamId = Number(teamId);
  if (isNaN(numericTeamId)) return 0;

  const query = `
    SELECT COUNT(DISTINCT m.id) as count
    FROM matches m
    WHERE (m.home_id = $1 OR m.away_id = $1)
      AND m.date < NOW()
      AND m.round_id IN (SELECT DISTINCT round_id FROM player_round_stats)
  `;

  const res = await db.query(query, [numericTeamId]);
  return parseInt(res.rows[0]?.count || '0', 10);
}

/**
 * Calculate the probability (1-99%) of a team making the Playoffs/Play-in
 * based on Current Standings (70%), Form (15%) and Upcoming Schedule (15%).
 */
export async function getTeamPlayoffProbability(teamId: number | string): Promise<number> {
  const numericTeamId = Number(teamId);
  if (isNaN(numericTeamId)) return 50; // Fallback neutral

  // 1. Get current Euroleague standings based on finished matches
  const standingsQuery = `
    WITH TeamStandings AS (
      SELECT 
        team_id,
        SUM(wins) as wins,
        SUM(losses) as losses,
        SUM(points_scored) - SUM(points_conceded) as point_diff
      FROM (
        SELECT 
          home_id as team_id,
          CASE WHEN home_score_regtime + COALESCE(home_ot, 0) > away_score_regtime + COALESCE(away_ot, 0) THEN 1 ELSE 0 END as wins,
          CASE WHEN home_score_regtime + COALESCE(home_ot, 0) < away_score_regtime + COALESCE(away_ot, 0) THEN 1 ELSE 0 END as losses,
          home_score_regtime + COALESCE(home_ot, 0) as points_scored,
          away_score_regtime + COALESCE(away_ot, 0) as points_conceded
        FROM matches WHERE status = 'finished'
        UNION ALL
        SELECT 
          away_id as team_id,
          CASE WHEN away_score_regtime + COALESCE(away_ot, 0) > home_score_regtime + COALESCE(home_ot, 0) THEN 1 ELSE 0 END as wins,
          CASE WHEN away_score_regtime + COALESCE(away_ot, 0) < home_score_regtime + COALESCE(home_ot, 0) THEN 1 ELSE 0 END as losses,
          away_score_regtime + COALESCE(away_ot, 0) as points_scored,
          home_score_regtime + COALESCE(home_ot, 0) as points_conceded
        FROM matches WHERE status = 'finished'
      ) all_matches
      GROUP BY team_id
    ),
    RankedStandings AS (
      SELECT 
        team_id,
        wins,
        RANK() OVER (ORDER BY wins DESC, point_diff DESC) as position
      FROM TeamStandings
    )
    SELECT * FROM RankedStandings
  `;
  const standingsRes = await db.query(standingsQuery);
  const standings = standingsRes.rows;
  
  const teamStanding = standings.find(s => Number(s.team_id) === numericTeamId);
  if (!teamStanding) return 50; // Not enough data
  
  const tenthPlace = standings.find(s => Number(s.position) === 10);
  const tenthWins = tenthPlace ? Number(tenthPlace.wins) : 0;
  
  let probability = 50; // Base 50%
  const teamPosition = Number(teamStanding.position);
  const teamWins = Number(teamStanding.wins);
  
  // Rule 1: Standings logic (Base max 75%)
  if (teamPosition <= 4) probability = 95;
  else if (teamPosition <= 6) probability = 80;
  else if (teamPosition <= 10) probability = 60;
  else {
    // Penalty based on distance to 10th place
    const winDiff = tenthWins - teamWins;
    probability = 50 - (winDiff * 15);
  }

  // Rule 2: Recent Form (Last 5 matches) - Peso 15%
  const formQuery = `
    SELECT 
      CASE
        WHEN (m.home_id = $1 AND (m.home_score_regtime + COALESCE(m.home_ot, 0) > m.away_score_regtime + COALESCE(m.away_ot, 0))) OR
             (m.away_id = $1 AND (m.away_score_regtime + COALESCE(m.away_ot, 0) > m.home_score_regtime + COALESCE(m.home_ot, 0)))
        THEN 1 ELSE 0
      END as win
    FROM matches m
    WHERE (m.home_id = $1 OR m.away_id = $1) AND m.status = 'finished'
    ORDER BY m.date DESC
    LIMIT 5
  `;
  const formRes = await db.query(formQuery, [numericTeamId]);
  const recentWins = formRes.rows.filter(r => r.win === 1).length;
  const recentMatches = formRes.rows.length;

  if (recentMatches > 0) {
    if (recentWins === 5) probability += 15;
    else if (recentWins === 4) probability += 8;
    else if (recentWins === 3) probability += 2;
    else if (recentWins === 2) probability -= 2;
    else if (recentWins === 1) probability -= 8;
    else if (recentWins === 0) probability -= 15;
  }

  // Rule 3: Schedule Difficulty (Next 3 opponents average position) - Peso 15%
  const nextMatchesQuery = `
    SELECT
      CASE WHEN m.home_id = $1 THEN m.away_id ELSE m.home_id END as opponent_id
    FROM matches m
    WHERE (m.home_id = $1 OR m.away_id = $1) AND m.date > NOW()
    ORDER BY m.date ASC
    LIMIT 3
  `;
  const nextMatchesRes = await db.query(nextMatchesQuery, [numericTeamId]);
  
  if (nextMatchesRes.rows.length > 0) {
    let opponentPositionsSum = 0;
    let validOpponents = 0;
    
    for (const match of nextMatchesRes.rows) {
      const oppStanding = standings.find(s => s.team_id === match.opponent_id);
      if (oppStanding) {
        opponentPositionsSum += Number(oppStanding.position);
        validOpponents++;
      }
    }
    
    if (validOpponents > 0) {
      const avgOppPosition = opponentPositionsSum / validOpponents;
      
      if (avgOppPosition <= 6) probability -= 12; // Hard schedule
      else if (avgOppPosition >= 13) probability += 12; // Easy schedule
      // Normal schedule (7-12) has neutal impact
    }
  }

  // Bounds limit [1, 99]
  return Math.min(Math.max(Math.round(probability), 1), 99);
}
