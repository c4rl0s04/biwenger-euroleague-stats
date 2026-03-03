import 'dotenv/config';
import { db } from './src/lib/db/client';
import { getAllTeamsPlayoffProbabilities, getAllTeamMatchesCount } from './src/lib/db/queries/core/teams';

async function calculateSquadScores() {
  console.log('Fetching players and deriving scores...');

  try {
    // 1. Fetch raw data
    const [teamPlayoffProbs, teamMatchCounts] = await Promise.all([
      getAllTeamsPlayoffProbabilities(),
      getAllTeamMatchesCount()
    ]);

    const query = `
      WITH RecentRounds AS (
        SELECT DISTINCT round_id
        FROM player_round_stats
        ORDER BY round_id DESC
        LIMIT 5
      ),
      RoundCount AS (
        SELECT COUNT(*) as total_rounds FROM RecentRounds
      ),
      PlayerForm AS (
        SELECT 
          prs.player_id,
          SUM(prs.fantasy_points) * 1.0 / NULLIF((SELECT total_rounds FROM RoundCount), 0) as avg_recent_points
        FROM player_round_stats prs
        JOIN RecentRounds rr ON prs.round_id = rr.round_id
        GROUP BY prs.player_id
      ),
      PlayerTotals AS (
        SELECT 
          player_id,
          COUNT(*) as games_played,
          ROUND(AVG(fantasy_points), 1) as season_avg,
          MIN(fantasy_points) as min_points,
          MAX(fantasy_points) as max_points
        FROM player_round_stats
        GROUP BY player_id
      )
      SELECT 
        p.id as player_id,
        p.name,
        p.owner_id,
        u.name as owner_name,
        t.id as team_id,
        COALESCE(pf.avg_recent_points, 0) as avg_recent_points,
        COALESCE(pt.season_avg, 0) as season_avg,
        pt.min_points,
        pt.max_points,
        pt.games_played
      FROM players p
      JOIN users u ON p.owner_id = u.id
      LEFT JOIN teams t ON p.team_id = t.id
      LEFT JOIN PlayerForm pf ON p.id = pf.player_id
      LEFT JOIN PlayerTotals pt ON p.id = pt.player_id
      WHERE p.owner_id IS NOT NULL AND p.owner_id != '0'
    `;

    const result = await (db as any).query(query);
    const players = result.rows;

    // 2. Compute scores
    const playerScores = players.map((row: any) => {
      const min_points = parseInt(row.min_points) || 0;
      const max_points = parseInt(row.max_points) || 0;
      const games_played = parseInt(row.games_played) || 0;
      const team_games_played = teamMatchCounts[parseInt(row.team_id)] || 1;
      const season_avg = parseFloat(row.season_avg) || 0;
      const avg_recent_points = parseFloat(row.avg_recent_points) || 0;
      const team_prob = teamPlayoffProbs[parseInt(row.team_id)] || 50;

      let totalScore = 0;

      // - Suelo (10%)
      let sueloScore = 0;
      if (min_points >= 10) sueloScore = 10;
      else if (min_points > 0) sueloScore = min_points;
      else if (min_points < 0) sueloScore = 0;
      totalScore += sueloScore;

      // - Techo (15%) -> High ceilings (30+) get full points
      let techoScore = Math.min((max_points / 30) * 15, 15);
      totalScore += techoScore;
      
      // - Promedio Absoluto (25%) -> Very important
      let avgScore = Math.min((season_avg / 16) * 25, 25);
      totalScore += avgScore;

      // - Asistencia / Disponibilidad (10%)
      let attendanceScore = (Math.min(games_played / Math.max(1, team_games_played), 1)) * 10;
      totalScore += Math.max(0, attendanceScore);

      // - Rentabilidad / Flujo is omitted for lineups, so we redistribute 15% to Context and Form
      // - Momento de Forma (20%) -> boosted from 15%
      let formScore = 10; // neutral
      const formDiff = avg_recent_points - season_avg;
      if (games_played < 3) formScore = 8;
      else if (avg_recent_points >= 18 || formDiff >= 6) formScore = 20;
      else if (avg_recent_points >= 14 || formDiff >= 3) formScore = 16;
      else if (formDiff >= 0) formScore = 12;
      else if (formDiff > -3) formScore = 8;
      else if (formDiff > -6) formScore = 4;
      else formScore = 0;
      totalScore += formScore;

      // - Contexto Equipo (20%), boosted from 10%
      let teamContextScore = (team_prob / 100) * 20;
      totalScore += teamContextScore;

      const finalScore = Math.round(Math.max(0, Math.min(100, totalScore)));

      return {
        ...row,
        score: finalScore
      };
    });

    // 3. Group by user, sort, taking top 10
    const byUser: Record<string, any[]> = {};
    for (const p of playerScores) {
      if (!byUser[p.owner_name]) byUser[p.owner_name] = [];
      byUser[p.owner_name].push(p);
    }

    const leaderboard = [];

    for (const [user, userPlayers] of Object.entries(byUser)) {
      userPlayers.sort((a, b) => b.score - a.score);
      const top10 = userPlayers.slice(0, 10);
      
      const sum = top10.reduce((acc, p) => acc + p.score, 0);
      const avg = top10.length > 0 ? (sum / top10.length).toFixed(1) : '0.0';

      leaderboard.push({
        name: user,
        score: parseFloat(avg as string),
        topTierCount: top10.filter(p => p.score >= 85).length,
        midTierCount: top10.filter(p => p.score >= 70 && p.score < 85).length,
        top10Names: top10.map(p => p.name + ' (' + p.score + ')').join(', ')
      });
    }

    leaderboard.sort((a, b) => b.score - a.score);

    console.log('\\n🏆 === SQUAD POWER RANKINGS (Based on Top 10 Core) === 🏆\\n');
    leaderboard.forEach((lb, i) => {
      console.log((i + 1) + '. ' + lb.name + ' - Rating: ' + lb.score + '/100');
      console.log('   ⭐ Estrellas (85+): ' + lb.topTierCount + ' | 🟢 Titulares (70+): ' + lb.midTierCount);
      console.log('   🔑 Top 10: ' + lb.top10Names);
      console.log('--------------------------------------------------');
    });

  } catch (error) {
    console.error('Error calculating:', error);
  } finally {
    process.exit(0);
  }
}

calculateSquadScores();
