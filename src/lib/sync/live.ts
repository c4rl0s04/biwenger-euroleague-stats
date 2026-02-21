import { db } from '../db/client';
import { CONFIG } from '../config';
import { run as runSyncLineups } from './services/biwenger/lineups.js';
import {
  fetchSchedule,
  fetchBoxScore,
  parseBoxScoreStats,
  normalizePlayerName,
} from '../api/euroleague-client';
import { prepareEuroleagueMutations } from '../db/mutations/euroleague';
import { prepareMatchMutations } from '../db/mutations/matches';
import { calculateBiwengerPoints } from '../utils/fantasy-scoring';
import * as dotenv from 'dotenv';
import * as path from 'path';

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
  } catch (e: any) {
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
    if (!(global as any).lineupsChecked) (global as any).lineupsChecked = new Set();

    if (!(global as any).lineupsChecked.has(match.round_id)) {
      (global as any).lineupsChecked.add(match.round_id);

      const hasLineups =
        (await db.query('SELECT 1 FROM lineups WHERE round_id = $1 LIMIT 1', [match.round_id]))
          .rowCount !== null &&
        (await db.query('SELECT 1 FROM lineups WHERE round_id = $1 LIMIT 1', [match.round_id]))
          .rowCount! > 0;

      if (!hasLineups) {
        console.log(`   ⚠️ Lineups missing for Round ${match.round_id}. Syncing...`);

        // Convert array to map for lineup service
        const playersList = allPlayers.reduce((acc: any, p: any) => {
          acc[p.id] = p;
          return acc;
        }, {});

        const mockManager = {
          context: { db },
          log: (msg: string) => console.log(`      [Lineups] ${msg}`),
          error: (msg: string) => console.error(`      [Lineups] ❌ ${msg}`),
        };

        try {
          // Explicitly pass `mockManager as any` because we haven't typed the mock manager yet
          await runSyncLineups(
            mockManager as any,
            { id: match.round_id, name: match.round_name, status: 'active' },
            playersList
          );
        } catch (e: any) {
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

      const playerStats = parseBoxScoreStats(boxscore);
      console.log(`      📊 Found stats for ${playerStats.length} players.`);

      // B. Update Match Score
      // Strategy: Sum player points. Ideally matches team score perfectly.
      const homePlayers = playerStats.filter((p: any) => p.team_code === match.home_code);
      const awayPlayers = playerStats.filter((p: any) => p.team_code === match.away_code);

      const homeScore = homePlayers.reduce((acc: number, p: any) => acc + (p.points || 0), 0);
      const awayScore = awayPlayers.reduce((acc: number, p: any) => acc + (p.points || 0), 0);

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
            is_mvp: 0, // Using 0 for false since it maps to smallint
          });
          updatedPlayers++;
        }
      }
      console.log(`      ✅ Updated ${updatedPlayers} players.`);
    } catch (e: any) {
      console.error(`      ❌ Error syncing game ${gameCode}: ${e.message}`);
    }
  }

  console.log('\n🏁 Live Sync Completed.');
  process.exit(0);
}

runLiveSync();
