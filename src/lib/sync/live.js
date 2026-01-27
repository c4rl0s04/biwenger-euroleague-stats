import { db } from '../db/client.js';
import { CONFIG } from '../config.js';
import { run as runSyncLineups } from './services/biwenger/lineups.js';
import {
  fetchSchedule,
  fetchBoxScore,
  parseBoxScoreStats,
  normalizePlayerName,
} from '../api/euroleague-client.js';
import { prepareEuroleagueMutations } from '../db/mutations/euroleague.js';
import { prepareMatchMutations } from '../db/mutations/matches.js';
import { calculateBiwengerPoints } from '../../utils/fantasy-scoring.js';
import dotenv from 'dotenv';
import path from 'path';

// Load Env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

const CURRENT_SEASON = CONFIG.EUROLEAGUE.SEASON_CODE;

async function runLiveSync() {
  console.log('📡 Starting Euroleague Live Sync...');

  // 1. Get Active Round and Matches
  console.log('   🔎 Checking for live games...');
  const activeMatchesQuery = `
    SELECT 
      m.id, 
      m.date, 
      m.home_id, 
      m.away_id,
      m.round_id,
      m.round_name,
      th.code as home_code,
      ta.code as away_code,
      m.home_score,
      m.away_score,
      m.status
    FROM matches m
    JOIN teams th ON m.home_id = th.id
    JOIN teams ta ON m.away_id = ta.id
    WHERE 
      m.status != 'finished' 
      AND m.date < NOW() + INTERVAL '1 hour'
      AND m.date > NOW() - INTERVAL '5 hours'
  `;

  // Note: The time window (NOW - 5h to NOW + 1h) captures:
  // - Games currently playing (started < 2-3h ago)
  // - Games just about to start (started in < 1h from now... wait, +1h means future)
  // - Games that finished recently but status update might lag

  // Correction:
  // - Game started in the past (date < NOW)
  // - Game started less than ~4 hours ago (date > NOW - 4h)
  // - OR, use query without time strictness if 'status != finished' is reliable.
  // But Biwenger status might be slow. Trusted source is Euroleague.
  // Let's rely on DB 'status' not being finished, OR date being very recent.

  const matches = (await db.query(activeMatchesQuery)).rows;

  if (matches.length === 0) {
    console.log('   😴 No active games found. Exiting.');
    process.exit(0);
  }

  console.log(`   🔥 Found ${matches.length} potentially active matches.`);

  // 2. Prepare Maps
  const mutations = prepareEuroleagueMutations(db);
  const matchMutations = prepareMatchMutations(db);
  const allPlayers = await mutations.getAllPlayers();

  // Name Normalization Map
  const playerNameMap = new Map();
  for (const p of allPlayers) {
    const normalized = normalizePlayerName(p.name);
    playerNameMap.set(normalized, p);
  }

  // Fetch Euroleague Schedule for Game Code mapping (Only once)
  console.log('   📅 Fetching schedule map...');
  const gameCodeMap = new Map();
  try {
    const schedule = await fetchSchedule(CURRENT_SEASON);
    if (schedule?.schedule?.item) {
      const items = Array.isArray(schedule.schedule.item)
        ? schedule.schedule.item
        : [schedule.schedule.item];
      for (const item of items) {
        if (item.homecode && item.awaycode && item.game) {
          gameCodeMap.set(`${item.homecode.trim()}_${item.awaycode.trim()}`, item.game);
        }
      }
    }
  } catch (e) {
    console.error('   ❌ Failed to fetch schedule:', e.message);
    process.exit(1);
  }

  // 3. Loop Matches
  for (const match of matches) {
    const gameKey = `${match.home_code.trim()}_${match.away_code.trim()}`;
    const gameCode = gameCodeMap.get(gameKey);

    if (!gameCode) {
      console.log(
        `   ⚠️ No Euroleague game code found for ${match.home_code} vs ${match.away_code}`
      );
      continue;
    }

    // Check for lineups (One-time check per round)
    // We do this inside the loop but guarding with a Set to run once per round_id
    if (!global.lineupsChecked) global.lineupsChecked = new Set();

    if (!global.lineupsChecked.has(match.round_id)) {
      global.lineupsChecked.add(match.round_id);

      const hasLineups =
        (await db.query('SELECT 1 FROM lineups WHERE round_id = $1 LIMIT 1', [match.round_id]))
          .rowCount > 0;

      if (!hasLineups) {
        console.log(`   ⚠️ Lineups missing for Round ${match.round_id}. Syncing...`);

        // Convert array to map for lineup service
        const playersList = allPlayers.reduce((acc, p) => {
          acc[p.id] = p;
          return acc;
        }, {});

        const mockManager = {
          context: { db },
          log: (msg) => console.log(`      [Lineups] ${msg}`),
          error: (msg) => console.error(`      [Lineups] ❌ ${msg}`),
        };

        try {
          await runSyncLineups(
            mockManager,
            { id: match.round_id, name: match.round_name, status: 'active' },
            playersList
          );
        } catch (e) {
          console.error(`      ❌ Failed to sync lineups: ${e.message}`);
        }
      }
    }

    console.log(
      `\n   🏀 Processing Game ${gameCode} (${match.home_code} vs ${match.away_code})...`
    );

    try {
      // A. Fetch Live Boxscore
      const boxscore = await fetchBoxScore(gameCode, CURRENT_SEASON);
      if (!boxscore) {
        console.log('      ⏳ No boxscore data available yet.');
        continue;
      }

      // Check if game is actually live/finished in Euroleague Check
      // We can update match score/status here too!
      // Euroleague boxscore usually has "Quarter" or "Status" info?
      // boxscore structure is complex, let's look at stats first.

      // B. Update Match Score
      // Extract scores from boxscore (usually in Header or by summing points)
      // Best way: re-fetch GameHeader? Or use what we have.
      // Boxscore usually has: <TeamA points="X">...

      // Let's assume we can fetch header lightly or rely on boxscore parsing.
      // But fetchBoxScore result is JSON (from XML parser).
      // Let's inspect the structure from `fetchBoxScore`.
      // Actually, `parseBoxScoreStats` ignores team totals.

      // We will perform a quick sum of points from player stats as a fallback
      // OR better: fetchGameHeader (it's fast).

      /* 
         NOTE: fetchBoxScore actually returns the full object.
         Its structure: { game: { team: [ { @codeteam: "A", score: "88" }, ... ] } }
         Let's try to extract it directly.
      */

      let homeScore = 0;
      let awayScore = 0;

      // Safe extraction from typical Euroleague XML->JSON structure
      // Usually: boxscore.game refers to the root.
      // We need to know which team is Home and Away from the match object context.

      // Strategy: Sum player points. Ideally matches team score perfectly.
      const homePlayers = playerStats.filter((p) => p.team_code === match.home_code);
      const awayPlayers = playerStats.filter((p) => p.team_code === match.away_code);

      homeScore = homePlayers.reduce((acc, p) => acc + (p.points || 0), 0);
      awayScore = awayPlayers.reduce((acc, p) => acc + (p.points || 0), 0);

      // Update Match in DB
      if (homeScore > 0 || awayScore > 0) {
        // Status deduction
        // If we have data, it's at least "live".
        // If it was "scheduled", change to "live".
        const newStatus = match.status === 'finished' ? 'finished' : 'live';

        await matchMutations.updateMatchScore({
          id: match.id,
          home_score: homeScore,
          away_score: awayScore,
          status: newStatus,
        });
        console.log(
          `      ⚽ Match Score Updated: ${match.home_code} ${homeScore} - ${awayScore} ${match.away_code}`
        );
      }

      const playerStats = parseBoxScoreStats(boxscore);
      console.log(`      📊 Found stats for ${playerStats.length} players.`);

      let updatedPlayers = 0;

      for (const stat of playerStats) {
        // Calculate Fantasy Points LOCAL
        const fantasyPoints = calculateBiwengerPoints(stat);

        // Find Player
        let playerId = null;

        // 1. Try Euroleague Code
        const existing = await mutations.getPlayerByEuroleagueCode(stat.euroleague_code);
        if (existing) {
          playerId = existing.id;
        } else {
          // 2. Try Name Match
          const normalizedName = normalizePlayerName(stat.name);
          const matchedPlayer = playerNameMap.get(normalizedName);
          if (matchedPlayer) {
            playerId = matchedPlayer.id;
            // Update mapping for next time
            await mutations.updatePlayerEuroleagueCode({
              euroleague_code: stat.euroleague_code,
              id: playerId,
            });
          }
        }

        if (playerId) {
          // Update DB - Upsert into player_stats
          await mutations.insertPlayerStats({
            player_id: playerId,
            round_id: match.round_id,
            fantasy_points: fantasyPoints,
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
          updatedPlayers++;
        }
      }
      console.log(`      ✅ Updated ${updatedPlayers} players.`);
    } catch (e) {
      console.error(`      ❌ Error syncing game ${gameCode}: ${e.message}`);
    }
  }

  console.log('\n🏁 Live Sync Completed.');
  process.exit(0);
}

runLiveSync();
