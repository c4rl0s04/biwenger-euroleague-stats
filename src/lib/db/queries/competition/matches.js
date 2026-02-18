import { db } from '../../client.js';

export async function getMatchesGroupedByRound() {
  const query = `
    SELECT 
      m.id,
      m.round_id,
      m.home_score,
      m.away_score,
      m.date,
      m.status,
      
      -- Home Team
      th.id as home_id,
      th.name as home_name,
      th.img as home_img,
      
      -- Away Team
      ta.id as away_id,
      ta.name as away_name,
      ta.img as away_img

      -- Round info
      -- (SELECT name FROM rounds WHERE id = m.round_id) as round_name
      
    FROM matches m
    JOIN teams th ON m.home_id = th.id
    JOIN teams ta ON m.away_id = ta.id
    ORDER BY m.round_id ASC, m.date ASC, m.id ASC
  `;

  const res = await db.query(query);

  // Group by round
  const grouped = res.rows.reduce((acc, match) => {
    const roundId = match.round_id;
    if (!acc[roundId]) {
      acc[roundId] = {
        round_id: roundId,
        round_name: match.round_name || `Jornada ${roundId}`,
        matches: [],
      };
    }

    acc[roundId].matches.push({
      id: match.id,
      date: match.date,
      status: match.status,
      home: {
        id: match.home_id,
        name: match.home_name,
        img: match.home_img,
        score: match.home_score,
      },
      away: {
        id: match.away_id,
        name: match.away_name,
        img: match.away_img,
        score: match.away_score,
      },
    });

    return acc;
  }, {});

  // Convert to array
  const roundsArr = Object.values(grouped);

  // Sort by date (earliest first) to assign correct round numbers 1-38
  roundsArr.sort((a, b) => {
    // get earliest date in each round
    const dateA = a.matches[0]?.date ? new Date(a.matches[0].date) : new Date(0);
    const dateB = b.matches[0]?.date ? new Date(b.matches[0].date) : new Date(0);
    return dateA - dateB;
  });

  // Assign sequential names
  roundsArr.forEach((round, index) => {
    round.round_name = `Jornada ${index + 1}`;
    // Assign a logical index if round_id is arbitrary
    round.round_index = index + 1;
  });

  return roundsArr;
}

/**
 * Get upcoming matches
 * @param {number} limit
 */
export async function getUpcomingMatches(limit = 5) {
  const query = `
    SELECT 
      m.id,
      m.date,
      t1.name as home_team,
      t2.name as away_team
    FROM matches m
    JOIN teams t1 ON m.home_id = t1.id
    JOIN teams t2 ON m.away_id = t2.id
    WHERE m.date > NOW()
    ORDER BY m.date ASC
    LIMIT $1
  `;
  return (await db.query(query, [limit])).rows;
}

/**
 * Get recent match results
 * @param {number} limit
 */
export async function getRecentResults(limit = 5) {
  const query = `
    SELECT 
      m.id,
      m.date,
      t1.name as home_team,
      t2.name as away_team,
      m.home_score,
      m.away_score
    FROM matches m
    JOIN teams t1 ON m.home_id = t1.id
    JOIN teams t2 ON m.away_id = t2.id
    WHERE m.status = 'finished'
    ORDER BY m.date DESC
    LIMIT $1
  `;
  return (await db.query(query, [limit])).rows;
}
