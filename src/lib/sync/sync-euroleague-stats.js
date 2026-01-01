import {
  fetchBoxScore,
  fetchGameHeader,
  parseBoxScoreStats,
  normalizePlayerName,
} from '../api/euroleague-client.js';

const CURRENT_SEASON = 'E2025';

/**
 * Syncs game stats from Euroleague official API.
 * This replaces the old Biwenger stats sync for more accurate data.
 *
 * @param {import('better-sqlite3').Database} db - Database instance
 * @param {number} gameCode - Euroleague game code (1, 2, 3...)
 * @param {number} roundId - Round ID for our database
 * @param {string} roundName - Round name
 */
export async function syncEuroleagueGameStats(db, gameCode, roundId, roundName) {
  console.log(`📊 Syncing Euroleague game ${gameCode} for round ${roundId}...`);

  try {
    // 1. Fetch game header for match info
    const header = await fetchGameHeader(gameCode, CURRENT_SEASON);

    if (!header || !header.TeamA) {
      console.log(`   ⚠️ Game ${gameCode} has no data yet`);
      return { success: false, reason: 'no_data' };
    }

    // 2. Insert/update match record
    const insertMatch = db.prepare(`
      INSERT INTO matches (round_id, round_name, home_team, away_team, date, status, home_score, away_score)
      VALUES (@round_id, @round_name, @home_team, @away_team, @date, @status, @home_score, @away_score)
      ON CONFLICT(round_id, home_team, away_team) DO UPDATE SET
        round_name=excluded.round_name,
        status=excluded.status,
        home_score=excluded.home_score,
        away_score=excluded.away_score,
        date=excluded.date
    `);

    // Parse date from "03/10/2024" format
    const [day, month, year] = header.Date.split('/');
    const matchDate = `${year}-${month}-${day}`;

    insertMatch.run({
      round_id: roundId,
      round_name: roundName,
      home_team: header.TeamA,
      away_team: header.TeamB,
      date: matchDate,
      status: header.Live ? 'live' : 'finished',
      home_score: parseInt(header.ScoreA) || 0,
      away_score: parseInt(header.ScoreB) || 0,
    });

    // 3. Fetch box score with player stats
    const boxscore = await fetchBoxScore(gameCode, CURRENT_SEASON);
    
    // Handle future games with no stats yet
    if (!boxscore) {
      console.log(`   ⏭️ Game ${gameCode} has no box score yet (future game)`);
      return { success: true, reason: 'no_boxscore_yet' };
    }
    
    const playerStats = parseBoxScoreStats(boxscore);

    if (playerStats.length === 0) {
      console.log(`   ⚠️ No player stats for game ${gameCode}`);
      return { success: false, reason: 'no_stats' };
    }

    // 4. Get player ID mapping (euroleague_code -> biwenger id)
    const getPlayerByEuroleagueCode = db.prepare(
      'SELECT id, name FROM players WHERE euroleague_code = ?'
    );

    // Also prepare fallback: find by name similarity
    const getAllPlayers = db.prepare('SELECT id, name, team FROM players');
    const allPlayers = getAllPlayers.all();

    // Build normalized name lookup
    const playerNameMap = new Map();
    for (const p of allPlayers) {
      const normalized = normalizePlayerName(p.name);
      playerNameMap.set(normalized, p);
    }

    // Prepare update statements
    const updateEuroleagueCode = db.prepare(
      'UPDATE players SET euroleague_code = @euroleague_code WHERE id = @id'
    );

    const insertStats = db.prepare(`
      INSERT INTO player_round_stats (
        player_id, round_id, fantasy_points, minutes, points,
        two_points_made, two_points_attempted,
        three_points_made, three_points_attempted,
        free_throws_made, free_throws_attempted,
        rebounds, assists, steals, blocks, turnovers, fouls_committed, valuation
      ) VALUES (
        @player_id, @round_id, @fantasy_points, @minutes, @points,
        @two_points_made, @two_points_attempted,
        @three_points_made, @three_points_attempted,
        @free_throws_made, @free_throws_attempted,
        @rebounds, @assists, @steals, @blocks, @turnovers, @fouls_committed, @valuation
      )
      ON CONFLICT(player_id, round_id) DO UPDATE SET
        minutes=excluded.minutes,
        points=excluded.points,
        two_points_made=excluded.two_points_made,
        two_points_attempted=excluded.two_points_attempted,
        three_points_made=excluded.three_points_made,
        three_points_attempted=excluded.three_points_attempted,
        free_throws_made=excluded.free_throws_made,
        free_throws_attempted=excluded.free_throws_attempted,
        rebounds=excluded.rebounds,
        assists=excluded.assists,
        steals=excluded.steals,
        blocks=excluded.blocks,
        turnovers=excluded.turnovers,
        fouls_committed=excluded.fouls_committed,
        valuation=excluded.valuation
    `);

    let matched = 0;
    let unmatched = 0;

    db.transaction(() => {
      for (const stat of playerStats) {
        let playerId = null;

        // Try to find by euroleague_code first
        const existing = getPlayerByEuroleagueCode.get(stat.euroleague_code);
        if (existing) {
          playerId = existing.id;
        } else {
          // Fallback: find by normalized name
          const normalizedName = normalizePlayerName(stat.name);
          const matchedPlayer = playerNameMap.get(normalizedName);

          if (matchedPlayer) {
            playerId = matchedPlayer.id;
            // Save the mapping for future lookups
            updateEuroleagueCode.run({
              euroleague_code: stat.euroleague_code,
              id: playerId,
            });
          }
        }

        if (!playerId) {
          unmatched++;
          // console.log(`   ⚠️ Could not match player: ${stat.name} (${stat.euroleague_code})`);
          continue;
        }

        matched++;

        // Insert stats (fantasy_points will be 0, updated later from Biwenger)
        insertStats.run({
          player_id: playerId,
          round_id: roundId,
          fantasy_points: 0, // Will be updated from Biwenger
          minutes: stat.minutes,
          points: stat.points,
          two_points_made: stat.two_points_made,
          two_points_attempted: stat.two_points_attempted,
          three_points_made: stat.three_points_made,
          three_points_attempted: stat.three_points_attempted,
          free_throws_made: stat.free_throws_made,
          free_throws_attempted: stat.free_throws_attempted,
          rebounds: stat.rebounds,
          assists: stat.assists,
          steals: stat.steals,
          blocks: stat.blocks,
          turnovers: stat.turnovers,
          fouls_committed: stat.fouls_committed,
          valuation: stat.valuation,
        });
      }
    })();

    console.log(`   ✅ Game ${gameCode}: ${matched} players matched, ${unmatched} unmatched`);
    return { success: true, matched, unmatched };
  } catch (error) {
    console.error(`   ❌ Error syncing game ${gameCode}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Sync fantasy points from Biwenger (to be called after Euroleague stats sync)
 * Updates the fantasy_points column for player_round_stats
 */
export async function syncBiwengerFantasyPoints(db, round, playersList) {
  // Import dynamically to avoid circular dependencies
  const { fetchRoundGames } = await import('../api/biwenger-client.js');

  const roundId = round.id;
  const dbRoundId = round.dbId || round.id;

  console.log(`💫 Syncing Biwenger fantasy points for round ${roundId}...`);

  try {
    const gamesData = await fetchRoundGames(roundId);

    if (!gamesData?.data?.games) {
      console.log('   ⚠️ No games data from Biwenger');
      return;
    }

    const updateFantasyPoints = db.prepare(`
      UPDATE player_round_stats 
      SET fantasy_points = @fantasy_points 
      WHERE player_id = @player_id AND round_id = @round_id
    `);

    let updated = 0;

    db.transaction(() => {
      for (const game of gamesData.data.games) {
        const processReports = (reports) => {
          if (!reports) return;
          for (const [, report] of Object.entries(reports)) {
            const playerId = report.player?.id;
            if (!playerId || !playersList[playerId]) continue;

            const result = updateFantasyPoints.run({
              fantasy_points: report.points || 0,
              player_id: playerId,
              round_id: dbRoundId,
            });

            if (result.changes > 0) updated++;
          }
        };

        processReports(game.home.reports);
        processReports(game.away.reports);
      }
    })();

    console.log(`   ✅ Updated fantasy points for ${updated} players`);
  } catch (error) {
    console.error(`   ❌ Error syncing fantasy points:`, error.message);
  }
}
