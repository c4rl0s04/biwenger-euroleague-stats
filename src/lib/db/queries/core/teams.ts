import { db, pgClient } from '../../index';

export interface Team {
  id: number;
  name: string;
  short_name: string;
  logo: string;
}

export interface TeamDetails extends Team {
  total_fantasy_points: number;
  total_real_points: number;
  avg_pir: number;
  total_value: number;
  roster_size: number;
  matches_played: number;
  playoff_probability: number;
  wins: number;
  losses: number;
  rank: number;
}

/**
 * Get regular season standings for all teams
 */
export async function getTeamRegularSeasonStandings() {
  const query = `
    WITH TeamStats AS (
      SELECT 
        team_id,
        SUM(win) as wins,
        SUM(loss) as losses,
        SUM(points_for) as points_for,
        SUM(points_against) as points_against
      FROM (
        SELECT 
          home_id as team_id,
          CASE WHEN home_score_regtime + COALESCE(home_ot, 0) > away_score_regtime + COALESCE(away_ot, 0) THEN 1 ELSE 0 END as win,
          CASE WHEN home_score_regtime + COALESCE(home_ot, 0) < away_score_regtime + COALESCE(away_ot, 0) THEN 1 ELSE 0 END as loss,
          home_score_regtime + COALESCE(home_ot, 0) as points_for,
          away_score_regtime + COALESCE(away_ot, 0) as points_against
        FROM matches WHERE status = 'finished' AND round_name LIKE 'Jornada %'
        UNION ALL
        SELECT 
          away_id as team_id,
          CASE WHEN away_score_regtime + COALESCE(away_ot, 0) > home_score_regtime + COALESCE(home_ot, 0) THEN 1 ELSE 0 END as win,
          CASE WHEN away_score_regtime + COALESCE(away_ot, 0) < home_score_regtime + COALESCE(home_ot, 0) THEN 1 ELSE 0 END as loss,
          away_score_regtime + COALESCE(away_ot, 0) as points_for,
          home_score_regtime + COALESCE(home_ot, 0) as points_against
        FROM matches WHERE status = 'finished' AND round_name LIKE 'Jornada %'
      ) all_matches
      GROUP BY team_id
    )
    SELECT 
      team_id,
      wins,
      losses,
      RANK() OVER (ORDER BY wins DESC, (points_for - points_against) DESC) as rank
    FROM TeamStats
  `;
  const res = await pgClient.query(query);
  return res.rows;
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
  return (await pgClient.query(query, [id])).rows[0];
}

/**
 * Get full team details including aggregated stats
 */
export async function getTeamDetails(id: number | string): Promise<TeamDetails | null> {
  const numericId = Number(id);
  if (isNaN(numericId)) return null;

  const query = `
    WITH TeamMatchStats AS (
      SELECT 
        team_id,
        SUM(win) as wins,
        SUM(loss) as losses
      FROM (
        SELECT 
          home_id as team_id,
          CASE WHEN home_score_regtime + COALESCE(home_ot, 0) > away_score_regtime + COALESCE(away_ot, 0) THEN 1 ELSE 0 END as win,
          CASE WHEN home_score_regtime + COALESCE(home_ot, 0) < away_score_regtime + COALESCE(away_ot, 0) THEN 1 ELSE 0 END as loss
        FROM matches WHERE status = 'finished' AND home_id = $1 AND round_name LIKE 'Jornada %'
        UNION ALL
        SELECT 
          away_id as team_id,
          CASE WHEN away_score_regtime + COALESCE(away_ot, 0) > home_score_regtime + COALESCE(home_ot, 0) THEN 1 ELSE 0 END as win,
          CASE WHEN away_score_regtime + COALESCE(away_ot, 0) < home_score_regtime + COALESCE(home_ot, 0) THEN 1 ELSE 0 END as loss
        FROM matches WHERE status = 'finished' AND away_id = $1 AND round_name LIKE 'Jornada %'
      ) all_matches
      GROUP BY team_id
    )
    SELECT 
      t.id,
      t.name,
      t.short_name,
      t.img as logo,
      COALESCE(SUM(prs.fantasy_points), 0) as total_fantasy_points,
      COALESCE(SUM(prs.points), 0) as total_real_points,
      COALESCE(ROUND(AVG(prs.valuation), 1), 0) as avg_pir,
      COALESCE(SUM(p.price), 0) as total_value,
      (SELECT COUNT(*) FROM players WHERE team_id = t.id) as roster_size,
      COALESCE(tms.wins, 0) as wins,
      COALESCE(tms.losses, 0) as losses
    FROM teams t
    LEFT JOIN players p ON t.id = p.team_id
    LEFT JOIN player_round_stats prs ON p.id = prs.player_id
    LEFT JOIN TeamMatchStats tms ON t.id = tms.team_id
    WHERE t.id = $1
    GROUP BY t.id, t.name, t.short_name, t.img, tms.wins, tms.losses
  `;

  const [res, matchesCount, playoffProb, allStandings] = await Promise.all([
    pgClient.query(query, [numericId]),
    getTeamMatchesCount(numericId),
    getTeamPlayoffProbability(numericId),
    getTeamRegularSeasonStandings(),
  ]);

  if (res.rows.length === 0) return null;

  const teamRank = allStandings.find((s: any) => Number(s.team_id) === numericId)?.rank || 0;

  const row = res.rows[0];
  return {
    ...row,
    total_fantasy_points: parseInt(row.total_fantasy_points),
    total_real_points: parseInt(row.total_real_points),
    avg_pir: parseFloat(row.avg_pir),
    total_value: parseInt(row.total_value),
    roster_size: parseInt(row.roster_size),
    wins: parseInt(row.wins),
    losses: parseInt(row.losses),
    rank: parseInt(teamRank),
    matches_played: matchesCount,
    playoff_probability: playoffProb,
  };
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

  const res = await pgClient.query(query, [numericTeamId]);
  return parseInt(res.rows[0]?.count || '0', 10);
}

/**
 * Get total matches played by all teams in the current season
 * Returns a Record mapping teamId -> matchesCount
 */
export async function getAllTeamMatchesCount(): Promise<Record<number, number>> {
  const query = `
    SELECT 
      t.id as team_id,
      COUNT(DISTINCT m.id) as count
    FROM teams t
    JOIN matches m ON (m.home_id = t.id OR m.away_id = t.id)
    WHERE m.date < NOW()
      AND m.round_id IN (SELECT DISTINCT round_id FROM player_round_stats)
    GROUP BY t.id
  `;
  const res = await pgClient.query(query);
  const result: Record<number, number> = {};
  for (const row of res.rows) {
    result[Number(row.team_id)] = parseInt(row.count, 10);
  }
  return result;
}

/**
 * Calculate the probability (1-99%) of all teams making the Playoffs/Play-in
 * Returns a Record mapping teamId -> probability
 */
export async function getAllTeamsPlayoffProbabilities(): Promise<Record<number, number>> {
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
  const standingsRes = await pgClient.query(standingsQuery);
  const standings = standingsRes.rows;

  const tenthPlace = standings.find((s) => Number(s.position) === 10);
  const tenthWins = tenthPlace ? Number(tenthPlace.wins) : 0;

  // 2. Fetch Form (Last 5 matches) for all teams
  const formQuery = `
    SELECT 
      team_id,
      SUM(win) as recent_wins,
      COUNT(*) as recent_matches
    FROM (
      SELECT 
        m.home_id as team_id,
        CASE WHEN (m.home_score_regtime + COALESCE(m.home_ot, 0) > m.away_score_regtime + COALESCE(m.away_ot, 0)) THEN 1 ELSE 0 END as win,
        ROW_NUMBER() OVER(PARTITION BY m.home_id ORDER BY m.date DESC) as rn
      FROM matches m WHERE m.status = 'finished'
      UNION ALL
      SELECT 
        m.away_id as team_id,
        CASE WHEN (m.away_score_regtime + COALESCE(m.away_ot, 0) > m.home_score_regtime + COALESCE(m.home_ot, 0)) THEN 1 ELSE 0 END as win,
        ROW_NUMBER() OVER(PARTITION BY m.away_id ORDER BY m.date DESC) as rn
      FROM matches m WHERE m.status = 'finished'
    ) recent
    WHERE rn <= 5
    GROUP BY team_id
  `;
  const formRes = await pgClient.query(formQuery);
  const formData = new Map(formRes.rows.map((r) => [Number(r.team_id), Number(r.recent_wins)]));

  // 3. Schedule Difficulty (Next 3 opponents average position) for all teams
  const nextMatchesQuery = `
    SELECT 
      team_id,
      opponent_id
    FROM (
      SELECT 
        m.home_id as team_id,
        m.away_id as opponent_id,
        ROW_NUMBER() OVER(PARTITION BY m.home_id ORDER BY m.date ASC) as rn
      FROM matches m WHERE m.date > NOW()
      UNION ALL
      SELECT 
        m.away_id as team_id,
        m.home_id as opponent_id,
        ROW_NUMBER() OVER(PARTITION BY m.away_id ORDER BY m.date ASC) as rn
      FROM matches m WHERE m.date > NOW()
    ) next_matches
    WHERE rn <= 3
  `;
  const nextMatchesRes = await pgClient.query(nextMatchesQuery);
  const nextOpponentsMap = new Map<number, number[]>();
  for (const row of nextMatchesRes.rows) {
    const tid = Number(row.team_id);
    const oppId = Number(row.opponent_id);
    if (!nextOpponentsMap.has(tid)) nextOpponentsMap.set(tid, []);
    nextOpponentsMap.get(tid)!.push(oppId);
  }

  const result: Record<number, number> = {};

  for (const teamStanding of standings) {
    const numericTeamId = Number(teamStanding.team_id);
    let probability = 50; // Base 50%
    const teamPosition = Number(teamStanding.position);
    const teamWins = Number(teamStanding.wins);

    // Rule 1: Standings logic
    if (teamPosition <= 4) probability = 95;
    else if (teamPosition <= 6) probability = 80;
    else if (teamPosition <= 10) probability = 60;
    else {
      const winDiff = tenthWins - teamWins;
      probability = 50 - winDiff * 15;
    }

    // Rule 2: Form logic
    const recentWins = formData.get(numericTeamId) || 0;
    if (recentWins === 5) probability += 15;
    else if (recentWins === 4) probability += 8;
    else if (recentWins === 3) probability += 2;
    else if (recentWins === 2) probability -= 2;
    else if (recentWins === 1) probability -= 8;
    else if (recentWins === 0) probability -= 15;

    // Rule 3: Schedule Difficulty logic
    const oppIds = nextOpponentsMap.get(numericTeamId) || [];
    if (oppIds.length > 0) {
      const oppPositions = standings
        .filter((s) => oppIds.includes(Number(s.team_id)))
        .map((s) => Number(s.position));

      if (oppPositions.length > 0) {
        const avgOppPosition =
          oppPositions.reduce((sum, pos) => sum + pos, 0) / oppPositions.length;
        if (avgOppPosition <= 6)
          probability -= 12; // Hard schedule
        else if (avgOppPosition >= 13) probability += 12; // Easy schedule
      }
    }

    // Boundary check
    if (probability > 99) probability = 99;
    if (probability < 1) probability = 1;

    result[numericTeamId] = Math.round(probability);
  }

  return result;
}

/**
 * Calculate the probability (1-99%) of a team making the Playoffs/Play-in
 */
export async function getTeamPlayoffProbability(teamId: number | string): Promise<number> {
  const numericTeamId = Number(teamId);
  if (isNaN(numericTeamId)) return 50; // Fallback neutral

  const allProbs = await getAllTeamsPlayoffProbabilities();
  return allProbs[numericTeamId] !== undefined ? allProbs[numericTeamId] : 50;
}
