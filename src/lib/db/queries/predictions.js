import { db } from '../client';

/**
 * Fetches all statistics needed for the predictions dashboard.
 * Optimizes performance by using parallel queries where possible.
 */
export async function getPorrasStats() {
  // Parallelize independent queries
  const [achievements, participation, tableStats, performance, history] = await Promise.all([
    getAchievements(),
    getParticipation(),
    getTableStats(),
    getPerformanceData(),
    getHistoryPivot(),
  ]);

  const clutch = await getClutchStats(); // Dependent on identifying recent rounds? No, usually standalone logic.
  const victories = await getVictorias();

  return {
    achievements,
    participation,
    table_stats: tableStats,
    performance,
    history,
    clutch_stats: clutch,
    porra_stats: {
      // Grouping common stats under the structure expected by the UI if needed
      victorias: victories,
      promedios: tableStats, // Refers to the main leaderboard table
      mejor_jornada: await getBestRoundStat(),
    },
  };
}

async function getAchievements() {
  const perfect10Query = `
    SELECT p.aciertos, p.round_name as jornada, u.name as usuario
    FROM porras p
    JOIN users u ON p.user_id = u.id
    WHERE p.aciertos = 10
    ORDER BY p.round_id DESC
  `;

  const blankedQuery = `
    SELECT p.aciertos, p.round_name as jornada, u.name as usuario
    FROM porras p
    JOIN users u ON p.user_id = u.id
    WHERE p.aciertos = 0
    ORDER BY p.round_id DESC
  `;

  const [perfect10, blanked] = await Promise.all([
    db.query(perfect10Query),
    db.query(blankedQuery),
  ]);

  return {
    perfect_10: perfect10.rows,
    blanked: blanked.rows,
  };
}

async function getParticipation() {
  const query = `
    SELECT round_name as jornada, COUNT(DISTINCT user_id) as count
    FROM porras
    GROUP BY round_id, round_name
    ORDER BY round_id ASC
  `;
  const res = await db.query(query);
  return res.rows;
}

async function getPerformanceData() {
  const query = `
    SELECT p.round_name as jornada, u.name as usuario, p.aciertos
    FROM porras p
    JOIN users u ON p.user_id = u.id
    ORDER BY p.round_id ASC
  `;
  const res = await db.query(query);
  return res.rows;
}

async function getTableStats() {
  // Calculates average, total, min, max, count for each user
  const query = `
    WITH UserStats AS (
        SELECT 
            p.user_id,
            u.name as usuario,
            COUNT(p.round_id) as jornadas_jugadas,
            SUM(p.aciertos) as total_aciertos,
            AVG(p.aciertos) as promedio,
            MAX(p.aciertos) as mejor_jornada,
            MIN(p.aciertos) as peor_jornada
        FROM porras p
        JOIN users u ON p.user_id = u.id
        GROUP BY p.user_id, u.name
    )
    SELECT * FROM UserStats
    ORDER BY promedio DESC
  `;
  const res = await db.query(query);
  return res.rows;
}

async function getClutchStats() {
  // Get the last 3 rounds IDs
  const roundsQuery = `SELECT DISTINCT round_id FROM porras ORDER BY round_id DESC LIMIT 3`;
  const roundsRes = await db.query(roundsQuery);

  if (roundsRes.rows.length === 0) return [];

  const roundIds = roundsRes.rows.map((r) => r.round_id);

  const query = `
    SELECT 
        u.name as usuario,
        AVG(p.aciertos) as avg_last_3
    FROM porras p
    JOIN users u ON p.user_id = u.id
    WHERE p.round_id = ANY($1::int[])
    GROUP BY p.user_id, u.name
    HAVING COUNT(p.round_id) >= 1
    ORDER BY avg_last_3 DESC
    LIMIT 5
  `;

  const res = await db.query(query, [roundIds]);
  return res.rows;
}

async function getVictorias() {
  // 1. Calculate max score per round
  // 2. Count how many times each user achieved that max score

  const query = `
    WITH RoundMax AS (
        SELECT round_id, MAX(aciertos) as max_score
        FROM porras
        GROUP BY round_id
    ),
    Winners AS (
        SELECT p.user_id, p.round_id
        FROM porras p
        JOIN RoundMax rm ON p.round_id = rm.round_id AND p.aciertos = rm.max_score
    )
    SELECT 
        u.name as usuario,
        COUNT(w.round_id) as victorias
    FROM Winners w
    JOIN users u ON w.user_id = u.id
    GROUP BY w.user_id, u.name
    ORDER BY victorias DESC
  `;

  const res = await db.query(query);
  return res.rows;
}

async function getBestRoundStat() {
  // Returns top single round performance of all time
  const query = `
    SELECT u.name as usuario, p.aciertos, p.round_name as jornada
    FROM porras p
    JOIN users u ON p.user_id = u.id
    ORDER BY p.aciertos DESC, p.round_id DESC
    LIMIT 5
  `;
  const res = await db.query(query);
  return res.rows;
}

async function getHistoryPivot() {
  // Get all rounds first
  const roundsRes = await db.query(
    'SELECT DISTINCT round_id, round_name FROM porras ORDER BY round_id DESC'
  );
  const rounds = roundsRes.rows;

  // Get all users
  const usersRes = await db.query(
    'SELECT DISTINCT u.name FROM users u JOIN porras p ON p.user_id = u.id ORDER BY u.name'
  );
  const users = usersRes.rows.map((r) => r.name);

  // Get all scores
  const scoresQuery = `
    SELECT p.round_id, u.name as usuario, p.aciertos
    FROM porras p
    JOIN users u ON p.user_id = u.id
  `;
  const scoresRes = await db.query(scoresQuery);

  // Pivot data in JS
  const pivotData = rounds.map((round) => {
    const row = {
      id: round.round_id,
      name: round.round_name,
      scores: {},
    };

    users.forEach((user) => {
      const match = scoresRes.rows.find((s) => s.round_id === round.round_id && s.usuario === user);
      row.scores[user] = match ? match.aciertos : null;
    });

    return row;
  });

  return {
    users,
    jornadas: pivotData,
  };
}
