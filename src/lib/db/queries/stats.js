import { db } from '../client.js';

/**
 * Get Market KPIs
 * @returns {Promise<Object>} Market statistics
 */
export async function getMarketKPIs() {
  const query = `
    SELECT 
      COUNT(*) as total_transfers,
      ROUND(AVG(precio), 2) as avg_value,
      MAX(precio) as max_value,
      MIN(precio) as min_value,
      COUNT(DISTINCT comprador) as active_buyers,
      COUNT(DISTINCT vendedor) as active_sellers
    FROM fichajes
  `;

  const kpis = (await db.query(query)).rows[0];
  return {
    ...kpis,
    total_transfers: parseInt(kpis?.total_transfers) || 0,
    avg_value: parseFloat(kpis?.avg_value) || 0,
    active_buyers: parseInt(kpis?.active_buyers) || 0,
    active_sellers: parseInt(kpis?.active_sellers) || 0,
    max_value: parseInt(kpis?.max_value) || 0,
    min_value: parseInt(kpis?.min_value) || 0,
  };
}

/**
 * Get league standings (Latest)
 * @returns {Promise<Array>} Current standings with user details
 */
export async function getStandings() {
  const query = `
    WITH UserTotals AS (
      SELECT 
        user_id,
        SUM(points) as total_points
      FROM user_rounds
      WHERE participated = TRUE
      GROUP BY user_id
    )
    SELECT 
      u.id as user_id,
      u.name,
      u.icon,
      u.color_index,
      COALESCE(ut.total_points, 0) as total_points,
      COALESCE(sq.team_value, 0) as team_value,
      COALESCE(sq.price_trend, 0) as price_trend,
      RANK() OVER (ORDER BY COALESCE(ut.total_points, 0) DESC) as position
    FROM users u
    LEFT JOIN UserTotals ut ON u.id = ut.user_id
    LEFT JOIN (
      SELECT 
        owner_id, 
        SUM(price) as team_value,
        SUM(price_increment) as price_trend
      FROM players
      WHERE owner_id IS NOT NULL
      GROUP BY owner_id
    ) sq ON u.id = sq.owner_id
    ORDER BY position ASC
  `;
  return (await db.query(query)).rows;
}

/**
 * Get comparison with league leader
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Leader comparison
 */
export async function getLeaderComparison(userId) {
  const standings = await getStandings();
  const leader = standings[0];
  const secondPlace = standings[1];
  // Ensure we compare strings properly if IDs are mixed types in DB/JS
  const user = standings.find((u) => String(u.user_id) === String(userId));

  if (!user || !leader) return null;

  const gap = leader.total_points - user.total_points;
  // If user.position is string (e.g. from bigInt), convert. But here it's from RANK so it's number/string.
  const pos = parseInt(user.position);
  const roundsNeeded = pos > 1 ? Math.ceil(gap / 10) : 0;

  const gapToSecond = pos === 1 && secondPlace ? user.total_points - secondPlace.total_points : 0;

  return {
    leader_name: leader.name,
    leader_points: leader.total_points,
    user_points: user.total_points,
    gap: gap,
    gap_to_second: gapToSecond,
    rounds_needed: roundsNeeded,
    is_leader: pos === 1,
  };
}

/**
 * Get league average points per round
 * @returns {Promise<number>} Average points
 */
export async function getLeagueAveragePoints() {
  const query = `
    SELECT ROUND(AVG(points), 1) as avg_points
    FROM user_rounds
    WHERE participated = TRUE
  `;

  const result = (await db.query(query)).rows[0];
  return result ? parseFloat(result.avg_points) : 0;
}

/**
 * Get recent records broken
 * @returns {Promise<Array>} Recent league records
 */
export async function getRecentRecords() {
  const records = [];

  const highestRoundQuery = `
    SELECT 
      ur.user_id,
      u.name as user_name,
      ur.round_name,
      ur.points
    FROM user_rounds ur
    JOIN users u ON ur.user_id = u.id
    WHERE ur.participated = TRUE
    ORDER BY ur.points DESC
    LIMIT 1
  `;
  const highestRound = (await db.query(highestRoundQuery)).rows[0];
  if (highestRound) {
    records.push({
      type: 'highest_round',
      label: 'Récord de puntos en jornada',
      description: `${highestRound.user_name} - ${highestRound.points} pts en ${highestRound.round_name}`,
      user_name: highestRound.user_name,
      value: highestRound.points,
    });
  }

  const highestTransferQuery = `
    SELECT 
      f.precio,
      p.name as player_name,
      f.comprador,
      f.fecha
    FROM fichajes f
    JOIN players p ON f.player_id = p.id
    ORDER BY f.precio DESC
    LIMIT 1
  `;
  const highestTransfer = (await db.query(highestTransferQuery)).rows[0];
  if (highestTransfer) {
    records.push({
      type: 'highest_transfer',
      label: 'Fichaje más caro',
      description: `${highestTransfer.player_name} - ${(parseInt(highestTransfer.precio) / 1000000).toFixed(2)}M€ (${highestTransfer.comprador})`,
      user_name: highestTransfer.comprador,
      value: highestTransfer.precio,
    });
  }

  const biggestGainQuery = `
    SELECT 
      id,
      name,
      price_increment,
      owner_id
    FROM players
    WHERE price_increment > 0
    ORDER BY price_increment DESC
    LIMIT 1
  `;
  const biggestGain = (await db.query(biggestGainQuery)).rows[0];
  if (biggestGain && biggestGain.price_increment > 0) {
    records.push({
      type: 'biggest_gain',
      label: 'Mayor revalorización',
      description: `${biggestGain.name} +${(parseInt(biggestGain.price_increment) / 1000000).toFixed(2)}M€`,
      player_name: biggestGain.name,
      value: biggestGain.price_increment,
    });
  }

  return records.slice(0, 3);
}

/**
 * Get stat leaders (Top 5)
 * @param {string} type - Stat type (real_points, rebounds, assists, pir)
 * @returns {Promise<Array>} List of top players for the stat
 */
export async function getStatLeaders(type = 'points') {
  const columnMap = {
    real_points: 'points',
    points: 'points',
    rebounds: 'rebounds',
    assists: 'assists',
    pir: 'valuation',
  };

  const column = columnMap[type] || 'points';

  // Sanitize column name to prevent SQL injection (though key is mapped above)
  const query = `
    SELECT 
      p.id as player_id,
      p.name,
      t.id as team_id,
      t.name as team,
      p.owner_id,
      u.name as owner_name,
      u.color_index as owner_color_index,
      SUM(prs.${column}) as value,
      COUNT(prs.id) as games_played,
      ROUND(AVG(prs.${column}), 1) as avg_value
    FROM player_round_stats prs
    JOIN players p ON prs.player_id = p.id
    LEFT JOIN teams t ON p.team_id = t.id
    LEFT JOIN users u ON p.owner_id = u.id
    GROUP BY p.id, p.name, t.id, t.name, p.owner_id, u.name, u.color_index
    HAVING SUM(prs.${column}) > 0
    ORDER BY value DESC
    LIMIT 5
  `;

  try {
    return (await db.query(query)).rows.map((row) => ({
      ...row,
      value: parseFloat(row.value) || 0,
      avg_value: parseFloat(row.avg_value) || 0,
    }));
  } catch (error) {
    console.error('Error fetching stat leaders:', error);
    return [];
  }
}
